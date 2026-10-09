"""
public_service.py — Business logic for Public Respondent actions

Handles public form viewing, starting responses, server-side answer validation,
submission recording, and drop-off tracking.
"""

from datetime import datetime
from typing import Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.enums import FormStatus, QuestionType
from app.models.form import Form
from app.models.response import Response
from app.models.answer import Answer
from app.models.upload import Upload
from app.validators import validate_answer, ValidationError
from app.validators.registry import _is_empty
from app.schemas.public import (
    PublicSubmitPayload,
    ProgressPayload,
)
from app.services import logic


class FormSubmissionValidationError(Exception):
    """
    Raised when one or more submitted answers fail validation.
    Contains a mapping of question_id (as str) to error message.
    """
    def __init__(self, errors: dict[str, str]):
        self.errors = errors
        super().__init__(f"Validation failed: {errors}")


def get_public_form_by_slug(db: Session, slug: str) -> Form:
    """
    Fetch a published form by its URL slug.
    Raises 404 if not found or if the form is still a draft.
    """
    form = (
        db.query(Form)
        .options(joinedload(Form.questions))
        .filter(Form.slug == slug)
        .first()
    )
    if not form or form.status != FormStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found or not published",
        )
    return form


def start_response_session(db: Session, slug: str) -> int:
    """
    Initialize a new respondent session and return the response_id.
    """
    form = get_public_form_by_slug(db, slug)

    first_q = min(form.questions, key=lambda q: q.position, default=None) if form.questions else None

    response = Response(
        form_id=form.id,
        started_at=datetime.utcnow(),
        is_complete=False,
        last_question_id=first_q.id if first_q else None,
    )
    db.add(response)
    db.commit()
    db.refresh(response)
    return response.id


def submit_form_response(
    db: Session,
    slug: str,
    payload: PublicSubmitPayload,
) -> tuple[int, datetime]:
    """
    Process form submission:
      1. Verifies form is published.
      2. Resolves or creates response session (rejects double submission).
      3. Validates ALL answers server-side, collecting errors per question.
      4. If any errors occur, raises FormSubmissionValidationError with {"errors": {"<qid>": "msg"}}.
      5. On success, persists answers, marks is_complete=True, sets submitted_at.
    """
    form = get_public_form_by_slug(db, slug)

    if payload.response_id is not None:
        response = (
            db.query(Response)
            .filter(Response.id == payload.response_id, Response.form_id == form.id)
            .first()
        )
        if not response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Response session not found",
            )
        if response.is_complete:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This response has already been submitted",
            )
    else:
        # Auto-create session if not started upfront
        response = Response(
            form_id=form.id,
            started_at=datetime.utcnow(),
            is_complete=False,
        )
        db.add(response)
        db.flush()

    # Map answers submitted by question_id
    submitted_map: dict[int, Any] = {a.question_id: a.value for a in payload.answers}

    # Policy for bypassed questions:
    # We compute the visited path based on the respondent's answers.
    # Questions outside the visited path:
    # 1. 'required' is only enforced on questions IN the visited path. Skipped questions are not errors.
    # 2. Answers submitted for bypassed questions with values are rejected with 422 per-question error,
    #    preventing stale or invalid branch data from persisting.
    visited_path = logic.compute_visited_path(form, submitted_map)
    visited_ids = {q.id for q in visited_path}
    visited_ids.update({str(q.id) for q in visited_path})

    errors: dict[str, str] = {}
    validated_answers: list[tuple[int, Any]] = []

    # Validate ONLY against questions in the visited path
    for question in visited_path:
        raw_val = submitted_map.get(question.id)
        if raw_val is None and str(question.id) in submitted_map:
            raw_val = submitted_map.get(str(question.id))
        try:
            norm_val = validate_answer(question, raw_val)
            if norm_val is not None:
                validated_answers.append((question.id, norm_val))
        except ValidationError as err:
            errors[str(question.id)] = err.message

    # Reject answers submitted for questions outside the form or outside the visited path
    form_question_ids = {q.id for q in form.questions}
    for a in payload.answers:
        q_id_int = int(a.question_id) if isinstance(a.question_id, (int, str)) and str(a.question_id).isdigit() else None
        if q_id_int not in form_question_ids and a.question_id not in form_question_ids:
            errors[str(a.question_id)] = "Question does not belong to this form"
        elif a.question_id not in visited_ids and str(a.question_id) not in visited_ids:
            if not _is_empty(a.value):
                errors[str(a.question_id)] = "Question was bypassed by logic and cannot be answered"

    # Validate file_upload answers: upload exists, belongs to form, not already attached to another response
    for q_id, val in validated_answers:
        q_obj = next((q for q in visited_path if q.id == q_id), None)
        if q_obj and q_obj.type == QuestionType.FILE_UPLOAD and val is not None:
            upload_rec = db.query(Upload).filter(
                Upload.id == val,
                Upload.form_id == form.id,
            ).first()
            if not upload_rec:
                errors[str(q_id)] = "Upload does not exist or does not belong to this form"
            elif upload_rec.response_id is not None and upload_rec.response_id != response.id:
                errors[str(q_id)] = "This file has already been attached to another response"

    if errors:
        raise FormSubmissionValidationError(errors)

    # Clean existing answers for this response if re-submitting a partial draft
    db.query(Answer).filter(Answer.response_id == response.id).delete()

    # Insert validated answers and attach uploads to response
    for q_id, val in validated_answers:
        answer = Answer(
            response_id=response.id,
            question_id=q_id,
            value=val,
        )
        db.add(answer)

        q_obj = next((q for q in visited_path if q.id == q_id), None)
        if q_obj and q_obj.type == QuestionType.FILE_UPLOAD and val is not None:
            upload_rec = db.query(Upload).filter(Upload.id == val).first()
            if upload_rec:
                upload_rec.response_id = response.id

    # Finalize response
    now = datetime.utcnow()
    response.submitted_at = now
    response.is_complete = True
    if visited_path:
        response.last_question_id = visited_path[-1].id
    db.commit()

    return response.id, now


def record_drop_off_progress(
    db: Session,
    slug: str,
    payload: ProgressPayload,
) -> tuple[int, int]:
    """
    Record respondent's progress through questions for drop-off funnel analytics.
    """
    form = get_public_form_by_slug(db, slug)

    response = (
        db.query(Response)
        .filter(Response.id == payload.response_id, Response.form_id == form.id)
        .first()
    )
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response session not found",
        )

    if not response.is_complete:
        response.last_question_id = payload.last_question_id
        db.commit()

    return response.id, response.last_question_id
