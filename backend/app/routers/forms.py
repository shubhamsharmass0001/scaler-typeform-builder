"""
routers/forms.py — Creator-facing REST API for form design, questions, and responses

Thin HTTP layer delegating all business logic to services.
Every query is strictly scoped to the active creator user.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.form import (
    FormCreate,
    FormUpdate,
    FormOut,
    FormListItem,
    PublishOut,
    MessageOut,
)
from app.schemas.question import (
    BulkQuestionItem,
    QuestionOut,
)
from app.schemas.response import (
    PaginatedResponsesOut,
    ResponseDetailOut,
)
from app.schemas.summary import FormSummaryOut
from app.services import form_service, question_service, response_service

router = APIRouter()


# ---------------------------------------------------------------------------
# Form CRUD & Lifecycle
# ---------------------------------------------------------------------------

@router.get("", response_model=list[FormListItem], summary="List forms")
@router.get("/", response_model=list[FormListItem], include_in_schema=False)
def list_forms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all forms belonging to the current user.
    Includes status, response_count, question_count, and timestamps.
    """
    return form_service.list_forms(db, user_id=current_user.id)


@router.post("", response_model=FormOut, status_code=status.HTTP_201_CREATED, summary="Create form")
@router.post("/", response_model=FormOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_form(
    payload: FormCreate = FormCreate(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new form with default starter values and an auto-created short_text question.
    """
    return form_service.create_form(db, user_id=current_user.id, payload=payload)


@router.get("/{id}", response_model=FormOut, summary="Get form by ID")
def get_form(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch a single form with its full list of ordered questions.
    """
    return form_service.get_form_by_id(db, form_id=id, user_id=current_user.id)


@router.patch("/{id}", response_model=FormOut, summary="Partial update form")
def update_form(
    id: int,
    payload: FormUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Partially update form metadata (title, theme, welcome/thank-you screens, etc.).
    """
    return form_service.update_form(db, form_id=id, user_id=current_user.id, payload=payload)


@router.delete("/{id}", response_model=MessageOut, summary="Delete form")
def delete_form(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a form and all its dependent questions, responses, and answers.
    """
    form_service.delete_form(db, form_id=id, user_id=current_user.id)
    return MessageOut(detail=f"Form {id} deleted successfully")


@router.post("/{id}/duplicate", response_model=FormOut, status_code=status.HTTP_201_CREATED, summary="Duplicate form")
def duplicate_form(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deep-copy a form and all its questions into a new draft form.
    Responses are excluded.
    """
    return form_service.duplicate_form(db, form_id=id, user_id=current_user.id)


@router.post("/{id}/publish", response_model=PublishOut, summary="Publish form")
def publish_form(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Publish a form. Generates a unique 8-character URL-safe slug on first publish.
    """
    return form_service.publish_form(db, form_id=id, user_id=current_user.id)


@router.post("/{id}/unpublish", response_model=FormOut, summary="Unpublish form")
def unpublish_form(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Revert a published form back to draft status.
    """
    return form_service.unpublish_form(db, form_id=id, user_id=current_user.id)


# ---------------------------------------------------------------------------
# Bulk Question Operations
# ---------------------------------------------------------------------------

@router.put("/{id}/questions", response_model=list[QuestionOut], summary="Bulk save questions")
def bulk_save_questions(
    id: int,
    questions: list[BulkQuestionItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Bulk save questions: accepts the full ordered list of questions.
    Upserts by ID, deletes omitted questions, assigns position from array index,
    and returns the persisted list with IDs in a single atomic transaction.
    """
    return question_service.bulk_save_questions(
        db,
        form_id=id,
        user_id=current_user.id,
        questions_in=questions,
    )


# ---------------------------------------------------------------------------
# Responses & Analytics
# ---------------------------------------------------------------------------

@router.get("/{id}/responses", response_model=PaginatedResponsesOut, summary="List responses (paginated)")
def get_responses(
    id: int,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List submissions for a form, newest first, with embedded answers.
    """
    return response_service.get_form_responses(
        db,
        form_id=id,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )


@router.get("/{id}/responses/{rid}", response_model=ResponseDetailOut, summary="Get single response details")
def get_response_detail(
    id: int,
    rid: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch a single response with answers joined to their question titles and types.
    """
    return response_service.get_response_detail(
        db,
        form_id=id,
        response_id=rid,
        user_id=current_user.id,
    )


@router.delete("/{id}/responses/{rid}", response_model=MessageOut, summary="Delete response")
def delete_response(
    id: int,
    rid: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete an individual response and its answers.
    """
    response_service.delete_response(
        db,
        form_id=id,
        response_id=rid,
        user_id=current_user.id,
    )
    return MessageOut(detail=f"Response {rid} deleted successfully")


@router.get("/{id}/summary", response_model=FormSummaryOut, summary="Get response summary analytics")
def get_summary(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get aggregated response metrics:
      - Choices/dropdown/yes_no: counts & percentages
      - Rating/number: average, min, max, distribution
      - Text/email: total answered & 5 most recent answers
      - Overall: total responses, completed count, completion rate, drop-off stats
    """
    return response_service.get_form_summary(
        db,
        form_id=id,
        user_id=current_user.id,
    )


@router.get("/{id}/export.csv", summary="Export responses as CSV")
def export_csv(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Download all form responses as a CSV file.
    Columns: Response ID, Started At, Submitted At, Completed, [Question titles...]
    """
    csv_content = response_service.export_responses_csv(
        db,
        form_id=id,
        user_id=current_user.id,
    )
    filename = f"form_{id}_responses.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
