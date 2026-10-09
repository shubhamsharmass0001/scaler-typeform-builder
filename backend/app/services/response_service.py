"""
response_service.py — Business logic for Responses, Analytics, and CSV Export

Handles response querying, detailed breakdown joining question titles,
statistical summaries, drop-off analysis, and CSV report generation.
"""

import csv
import io
import math
from typing import Any, Optional
from fastapi import HTTPException, status
from sqlalchemy import func, case, and_, or_, exists
from sqlalchemy.orm import Session, joinedload, aliased

from app.models.enums import QuestionType
from app.models.form import Form
from app.models.question import Question
from app.models.response import Response
from app.models.answer import Answer
from app.models.upload import Upload
from app.schemas.response import (
    ResponseOut,
    ResponseDetailOut,
    AnswerWithQuestionOut,
    PaginatedResponsesOut,
)
from app.schemas.summary import (
    FormSummaryOut,
    OverallStats,
    DropoffQuestion,
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
    status_filter: str | None = None,
) -> PaginatedResponsesOut:
    """
    Return a paginated list of responses for a form, newest first.
    Includes nested answers for each response.
    Supports optional status filtering ('completed' or 'partial').
    """
    form = _get_form_or_404(db, form_id, user_id)

    q_count = db.query(Response).filter(Response.form_id == form_id)
    if status_filter == "completed":
        q_count = q_count.filter(Response.is_complete == True)  # noqa: E712
    elif status_filter == "partial":
        q_count = q_count.filter(Response.is_complete == False)  # noqa: E712
    total = q_count.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    q_responses = (
        db.query(Response)
        .options(joinedload(Response.answers))
        .filter(Response.form_id == form_id)
    )
    if status_filter == "completed":
        q_responses = q_responses.filter(Response.is_complete == True)  # noqa: E712
    elif status_filter == "partial":
        q_responses = q_responses.filter(Response.is_complete == False)  # noqa: E712

    responses = (
        q_responses
        .order_by(Response.started_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Map form uploads for enriching file_upload questions in table view
    uploads_map = {u.id: u for u in db.query(Upload).filter(Upload.form_id == form_id).all()}
    file_q_ids = {q.id for q in form.questions if q.type == QuestionType.FILE_UPLOAD}

    items = []
    for r in responses:
        item = ResponseOut.model_validate(r)
        if file_q_ids:
            for ans in item.answers:
                if ans.question_id in file_q_ids and ans.value is not None:
                    try:
                        u_id = int(ans.value)
                        if u_id in uploads_map:
                            u = uploads_map[u_id]
                            ans.value = {
                                "upload_id": u.id,
                                "filename": u.original_name,
                                "size": u.size_bytes,
                            }
                    except (ValueError, TypeError):
                        pass
        items.append(item)

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
        .options(joinedload(Response.answers), joinedload(Response.uploads))
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
    uploads_map = {u.id: u for u in db.query(Upload).filter(Upload.form_id == form_id).all()}

    answers_augmented: list[AnswerWithQuestionOut] = []
    for ans in response.answers:
        q = question_map.get(ans.question_id)
        val = ans.value
        if q and q.type == QuestionType.FILE_UPLOAD and val is not None:
            try:
                u_id = int(val)
                if u_id in uploads_map:
                    u = uploads_map[u_id]
                    val = {
                        "upload_id": u.id,
                        "filename": u.original_name,
                        "size": u.size_bytes,
                    }
            except (ValueError, TypeError):
                pass

        answers_augmented.append(
            AnswerWithQuestionOut(
                id=ans.id,
                response_id=ans.response_id,
                question_id=ans.question_id,
                question_title=q.title if q else "Deleted Question",
                question_type=q.type if q else QuestionType.SHORT_TEXT,
                value=val,
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
    Delete a single response record. Cascades to dependent answers and uploads.
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

    # Delete uploads attached to this response (triggers cleanup hook)
    for u in response.uploads:
        db.delete(u)

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

    # 1. Overall metrics via SQL aggregate query
    overall_row = (
        db.query(
            func.count(Response.id).label("started"),
            func.sum(case((Response.is_complete == True, 1), else_=0)).label("completed"),
            func.sum(case((Response.is_complete == False, 1), else_=0)).label("partial"),
            func.avg(
                case(
                    (
                        and_(Response.is_complete == True, Response.submitted_at.isnot(None)),
                        func.strftime("%s", Response.submitted_at) - func.strftime("%s", Response.started_at),
                    ),
                    else_=None,
                )
            ).label("avg_seconds"),
        )
        .filter(Response.form_id == form_id)
        .first()
    )

    started = int(overall_row[0] or 0) if overall_row else 0
    completed = int(overall_row[1] or 0) if overall_row else 0
    partial = int(overall_row[2] or 0) if overall_row else 0
    avg_seconds = round(float(overall_row[3]), 1) if (overall_row and overall_row[3] is not None) else None
    completion_rate_ratio = round(completed / started, 4) if started > 0 else 0.0
    completion_rate_pct = round((completed / started) * 100, 1) if started > 0 else 0.0

    overall_stats = OverallStats(
        started=started,
        completed=completed,
        partial=partial,
        completion_rate=completion_rate_ratio,
        average_completion_seconds=avg_seconds,
    )

    # 2. Drop-off funnel analysis
    ordered_questions = sorted(form.questions, key=lambda q: q.position)
    dropped_counts: dict[int, int] = {q.id: 0 for q in ordered_questions}

    if partial > 0 and ordered_questions:
        partial_rows = (
            db.query(Response.last_question_id)
            .filter(Response.form_id == form_id, Response.is_complete == False)
            .all()
        )
        for prow in partial_rows:
            last_qid = prow[0]
            if last_qid in dropped_counts:
                dropped_counts[last_qid] += 1
            else:
                # Fallback to the first question if unassigned
                dropped_counts[ordered_questions[0].id] += 1

    dropoff_list: list[DropoffQuestion] = []
    drop_off_stats: dict[str, int] = {}
    current_reached = started

    for q in ordered_questions:
        dropped = dropped_counts.get(q.id, 0)
        pct = round((dropped / current_reached) * 100, 1) if current_reached > 0 else 0.0
        dropoff_list.append(
            DropoffQuestion(
                question_id=q.id,
                title=q.title,
                position=q.position,
                reached_count=current_reached,
                dropped_here_count=dropped,
                dropoff_percent=pct,
            )
        )
        if dropped > 0:
            drop_off_stats[str(q.id)] = dropped
        current_reached = max(0, current_reached - dropped)

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

    for q in ordered_questions:
        q_answers = answers_by_question.get(q.id, [])
        valid_answers = [a for a in q_answers if a.value is not None]
        total_answered = len(valid_answers)

        options_breakdown = None
        numeric_stats = None
        text_stats = None

        if q.type in (QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN, QuestionType.YES_NO):
            # Tally counts for each chosen option
            counts: dict[str, int] = {}
            # Initialize configured options with 0 counts in order
            configured_options: list[str] = []
            if q.type == QuestionType.YES_NO:
                configured_options = ["Yes", "No"]
            else:
                opts = (q.properties or {}).get("options", [])
                for opt in opts:
                    if isinstance(opt, dict):
                        lbl = str(opt.get("label", opt.get("id", "")))
                        if lbl:
                            configured_options.append(lbl)
                    elif isinstance(opt, str) and opt:
                        configured_options.append(opt)

            for opt_label in configured_options:
                counts[opt_label] = 0

            for a in valid_answers:
                val = a.value
                if isinstance(val, bool):
                    label = "Yes" if val else "No"
                    counts[label] = counts.get(label, 0) + 1
                elif isinstance(val, list):
                    for item in val:
                        resolved_label = _resolve_option_label(q, item)
                        if resolved_label:
                            counts[resolved_label] = counts.get(resolved_label, 0) + 1
                else:
                    resolved_label = _resolve_option_label(q, val)
                    if resolved_label:
                        counts[resolved_label] = counts.get(resolved_label, 0) + 1

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
        total_responses=started,
        completed_responses=completed,
        completion_rate=completion_rate_pct,
        drop_off_stats=drop_off_stats,
        overall=overall_stats,
        dropoff=dropoff_list,
        questions=question_summaries,
    )


def _slugify(text: str) -> str:
    """Convert a title to a filesystem-safe slug (ASCII, lowercase, hyphens)."""
    import re
    import unicodedata
    # Normalize unicode to ASCII
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-{2,}", "-", text)
    return text[:60].strip("-") or "form"


def _guard_formula(value: str) -> str:
    """
    CSV formula-injection guard.
    Prefix cells starting with = + - @ or whitespace control chars with a single quote
    so Excel/Sheets don't interpret them as formulas.
    """
    FORMULA_STARTERS = ("=", "+", "-", "@", "\t", "\r")
    if value and value[0] in FORMULA_STARTERS:
        return "'" + value
    return value


def _resolve_option_label(question: Any, raw_value: Any) -> str:
    """
    Resolve a raw answer value (which may be an option ID or an option label)
    to its human-readable label by looking up the question's properties.options list.
    Falls back to str(raw_value) if no match is found.
    """
    if raw_value is None:
        return ""
    if isinstance(raw_value, dict):
        return str(raw_value.get("label") or raw_value.get("id") or "")

    options = (question.properties or {}).get("options", [])
    if not options or not isinstance(options, list):
        return str(raw_value)

    option_map: dict[str, str] = {}
    for opt in options:
        if isinstance(opt, dict):
            opt_id = str(opt.get("id", ""))
            opt_label = str(opt.get("label", opt_id))
            if opt_id:
                option_map[opt_id] = opt_label
            if opt_label:
                option_map[opt_label] = opt_label
    return option_map.get(str(raw_value), str(raw_value))


def _format_answer_for_csv(question: Any, val: Any, uploads_map: Optional[dict[int, str]] = None) -> str:
    """
    Format a single answer value for CSV output based on question type:
      - yes_no:          Yes / No
      - multiple_choice / dropdown: option label (resolved from ID), multi joined with "; "
      - rating / number: plain number string
      - file_upload:     original filename of the uploaded file
      - text / email:    plain string with formula-injection guard
    """
    if val is None or val == "":
        return ""

    q_type = question.type

    if q_type == QuestionType.YES_NO:
        if isinstance(val, bool):
            return "Yes" if val else "No"
        s = str(val).lower()
        if s in ("true", "yes", "1"):
            return "Yes"
        if s in ("false", "no", "0"):
            return "No"
        return _guard_formula(str(val))

    if q_type in (QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN):
        if isinstance(val, str) and val.startswith("[") and val.endswith("]"):
            try:
                import json
                parsed = json.loads(val)
                if isinstance(parsed, list):
                    val = parsed
            except Exception:
                pass
        if isinstance(val, list):
            labels = [_resolve_option_label(question, item) for item in val if item is not None and item != ""]
            return _guard_formula("; ".join(labels))
        return _guard_formula(_resolve_option_label(question, val))

    if q_type in (QuestionType.RATING, QuestionType.NUMBER):
        try:
            num = float(val)
            return str(int(num) if num == int(num) else num)
        except (ValueError, TypeError):
            return _guard_formula(str(val))

    if q_type == QuestionType.FILE_UPLOAD:
        if isinstance(val, dict) and "filename" in val:
            return _guard_formula(str(val["filename"]))
        if uploads_map and val is not None:
            try:
                u_id = int(val)
                if u_id in uploads_map:
                    return _guard_formula(str(uploads_map[u_id]))
            except (ValueError, TypeError):
                pass
        return _guard_formula(str(val))

    # SHORT_TEXT, LONG_TEXT, EMAIL — guard against formula injection
    return _guard_formula(str(val))


def stream_responses_csv(
    db: Session,
    form_id: int,
    user_id: int,
    status_filter: str | None = None,
) -> tuple[Any, str]:
    """
    Generate a streaming iterator of UTF-8 encoded bytes for form responses CSV with UTF-8 BOM.
    Returns (iterator_of_bytes, suggested_filename).

    Columns:
      Response ID | Status | Started At (UTC) | Submitted At (UTC) | [question titles in order]

    Features:
      - UTF-8 BOM so Excel auto-detects unicode
      - Content-Disposition filename: <slugified-title>-responses-<YYYY-MM-DD>.csv
      - Duplicate question title disambiguation: "Name", "Name (2)", "Name (3)"
      - option-label resolution (not raw IDs) for choice/dropdown
      - multi-select joined with "; "
      - Yes/No for yes_no questions
      - Filename for file_upload questions
      - Formula-injection guard (prefix = + - @ with single quote)
      - optional ?status=completed|partial filter
    """
    from datetime import date as dt_date

    form = _get_form_or_404(db, form_id, user_id)

    # Determine a clean filename
    today = dt_date.today().isoformat()
    safe_title = _slugify(form.title or f"form-{form_id}")
    filename = f"{safe_title}-responses-{today}.csv"

    # Preload uploads map for filename resolution
    uploads_map = {u.id: u.original_name for u in db.query(Upload).filter(Upload.form_id == form_id).all()}

    # Sort questions by position
    ordered_questions = sorted(form.questions, key=lambda q: q.position)

    # Disambiguate duplicate question titles
    seen_titles: dict[str, int] = {}
    disambiguated_titles: list[str] = []
    for q in ordered_questions:
        base = (q.title or "").strip() or "(Untitled)"
        count = seen_titles.get(base, 0) + 1
        seen_titles[base] = count
        disambiguated_titles.append(base if count == 1 else f"{base} ({count})")

    # Fetch responses (join answers eagerly)
    q_obj = (
        db.query(Response)
        .options(joinedload(Response.answers))
        .filter(Response.form_id == form_id)
    )
    if status_filter == "completed":
        q_obj = q_obj.filter(Response.is_complete == True)  # noqa: E712
    elif status_filter == "partial":
        q_obj = q_obj.filter(Response.is_complete == False)  # noqa: E712
    responses = q_obj.order_by(Response.started_at.desc()).all()

    def _fmt_dt(dt: Any) -> str:
        if dt is None:
            return ""
        try:
            # Ensure UTC suffix for ISO 8601
            iso = dt.isoformat()
            return iso if iso.endswith("Z") or "+" in iso else iso + "Z"
        except Exception:
            return str(dt)

    def generate_csv_bytes():
        # Prepend UTF-8 BOM so Excel opens unicode correctly
        yield b"\xef\xbb\xbf"

        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

        # Header row
        header = ["Response ID", "Status", "Started At (UTC)", "Submitted At (UTC)"] + disambiguated_titles
        writer.writerow(header)
        yield output.getvalue().encode("utf-8")
        output.seek(0)
        output.truncate(0)

        # Data rows
        for r in responses:
            answers_by_qid = {a.question_id: a.value for a in r.answers}
            status_label = "Completed" if r.is_complete else "Partial"

            row: list[str] = [
                str(r.id),
                status_label,
                _fmt_dt(r.started_at),
                _fmt_dt(r.submitted_at),
            ]

            for q in ordered_questions:
                val = answers_by_qid.get(q.id)
                row.append(_format_answer_for_csv(q, val, uploads_map=uploads_map))

            writer.writerow(row)
            yield output.getvalue().encode("utf-8")
            output.seek(0)
            output.truncate(0)

    return generate_csv_bytes(), filename


def export_responses_csv(
    db: Session,
    form_id: int,
    user_id: int,
    status_filter: str | None = None,
) -> tuple[bytes, str]:
    """
    Generate a hardened CSV of form responses and return (bytes_with_bom, suggested_filename).
    """
    stream, filename = stream_responses_csv(db, form_id, user_id, status_filter)
    return b"".join(stream), filename

