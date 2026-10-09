"""
routers/public.py — Unauthenticated endpoints for form respondents

Handles loading published forms, starting response sessions,
submitting answers with server-side validation, and tracking drop-offs.
"""

from typing import Optional
from fastapi import APIRouter, Depends, status, Request, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.public import (
    PublicFormOut,
    StartResponseOut,
    PublicSubmitPayload,
    PublicSubmitOut,
    ProgressPayload,
    ProgressOut,
)
from app.schemas.upload import UploadOut
from app.services import public_service, upload_service

router = APIRouter()


@router.get("/forms/{slug}", response_model=PublicFormOut, summary="Get published form for respondent")
def get_public_form(
    slug: str,
    db: Session = Depends(get_db),
):
    """
    Fetch a published form and its questions by URL slug.
    Returns 404 if the form does not exist or is currently in draft status.
    """
    return public_service.get_public_form_by_slug(db, slug=slug)


@router.post("/forms/{slug}/start", response_model=StartResponseOut, status_code=status.HTTP_201_CREATED, summary="Start respondent session")
def start_response(
    slug: str,
    db: Session = Depends(get_db),
):
    """
    Initialize a response session tracking start time.
    Returns the response_id to be provided during submission.
    """
    response_id = public_service.start_response_session(db, slug=slug)
    return StartResponseOut(response_id=response_id)


@router.post("/forms/{slug}/submit", response_model=PublicSubmitOut, summary="Submit form answers")
def submit_response(
    slug: str,
    payload: PublicSubmitPayload,
    db: Session = Depends(get_db),
):
    """
    Submit answers for a published form.
    Validates all answers server-side against their question type rules.
    If validation fails, returns HTTP 422 with {"errors": {"<question_id>": "message"}}.
    """
    response_id, submitted_at = public_service.submit_form_response(
        db,
        slug=slug,
        payload=payload,
    )
    return PublicSubmitOut(
        status="success",
        response_id=response_id,
        submitted_at=submitted_at,
    )


@router.patch("/forms/{slug}/progress", response_model=ProgressOut, summary="Record drop-off progress")
def record_progress(
    slug: str,
    payload: ProgressPayload,
    db: Session = Depends(get_db),
):
    """
    Update the last question reached by the respondent for drop-off funnel tracking.
    """
    response_id, last_qid = public_service.record_drop_off_progress(
        db,
        slug=slug,
        payload=payload,
    )
    return ProgressOut(
        status="ok",
        response_id=response_id,
        last_question_id=last_qid,
    )


@router.post("/forms/{slug}/upload", response_model=UploadOut, summary="Upload file for question")
async def upload_file(
    slug: str,
    request: Request,
    file: UploadFile = File(...),
    question_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Public file upload for a published form.
    Validates size limit, MIME types and extensions, prevents path-traversal and spoofing,
    and enforces rate limiting.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    return upload_service.save_upload(
        db=db,
        slug=slug,
        file=file,
        client_ip=client_ip,
        question_id=question_id,
    )

