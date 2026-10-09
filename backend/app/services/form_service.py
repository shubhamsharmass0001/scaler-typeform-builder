"""
form_service.py — Business logic for Form management

Handles CRUD operations, slug generation, publishing lifecycle,
and form duplication. Routers delegate directly to these functions.
"""

import secrets
import string
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.enums import FormStatus, QuestionType
from app.models.form import Form, default_theme
from app.models.question import Question
from app.models.response import Response
from app.schemas.form import FormCreate, FormUpdate, FormListItem, PublishOut


def generate_unique_slug(db: Session, length: int = 8) -> str:
    """
    Generate an 8-character URL-safe alphanumeric slug.
    Checks for database collisions before returning.
    """
    chars = string.ascii_lowercase + string.digits
    while True:
        slug = "".join(secrets.choice(chars) for _ in range(length))
        exists = db.query(Form).filter(Form.slug == slug).first()
        if not exists:
            return slug


def list_forms(db: Session, user_id: int) -> list[FormListItem]:
    """
    List all forms belonging to the current user with response and question counts.
    Ordered by updated_at descending.
    """
    # Subquery for response counts per form
    resp_counts = (
        db.query(Response.form_id, func.count(Response.id).label("resp_count"))
        .group_by(Response.form_id)
        .subquery()
    )

    # Subquery for question counts per form
    q_counts = (
        db.query(Question.form_id, func.count(Question.id).label("q_count"))
        .group_by(Question.form_id)
        .subquery()
    )

    results = (
        db.query(
            Form,
            func.coalesce(resp_counts.c.resp_count, 0).label("response_count"),
            func.coalesce(q_counts.c.q_count, 0).label("question_count"),
        )
        .outerjoin(resp_counts, Form.id == resp_counts.c.form_id)
        .outerjoin(q_counts, Form.id == q_counts.c.form_id)
        .filter(Form.user_id == user_id)
        .order_by(Form.updated_at.desc())
        .all()
    )

    items: list[FormListItem] = []
    for form, resp_count, q_count in results:
        items.append(
            FormListItem(
                id=form.id,
                user_id=form.user_id,
                title=form.title,
                description=form.description,
                status=form.status,
                slug=form.slug,
                created_at=form.created_at,
                updated_at=form.updated_at,
                response_count=int(resp_count),
                question_count=int(q_count),
            )
        )
    return items


def create_form(db: Session, user_id: int, payload: FormCreate) -> Form:
    """
    Create a new form with default starter fields and auto-create
    one initial short_text question.
    """
    title = payload.title.strip() if payload.title and payload.title.strip() else "Untitled form"
    theme = payload.theme.model_dump() if hasattr(payload.theme, "model_dump") else (payload.theme or default_theme())

    form = Form(
        user_id=user_id,
        title=title,
        description=payload.description,
        status=FormStatus.DRAFT,
        theme=theme,
        welcome_title=payload.welcome_title,
        welcome_description=payload.welcome_description,
        welcome_button_text=payload.welcome_button_text or "Start",
        thank_you_title=payload.thank_you_title or "Thank you!",
        thank_you_message=payload.thank_you_message or "Your response has been recorded.",
    )
    db.add(form)
    db.flush()  # Allocate form.id

    # Auto-create one starter short_text question
    starter_question = Question(
        form_id=form.id,
        type=QuestionType.SHORT_TEXT,
        title="Your first question",
        description=None,
        required=False,
        position=0,
        properties={"placeholder": "Type your answer here..."},
    )
    db.add(starter_question)
    db.commit()
    db.refresh(form)
    return form


def get_form_by_id(db: Session, form_id: int, user_id: int) -> Form:
    """
    Fetch a single form with ordered questions, scoped to user.
    Raises 404 if not found.
    """
    form = (
        db.query(Form)
        .options(joinedload(Form.questions))
        .filter(Form.id == form_id, Form.user_id == user_id)
        .first()
    )
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form with id {form_id} not found",
        )
    return form


def update_form(db: Session, form_id: int, user_id: int, payload: FormUpdate) -> Form:
    """
    Apply partial updates to form metadata.
    Raises 404 if not found.
    """
    form = get_form_by_id(db, form_id, user_id)

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(form, key, value)

    db.commit()
    db.refresh(form)
    return form


def delete_form(db: Session, form_id: int, user_id: int) -> None:
    """
    Delete a form. Database and ORM cascades clean up questions, responses, and answers.
    Raises 404 if not found.
    """
    form = get_form_by_id(db, form_id, user_id)
    db.delete(form)
    db.commit()


def duplicate_form(db: Session, form_id: int, user_id: int) -> Form:
    """
    Deep-copy a form and all its questions.
    The duplicated form has:
      - Title prefixed with "Copy of "
      - status: draft
      - slug: None (unassigned until published)
      - identical questions and theme
      - NO responses or answers copied
    """
    original = get_form_by_id(db, form_id, user_id)

    new_form = Form(
        user_id=user_id,
        title=f"Copy of {original.title}",
        description=original.description,
        status=FormStatus.DRAFT,
        slug=None,
        theme=original.theme.copy() if original.theme else default_theme(),
        welcome_title=original.welcome_title,
        welcome_description=original.welcome_description,
        welcome_button_text=original.welcome_button_text,
        thank_you_title=original.thank_you_title,
        thank_you_message=original.thank_you_message,
    )
    db.add(new_form)
    db.flush()

    # Duplicate questions
    for q in original.questions:
        dup_q = Question(
            form_id=new_form.id,
            type=q.type,
            title=q.title,
            description=q.description,
            required=q.required,
            position=q.position,
            properties=q.properties.copy() if isinstance(q.properties, dict) else {},
        )
        db.add(dup_q)

    db.commit()
    db.refresh(new_form)
    return new_form


def publish_form(db: Session, form_id: int, user_id: int) -> PublishOut:
    """
    Publish a form. Generates an 8-character URL-safe slug on first publish.
    Sets status to published and returns the public path.
    """
    form = get_form_by_id(db, form_id, user_id)

    # Generate slug if not yet assigned
    if not form.slug:
        form.slug = generate_unique_slug(db, length=8)

    form.status = FormStatus.PUBLISHED
    db.commit()
    db.refresh(form)

    return PublishOut(
        status=form.status,
        slug=form.slug,
        public_url=f"/forms/{form.slug}",
    )


def unpublish_form(db: Session, form_id: int, user_id: int) -> Form:
    """
    Unpublish a form, reverting status back to draft.
    Keeps the existing slug intact for when it is re-published.
    """
    form = get_form_by_id(db, form_id, user_id)
    form.status = FormStatus.DRAFT
    db.commit()
    db.refresh(form)
    return form
