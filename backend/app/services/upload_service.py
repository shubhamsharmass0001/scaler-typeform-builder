"""
upload_service.py — Business logic and security enforcement for File Uploads

Features:
  - Enforce size limit (1-10 MB, default 5 MB, based on question properties)
  - Allow-list MIME types AND verify matching extension
  - Magic bytes inspection to prevent extension spoofing and dangerous executable payloads
  - Path traversal and special character sanitization (never trust client filename)
  - IP-based rate limiting
  - Rejection of uploads on draft / unpublished forms
  - Creator-only download streaming
"""

import os
import re
import time
import uuid
from typing import Optional
from fastapi import HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.models.enums import FormStatus, QuestionType
from app.models.form import Form
from app.models.upload import Upload, UPLOAD_DIR
from app.models.question import Question
from app.schemas.upload import UploadOut

# In-memory sliding window rate limiter: client_ip -> list of epoch timestamps
_RATE_LIMIT_STORE: dict[str, list[float]] = {}
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 30

# Allowed type categories mapping to extensions, MIME types, and magic byte checkers
CATEGORY_MAPPING: dict[str, dict[str, list[str]]] = {
    "image": {
        "extensions": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
        "mimes": ["image/png", "image/jpeg", "image/gif", "image/webp"],
    },
    "pdf": {
        "extensions": [".pdf"],
        "mimes": ["application/pdf"],
    },
    "doc": {
        "extensions": [".doc", ".docx", ".txt", ".csv"],
        "mimes": [
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/csv",
        ],
    },
}

EXTENSION_TO_MIMES: dict[str, list[str]] = {
    ".png": ["image/png"],
    ".jpg": ["image/jpeg"],
    ".jpeg": ["image/jpeg"],
    ".gif": ["image/gif"],
    ".webp": ["image/webp"],
    ".pdf": ["application/pdf"],
    ".doc": ["application/msword", "application/octet-stream"],
    ".docx": [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip",
        "application/octet-stream",
    ],
    ".txt": ["text/plain"],
    ".csv": ["text/csv", "text/plain", "application/vnd.ms-excel"],
}


def _check_rate_limit(client_ip: str) -> None:
    """Enforce maximum 30 uploads per minute per client IP."""
    now = time.time()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS

    timestamps = _RATE_LIMIT_STORE.get(client_ip, [])
    # Prune old timestamps
    active = [t for t in timestamps if t > cutoff]
    if len(active) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Upload rate limit exceeded. Please wait a moment before trying again.",
        )
    active.append(now)
    _RATE_LIMIT_STORE[client_ip] = active


def _sanitize_filename(raw_filename: Optional[str]) -> str:
    """
    Sanitize filename against path-traversal (../, absolute paths, null bytes)
    and strip dangerous characters.
    """
    if not raw_filename:
        return "upload.bin"

    # Strip directory paths
    base = os.path.basename(raw_filename)
    # Remove null bytes
    base = base.replace("\x00", "")
    # Remove path traversal sequences
    base = base.replace("..", "_")
    # Replace any character other than alphanumerics, hyphens, underscores, dots, and spaces
    sanitized = re.sub(r"[^a-zA-Z0-9_.\-\s]", "_", base).strip()
    if not sanitized or sanitized.startswith("."):
        sanitized = f"upload_{sanitized.lstrip('.')}"
    return sanitized[:255]


def _verify_magic_bytes(header: bytes, ext: str) -> None:
    """
    Inspect magic header bytes to guard against extension spoofing and executables.
    """
    # 1. Dangerous executable signatures
    if header.startswith(b"MZ"):  # Windows PE / EXE
        raise HTTPException(status_code=422, detail="Executable files (PE/EXE) are strictly prohibited")
    if header.startswith(b"\x7fELF"):  # Linux ELF
        raise HTTPException(status_code=422, detail="Executable binaries (ELF) are strictly prohibited")
    if header.startswith(b"#!"):  # Shell scripts
        raise HTTPException(status_code=422, detail="Executable script files are strictly prohibited")

    # 2. Match expected content signatures
    if ext == ".pdf":
        if not header.startswith(b"%PDF-"):
            raise HTTPException(status_code=422, detail="File content is not a valid PDF document (spoofed extension)")
    elif ext == ".png":
        if not header.startswith(b"\x89PNG\r\n\x1a\n"):
            raise HTTPException(status_code=422, detail="File content is not a valid PNG image (spoofed extension)")
    elif ext in (".jpg", ".jpeg"):
        if not header.startswith(b"\xff\xd8\xff"):
            raise HTTPException(status_code=422, detail="File content is not a valid JPEG image (spoofed extension)")
    elif ext == ".gif":
        if not (header.startswith(b"GIF87a") or header.startswith(b"GIF89a")):
            raise HTTPException(status_code=422, detail="File content is not a valid GIF image (spoofed extension)")
    elif ext == ".webp":
        if not (header.startswith(b"RIFF") and b"WEBP" in header[:16]):
            raise HTTPException(status_code=422, detail="File content is not a valid WebP image (spoofed extension)")
    elif ext == ".docx":
        if not header.startswith(b"PK\x03\x04"):
            raise HTTPException(status_code=422, detail="File content is not a valid DOCX document (spoofed extension)")
    elif ext == ".doc":
        if not header.startswith(b"\xd0\xcf\x11\xe0"):
            raise HTTPException(status_code=422, detail="File content is not a valid DOC document (spoofed extension)")


