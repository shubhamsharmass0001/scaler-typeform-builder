"""
response_service.py — Business logic for Responses, Analytics, and CSV Export

Handles response querying, detailed breakdown joining question titles,
statistical summaries, drop-off analysis, and CSV report generation.
"""

import csv
import io
import math
from typing import Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.enums import QuestionType
from app.models.form import Form
from app.models.question import Question
from app.models.response import Response
from app.models.answer import Answer
from app.schemas.response import (
    ResponseOut,
    ResponseDetailOut,
    AnswerWithQuestionOut,
    PaginatedResponsesOut,
)
from app.schemas.summary import (
    FormSummaryOut,
    QuestionSummary,
    OptionBreakdown,
    NumericStats,
    TextStats,
)


def _get_form_or_404(db: Session, form_id: int, user_id: int) -> Form:
    """Helper to verify form ownership and presence."""
    form = db.query(Form).filter(Form.id == form_id, Form.user_id == user_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form with id {form_id} not found",
        )
    return form


def get_form_responses(
    db: Session,
    form_id: int,
    user_id: int,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedResponsesOut:
    """
    Return a paginated list of responses for a form, newest first.
    Includes nested answers for each response.
    """
    _get_form_or_404(db, form_id, user_id)

    total = db.query(Response).filter(Response.form_id == form_id).count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    responses = (
        db.query(Response)
        .options(joinedload(Response.answers))
        .filter(Response.form_id == form_id)
        .order_by(Response.started_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [ResponseOut.model_validate(r) for r in responses]

    return PaginatedResponsesOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


def get_response_detail(
    db: Session,
    form_id: int,
    response_id: int,
    user_id: int,
) -> ResponseDetailOut:
    """
    Fetch a single response with its answers joined to question titles and types.
    """
    form = _get_form_or_404(db, form_id, user_id)

    response = (
        db.query(Response)
        .options(joinedload(Response.answers))
        .filter(Response.id == response_id, Response.form_id == form.id)
        .first()
    )
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Response with id {response_id} not found",
        )

    # Build question lookup map for quick title & type resolution
    question_map = {q.id: q for q in form.questions}

    answers_augmented: list[AnswerWithQuestionOut] = []
    for ans in response.answers:
        q = question_map.get(ans.question_id)
        answers_augmented.append(
            AnswerWithQuestionOut(
                id=ans.id,
                response_id=ans.response_id,
                question_id=ans.question_id,
                question_title=q.title if q else "Deleted Question",
                question_type=q.type if q else QuestionType.SHORT_TEXT,
                value=ans.value,
                created_at=ans.created_at,
            )
        )

    return ResponseDetailOut(
        id=response.id,
        form_id=response.form_id,
        started_at=response.started_at,
        submitted_at=response.submitted_at,
        is_complete=response.is_complete,
        last_question_id=response.last_question_id,
        answers=answers_augmented,
    )


def delete_response(
    db: Session,
    form_id: int,
    response_id: int,
    user_id: int,
) -> None:
    """
    Delete a single response record. Cascades to dependent answers.
    """
    _get_form_or_404(db, form_id, user_id)

    response = (
        db.query(Response)
        .filter(Response.id == response_id, Response.form_id == form_id)
        .first()
    )
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Response with id {response_id} not found",
        )

    db.delete(response)
    db.commit()


def get_form_summary(
    db: Session,
    form_id: int,
    user_id: int,
) -> FormSummaryOut:
    """
    Generate aggregate analytics:
      - Overall metrics: total, completed, completion rate, drop-off counts.
      - Per-question metrics:
          * choice/dropdown/yes_no: counts per option + percentages
          * rating/number: average, min, max, distribution
          * text/email: total answered + 5 most recent answers
    """
    form = _get_form_or_404(db, form_id, user_id)

    responses = db.query(Response).filter(Response.form_id == form_id).all()
    total_responses = len(responses)
    completed_responses = sum(1 for r in responses if r.is_complete)
    completion_rate = (
        round((completed_responses / total_responses) * 100, 1)
        if total_responses > 0
        else 0.0
    )

    # Drop-off analysis for incomplete responses
    drop_off_stats: dict[str, int] = {}
    for r in responses:
        if not r.is_complete and r.last_question_id:
            key = str(r.last_question_id)
            drop_off_stats[key] = drop_off_stats.get(key, 0) + 1

    # Fetch all answers for this form
    answers = (
        db.query(Answer)
        .join(Response, Answer.response_id == Response.id)
        .filter(Response.form_id == form_id)
        .order_by(Answer.created_at.desc())
        .all()
    )

    # Group answers by question_id
    answers_by_question: dict[int, list[Answer]] = {}
    for ans in answers:
        answers_by_question.setdefault(ans.question_id, []).append(ans)

    question_summaries: list[QuestionSummary] = []

    for q in form.questions:
        q_answers = answers_by_question.get(q.id, [])
        valid_answers = [a for a in q_answers if a.value is not None]
        total_answered = len(valid_answers)

        options_breakdown = None
        numeric_stats = None
        text_stats = None

        if q.type in (QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN, QuestionType.YES_NO):
            # Tally counts for each chosen option
            counts: dict[str, int] = {}
            # Initialize configured options with 0 counts
            configured_options: list[str] = []
            if q.type == QuestionType.YES_NO:
                configured_options = ["Yes", "No"]
            else:
                opts = q.properties.get("options", [])
                for opt in opts:
                    if isinstance(opt, dict):
                        configured_options.append(opt.get("label", opt.get("id", "")))
                    elif isinstance(opt, str):
                        configured_options.append(opt)

            for opt_label in configured_options:
                if opt_label:
                    counts[opt_label] = 0

            for a in valid_answers:
                val = a.value
                if isinstance(val, bool):
                    label = "Yes" if val else "No"
                    counts[label] = counts.get(label, 0) + 1
                elif isinstance(val, list):
                    for item in val:
                        s_item = str(item)
                        counts[s_item] = counts.get(s_item, 0) + 1
                else:
                    s_val = str(val)
                    counts[s_val] = counts.get(s_val, 0) + 1

            breakdown_list: list[OptionBreakdown] = []
            for opt_key, count in counts.items():
                pct = round((count / total_answered * 100), 1) if total_answered > 0 else 0.0
                breakdown_list.append(OptionBreakdown(option=opt_key, count=count, percentage=pct))

            options_breakdown = breakdown_list

        elif q.type in (QuestionType.RATING, QuestionType.NUMBER):
            nums: list[float] = []
            distribution: dict[str, int] = {}
            for a in valid_answers:
                try:
                    num_val = float(a.value)
                    nums.append(num_val)
                    key = str(int(num_val) if num_val.is_integer() else num_val)
                    distribution[key] = distribution.get(key, 0) + 1
                except (ValueError, TypeError):
                    continue

            if nums:
                numeric_stats = NumericStats(
                    average=round(sum(nums) / len(nums), 2),
                    min=min(nums),
                    max=max(nums),
                    distribution=distribution,
                )
            else:
                numeric_stats = NumericStats(
                    average=None,
                    min=None,
                    max=None,
                    distribution={},
                )

        elif q.type in (QuestionType.SHORT_TEXT, QuestionType.LONG_TEXT, QuestionType.EMAIL):
            recent_texts: list[str] = []
            for a in valid_answers:
                s = str(a.value).strip()
                if s and s not in recent_texts:
                    recent_texts.append(s)
                if len(recent_texts) >= 5:
                    break

            text_stats = TextStats(
                total_answered=total_answered,
                recent_answers=recent_texts,
            )

        question_summaries.append(
            QuestionSummary(
                question_id=q.id,
                title=q.title,
                type=q.type,
                total_answered=total_answered,
                options_breakdown=options_breakdown,
                numeric_stats=numeric_stats,
                text_stats=text_stats,
            )
        )

    return FormSummaryOut(
        form_id=form.id,
        total_responses=total_responses,
        completed_responses=completed_responses,
        completion_rate=completion_rate,
        drop_off_stats=drop_off_stats,
        questions=question_summaries,
    )


def export_responses_csv(
    db: Session,
    form_id: int,
    user_id: int,
) -> str:
    """
    Generate CSV text of all responses for a form.
    Format:
      - One row per response
      - One column per question
      - Standard metadata columns: Response ID, Started At, Submitted At, Completed
    """
    form = _get_form_or_404(db, form_id, user_id)

    # Sort questions by position
    ordered_questions = sorted(form.questions, key=lambda q: q.position)

    responses = (
        db.query(Response)
        .options(joinedload(Response.answers))
        .filter(Response.form_id == form_id)
        .order_by(Response.started_at.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    headers = ["Response ID", "Started At", "Submitted At", "Completed"]
    for q in ordered_questions:
        headers.append(q.title)
    writer.writerow(headers)

    # Data rows
    for r in responses:
        answers_by_qid = {a.question_id: a.value for a in r.answers}
        row: list[Any] = [
            r.id,
            r.started_at.isoformat() if r.started_at else "",
            r.submitted_at.isoformat() if r.submitted_at else "",
            "Yes" if r.is_complete else "No",
        ]

        for q in ordered_questions:
            val = answers_by_qid.get(q.id)
            if val is None:
                row.append("")
            elif isinstance(val, list):
                row.append(", ".join(str(item) for item in val))
            elif isinstance(val, bool):
                row.append("Yes" if val else "No")
            else:
                row.append(str(val))

        writer.writerow(row)

    return output.getvalue()
