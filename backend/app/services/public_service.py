"""
public_service.py — Business logic for Public Respondent actions

Handles public form viewing, starting responses, server-side answer validation,
submission recording, and drop-off tracking.
"""

from datetime import datetime
from typing import Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.enums import FormStatus
from app.models.form import Form
from app.models.response import Response
from app.models.answer import Answer
from app.validators import validate_answer, ValidationError
from app.schemas.public import (
    PublicSubmitPayload,
    ProgressPayload,
)


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

    response = Response(
        form_id=form.id,
        started_at=datetime.utcnow(),
        is_complete=False,
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

    errors: dict[str, str] = {}
    validated_answers: list[tuple[int, Any]] = []

    # Validate against ALL questions in the form
    for question in form.questions:
        raw_val = submitted_map.get(question.id)
        try:
            norm_val = validate_answer(question, raw_val)
            if norm_val is not None:
                validated_answers.append((question.id, norm_val))
        except ValidationError as err:
            errors[str(question.id)] = err.message

    if errors:
        raise FormSubmissionValidationError(errors)

    # Clean existing answers for this response if re-submitting a partial draft
    db.query(Answer).filter(Answer.response_id == response.id).delete()

    # Insert validated answers
    for q_id, val in validated_answers:
        answer = Answer(
            response_id=response.id,
            question_id=q_id,
            value=val,
        )
        db.add(answer)

    # Finalize response
    now = datetime.utcnow()
    response.submitted_at = now
    response.is_complete = True
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