def save_upload(
    db: Session,
    slug: str,
    file: UploadFile,
    client_ip: str,
    question_id: Optional[int] = None,
) -> UploadOut:
    """
    Process public file upload:
      - Reject on unpublished forms
      - Enforce IP rate limit
      - Check question-specific or default size limits and allowed types
      - Verify extension and MIME match
      - Inspect magic bytes
      - Store with UUID name on disk and persist Upload record
    """
    _check_rate_limit(client_ip)

    # 1. Reject on unpublished forms
    form = db.query(Form).filter(Form.slug == slug).first()
    if not form or form.status != FormStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found or not published",
        )

    # 2. Determine allowed types and max size
    max_size_mb = 5
    allowed_types_config = ["image", "pdf", "doc"]

    target_q: Optional[Question] = None
    if question_id:
        target_q = db.query(Question).filter(
            Question.id == question_id,
            Question.form_id == form.id,
            Question.type == QuestionType.FILE_UPLOAD,
        ).first()

    if not target_q:
        # Look for any file_upload question in this form
        target_q = next(
            (q for q in form.questions if q.type == QuestionType.FILE_UPLOAD),
            None,
        )

    if target_q and target_q.properties:
        props = target_q.properties
        if "maxSizeMB" in props:
            try:
                val = int(props["maxSizeMB"])
                max_size_mb = max(1, min(10, val))
            except (ValueError, TypeError):
                pass
        if "allowedTypes" in props and isinstance(props["allowedTypes"], list):
            allowed_types_config = [str(t).lower() for t in props["allowedTypes"]]

    # Build allowed extensions and allowed MIME sets
    allowed_extensions: set[str] = set()
    allowed_mimes: set[str] = set()

    for item in allowed_types_config:
        item = item.strip().lower()
        if item in CATEGORY_MAPPING:
            allowed_extensions.update(CATEGORY_MAPPING[item]["extensions"])
            allowed_mimes.update(CATEGORY_MAPPING[item]["mimes"])
        else:
            # Maybe specified as an extension like ".pdf" or "pdf"
            ext_norm = item if item.startswith(".") else f".{item}"
            allowed_extensions.add(ext_norm)
            if ext_norm in EXTENSION_TO_MIMES:
                allowed_mimes.update(EXTENSION_TO_MIMES[ext_norm])

    # If nothing configured, default to image, pdf, doc
    if not allowed_extensions:
        for cat in ("image", "pdf", "doc"):
            allowed_extensions.update(CATEGORY_MAPPING[cat]["extensions"])
            allowed_mimes.update(CATEGORY_MAPPING[cat]["mimes"])

    # 3. Filename & extension sanitization
    sanitized_original = _sanitize_filename(file.filename)
    ext = os.path.splitext(sanitized_original)[1].lower()

    if not ext or ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File extension '{ext}' is not permitted. Allowed: {', '.join(sorted(allowed_extensions))}",
        )

    # 4. MIME type check
    content_type = (file.content_type or "").lower().split(";")[0].strip()
    expected_mimes = EXTENSION_TO_MIMES.get(ext, [])
    if expected_mimes and content_type not in expected_mimes and content_type != "application/octet-stream":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"MIME type '{content_type}' does not match file extension '{ext}'",
        )

    # 5. Read chunks and enforce size limit
    max_bytes = max_size_mb * 1024 * 1024
    content = bytearray()
    chunk_size = 64 * 1024  # 64 KB

    while True:
        chunk = file.file.read(chunk_size)
        if not chunk:
            break
        content.extend(chunk)
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {max_size_mb} MB",
            )

    total_bytes = len(content)
    if total_bytes == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot upload an empty file",
        )

    # 6. Verify magic bytes / prevent extension spoofing
    _verify_magic_bytes(bytes(content[:512]), ext)

    # 7. Write to disk under backend/uploads/
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, stored_name)

    with open(dest_path, "wb") as f_out:
        f_out.write(content)

    # 8. Record in database
    upload_record = Upload(
        form_id=form.id,
        original_name=sanitized_original,
        stored_name=stored_name,
        mime_type=content_type or "application/octet-stream",
        size_bytes=total_bytes,
    )
    db.add(upload_record)
    db.commit()
    db.refresh(upload_record)

    return UploadOut(
        upload_id=upload_record.id,
        name=upload_record.original_name,
        size=upload_record.size_bytes,
    )


def stream_upload_file(
    db: Session,
    form_id: int,
    upload_id: int,
    user_id: int,
) -> FileResponse:
    """
    Stream uploaded file to authenticated creator.
    Verifies form ownership and upload existence.
    """
    form = db.query(Form).filter(Form.id == form_id, Form.user_id == user_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form with id {form_id} not found",
        )

    upload = db.query(Upload).filter(
        Upload.id == upload_id,
        Upload.form_id == form_id,
    ).first()
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload with id {upload_id} not found",
        )

    file_path = os.path.join(UPLOAD_DIR, upload.stored_name)
    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server disk",
        )

    safe_filename = upload.original_name.replace('"', '\\"')
    return FileResponse(
        path=file_path,
        media_type=upload.mime_type or "application/octet-stream",
        filename=upload.original_name,
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}"',
        },
    )
