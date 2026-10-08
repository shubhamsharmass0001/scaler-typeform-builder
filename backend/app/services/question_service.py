"""
question_service.py — Business logic for Question management

Handles atomic bulk save, reordering, and individual question modifications.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.form import Form
from app.models.question import Question
from app.schemas.question import BulkQuestionItem


def bulk_save_questions(
    db: Session,
    form_id: int,
    user_id: int,
    questions_in: list[BulkQuestionItem],
) -> list[Question]:
    """
    Atomically sync the questions for a form:
      1. Verifies form ownership.
      2. Maps existing questions by id.
      3. For questions with an id: updates attributes and assigns position = array index.
      4. For questions without an id: inserts new Question with position = array index.
      5. Deletes existing questions that are missing from the incoming payload.
      6. Commits in a single transaction and returns the ordered list with real ids.
    """
    form = db.query(Form).filter(Form.id == form_id, Form.user_id == user_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form with id {form_id} not found",
        )

    # Existing questions indexed by id
    existing_questions = {q.id: q for q in form.questions}
    kept_ids: set[int] = set()
    result_questions: list[Question] = []

    for index, item in enumerate(questions_in):
        if item.id and item.id in existing_questions:
            # Update existing question
            q = existing_questions[item.id]
            q.type = item.type
            q.title = item.title
            q.description = item.description
            q.required = item.required
            q.position = index
            q.properties = item.properties
            kept_ids.add(q.id)
            result_questions.append(q)
        else:
            # Insert new question
            new_q = Question(
                form_id=form_id,
                type=item.type,
                title=item.title,
                description=item.description,
                required=item.required,
                position=index,
                properties=item.properties,
            )
            db.add(new_q)
            result_questions.append(new_q)

    # Delete any questions that were omitted from the payload
    for q_id, q in existing_questions.items():
        if q_id not in kept_ids:
            db.delete(q)

    db.commit()

    # Re-query ordered questions to ensure all IDs and generated timestamps are populated
    saved_questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .order_by(Question.position.asc())
        .all()
    )
    return saved_questions
