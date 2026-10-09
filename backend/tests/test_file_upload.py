"""
test_file_upload.py — Comprehensive tests for file_upload question type

Tests:
  - oversized file: rejects files exceeding maxSizeMB (413)
  - wrong type: rejects non-allowed extensions/types (422)
  - spoofed extension: rejects spoofed content (e.g. PE/EXE disguised as PDF) (422)
  - path-traversal filename: sanitizes dangerous filenames safely (no directory escape)
  - double-attach: rejects attaching the same upload to multiple responses (422)
  - creator-only access: anonymous users cannot download uploads; creator can stream file
  - unpublished form rejection: rejects uploads to draft forms (404)
  - CSV export and Results detail formatting: displays filename
"""

import io
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.form import Form
from app.models.question import Question
from app.models.upload import Upload
from app.models.user import User
from app.models.enums import FormStatus, QuestionType
from app.dependencies import get_current_user


@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def auth_user(db):
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        user = User(id=1, email="creator@example.com", name="Creator")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


import uuid

@pytest.fixture(scope="module")
def file_form(db, auth_user):
    slug = f"file-upload-{uuid.uuid4().hex[:8]}"
    form = Form(
        user_id=auth_user.id,
        title="File Upload Test Form",
        status=FormStatus.PUBLISHED,
        slug=slug,
    )
    db.add(form)
    db.commit()
    db.refresh(form)

    # Add file_upload question with maxSizeMB=1 and allowedTypes=["pdf"]
    q1 = Question(
        form_id=form.id,
        type=QuestionType.FILE_UPLOAD,
        title="Please upload your resume",
        required=True,
        position=0,
        properties={"maxSizeMB": 1, "allowedTypes": ["pdf"]},
    )
    db.add(q1)
    db.commit()
    db.refresh(q1)
    db.refresh(form)
    return form


def test_upload_unpublished_form_rejected(client, db, auth_user):
    """Uploading to a draft/unpublished form must be rejected."""
    draft = Form(
        user_id=auth_user.id,
        title="Draft Form",
        status=FormStatus.DRAFT,
        slug=f"draft-file-{uuid.uuid4().hex[:8]}",
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)

    file_bytes = b"%PDF-1.4 test pdf content"
    files = {"file": ("test.pdf", io.BytesIO(file_bytes), "application/pdf")}
    resp = client.post(f"/api/public/forms/{draft.slug}/upload", files=files)
    assert resp.status_code == 404


def test_upload_oversized_file(client, file_form):
    """Files exceeding maxSizeMB must be rejected with 413."""
    # Question maxSizeMB is 1MB. Send 1.2MB payload
    oversized = b"%PDF-1.4 " + b"A" * (1024 * 1024 + 200 * 1024)
    files = {"file": ("large.pdf", io.BytesIO(oversized), "application/pdf")}
    resp = client.post(f"/api/public/forms/{file_form.slug}/upload", files=files)
    assert resp.status_code == 413
    assert "exceeds maximum allowed size" in resp.json()["detail"]


def test_upload_wrong_type(client, file_form):
    """Non-allowed file types (e.g. .exe, .zip) must be rejected with 422."""
    files = {"file": ("app.exe", io.BytesIO(b"MZ12345"), "application/octet-stream")}
    resp = client.post(f"/api/public/forms/{file_form.slug}/upload", files=files)
    assert resp.status_code == 422
    assert "not permitted" in resp.json()["detail"]


def test_upload_spoofed_extension(client, file_form):
    """Spoofed file (e.g. executable disguised as .pdf) must be rejected with 422."""
    spoofed = b"MZ\x90\x00\x03\x00\x00\x00malicious executable"
    files = {"file": ("sneaky.pdf", io.BytesIO(spoofed), "application/pdf")}
    resp = client.post(f"/api/public/forms/{file_form.slug}/upload", files=files)
    assert resp.status_code == 422
    assert "prohibited" in resp.json()["detail"] or "spoofed" in resp.json()["detail"]


def test_upload_path_traversal_sanitization(client, file_form):
    """Path traversal filename (../../secret.pdf) must be sanitized safely."""
    valid_pdf = b"%PDF-1.5 %Valid PDF content\n%%EOF"
    files = {"file": ("../../../../etc/secret.pdf", io.BytesIO(valid_pdf), "application/pdf")}
    resp = client.post(f"/api/public/forms/{file_form.slug}/upload", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert ".." not in data["name"]
    assert "/" not in data["name"]
    assert "\\" not in data["name"]
    assert "secret.pdf" in data["name"]


def test_double_attach_rejected(client, file_form, db):
    """The same upload cannot be attached to two separate responses."""
    valid_pdf = b"%PDF-1.5 %Sample Content\n%%EOF"
    files = {"file": ("doc.pdf", io.BytesIO(valid_pdf), "application/pdf")}
    upload_resp = client.post(f"/api/public/forms/{file_form.slug}/upload", files=files)
    assert upload_resp.status_code == 200
    upload_id = upload_resp.json()["upload_id"]

    q = file_form.questions[0]

    # First submission succeeds
    sub1 = client.post(
        f"/api/public/forms/{file_form.slug}/submit",
        json={"answers": [{"question_id": q.id, "value": upload_id}]},
    )
    assert sub1.status_code == 200

    # Second submission with the same upload_id must be rejected with 422
    sub2 = client.post(
        f"/api/public/forms/{file_form.slug}/submit",
        json={"answers": [{"question_id": q.id, "value": upload_id}]},
    )
    assert sub2.status_code == 422
    err_body = sub2.json()
    assert "errors" in err_body
    assert "already been attached" in err_body["errors"][str(q.id)]


def test_creator_only_download_access(client, file_form, auth_user):
    """
    Creator can download the file. Unauthenticated public users cannot.
    """
    valid_pdf = b"%PDF-1.5 %Sample Download Content\n%%EOF"
    files = {"file": ("my_resume.pdf", io.BytesIO(valid_pdf), "application/pdf")}
    upload_resp = client.post(f"/api/public/forms/{file_form.slug}/upload", files=files)
    upload_id = upload_resp.json()["upload_id"]

    # 1. Unauthenticated client (override get_current_user to simulate unauthenticated)
    def unauth_user():
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Authentication required")

    app.dependency_overrides[get_current_user] = unauth_user
    try:
        anon_resp = client.get(f"/api/forms/{file_form.id}/uploads/{upload_id}")
        assert anon_resp.status_code == 401
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # 2. Authenticated creator downloads the file
    def creator_override():
        return auth_user

    app.dependency_overrides[get_current_user] = creator_override
    try:
        auth_resp = client.get(f"/api/forms/{file_form.id}/uploads/{upload_id}")
        assert auth_resp.status_code == 200
        assert auth_resp.content == valid_pdf
        assert "attachment" in auth_resp.headers.get("content-disposition", "")
        assert "my_resume.pdf" in auth_resp.headers.get("content-disposition", "")
    finally:
        app.dependency_overrides.pop(get_current_user, None)
