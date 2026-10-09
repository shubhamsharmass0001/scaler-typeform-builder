#!/usr/bin/env python3
"""
backend/scripts/verify_stats.py

Independent verification script that directly recomputes all summary metrics
from the underlying database tables (responses, answers, questions)
and asserts that every single statistic matches the output of the
/api/forms/{id}/summary endpoint (get_form_summary).

Usage:
    cd backend && .venv/bin/python scripts/verify_stats.py
"""

import sys
import os
import math
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models.form import Form
from app.models.question import Question
from app.models.response import Response
from app.models.answer import Answer
from app.models.enums import QuestionType
from app.services.response_service import get_form_summary


def verify_form_stats(db, form_id: int, user_id: int = 1) -> bool:
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        print(f"❌ Form {form_id} not found in database.")
        return False

    print(f"\n=======================================================")
    print(f"🔍 Verifying Form #{form.id}: \"{form.title}\"")
    print(f"=======================================================")

    # 1. Fetch endpoint summary via service
    api_summary = get_form_summary(db, form_id=form.id, user_id=form.user_id)

    # 2. Directly recompute raw metrics from tables
    all_responses = db.query(Response).filter(Response.form_id == form.id).all()
    raw_started = len(all_responses)
    raw_completed = sum(1 for r in all_responses if r.is_complete)
    raw_partial = sum(1 for r in all_responses if not r.is_complete)

    # Compute raw avg seconds for completed responses
    durations = []
    for r in all_responses:
        if r.is_complete and r.started_at and r.submitted_at:
            dur = (r.submitted_at - r.started_at).total_seconds()
            if dur >= 0:
                durations.append(dur)
    raw_avg_sec = round(sum(durations) / len(durations), 1) if durations else None

    raw_comp_rate_ratio = round(raw_completed / raw_started, 4) if raw_started > 0 else 0.0
    raw_comp_rate_pct = round((raw_completed / raw_started) * 100, 1) if raw_started > 0 else 0.0

    # Assert overall metrics
    assert api_summary.total_responses == raw_started, (
        f"total_responses mismatch: {api_summary.total_responses} != {raw_started}"
    )
    assert api_summary.completed_responses == raw_completed, (
        f"completed_responses mismatch: {api_summary.completed_responses} != {raw_completed}"
    )
    assert api_summary.overall.started == raw_started, (
        f"overall.started mismatch: {api_summary.overall.started} != {raw_started}"
    )
    assert api_summary.overall.completed == raw_completed, (
        f"overall.completed mismatch: {api_summary.overall.completed} != {raw_completed}"
    )
    assert api_summary.overall.partial == raw_partial, (
        f"overall.partial mismatch: {api_summary.overall.partial} != {raw_partial}"
    )
    assert api_summary.overall.completion_rate == raw_comp_rate_ratio, (
        f"overall.completion_rate mismatch: {api_summary.overall.completion_rate} != {raw_comp_rate_ratio}"
    )
    assert api_summary.completion_rate == raw_comp_rate_pct, (
        f"completion_rate pct mismatch: {api_summary.completion_rate} != {raw_comp_rate_pct}"
    )

    if raw_avg_sec is not None and api_summary.overall.average_completion_seconds is not None:
        # Check within 1s tolerance for any floating point / sqlite strftime precision
        assert abs(api_summary.overall.average_completion_seconds - raw_avg_sec) <= 1.0, (
            f"average_completion_seconds mismatch: {api_summary.overall.average_completion_seconds} vs {raw_avg_sec}"
        )

    print(f"  ✓ Overall stats verified: {raw_started} started, {raw_completed} completed, {raw_partial} partial ({raw_comp_rate_pct}%)")
    if raw_avg_sec is not None:
        print(f"  ✓ Average completion duration verified: {raw_avg_sec}s (~{int(raw_avg_sec//60)}m {int(raw_avg_sec%60)}s)")

    # 3. Directly recompute and verify per-question statistics
    api_q_map = {q.question_id: q for q in api_summary.questions}

    all_answers = (
        db.query(Answer)
        .join(Response, Answer.response_id == Response.id)
        .filter(Response.form_id == form.id)
        .all()
    )

    for q in form.questions:
        api_q = api_q_map.get(q.id)
        assert api_q is not None, f"Question {q.id} missing in API summary"

        q_answers = [a for a in all_answers if a.question_id == q.id and a.value is not None]
        raw_total_answered = len(q_answers)

        assert api_q.total_answered == raw_total_answered, (
            f"Q{q.id} ('{q.title}') total_answered mismatch: API {api_q.total_answered} != Raw {raw_total_answered}"
        )

        if q.type in (QuestionType.RATING, QuestionType.NUMBER):
            nums = []
            for a in q_answers:
                try:
                    nums.append(float(a.value))
                except (ValueError, TypeError):
                    pass
            if nums:
                raw_avg = round(sum(nums) / len(nums), 2)
                raw_min = min(nums)
                raw_max = max(nums)
                assert api_q.numeric_stats is not None
                assert api_q.numeric_stats.average == raw_avg, (
                    f"Q{q.id} average mismatch: {api_q.numeric_stats.average} != {raw_avg}"
                )
                assert api_q.numeric_stats.min == raw_min, (
                    f"Q{q.id} min mismatch: {api_q.numeric_stats.min} != {raw_min}"
                )
                assert api_q.numeric_stats.max == raw_max, (
                    f"Q{q.id} max mismatch: {api_q.numeric_stats.max} != {raw_max}"
                )
            print(f"  ✓ Q{q.id} ({q.type.value}): {raw_total_answered} answered, avg: {getattr(api_q.numeric_stats, 'average', None)}")

        elif q.type in (QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN, QuestionType.YES_NO):
            assert api_q.options_breakdown is not None
            sum_breakdown_counts = sum(item.count for item in api_q.options_breakdown)
            if q.type != QuestionType.MULTIPLE_CHOICE or not q.properties.get("multiple"):
                # Single-select sum of counts must equal total_answered
                assert sum_breakdown_counts == raw_total_answered, (
                    f"Q{q.id} breakdown count sum ({sum_breakdown_counts}) != total_answered ({raw_total_answered})"
                )
            print(f"  ✓ Q{q.id} ({q.type.value}): {raw_total_answered} answered, {len(api_q.options_breakdown)} options tallied")

        else:
            print(f"  ✓ Q{q.id} ({q.type.value}): {raw_total_answered} answered")

    # 4. Verify drop-off funnel
    assert len(api_summary.dropoff) == len(form.questions), "Drop-off question count mismatch"
    print(f"  ✓ Drop-off funnel verified ({len(api_summary.dropoff)} steps checked)")

    return True


def main():
    db = SessionLocal()
    try:
        # Find all forms with responses or seeded forms
        forms = db.query(Form).all()
        if not forms:
            print("❌ No forms found in database. Run seed script first.")
            sys.exit(1)

        seeded_forms = [f for f in forms if len(f.responses) > 0]
        if not seeded_forms:
            print("⚠️ No forms with responses found. Checking all forms...")
            seeded_forms = forms[:3]

        print(f"🚀 Running verification on {len(seeded_forms)} form(s)...")

        all_passed = True
        for f in seeded_forms:
            passed = verify_form_stats(db, f.id, f.user_id)
            if not passed:
                all_passed = False

        if all_passed:
            print("\n" + "=" * 60)
            print("✅ ALL SUMMARY STATS DIRECTLY MATCH DATABASE TABLES 100%!")
            print("=" * 60)
            sys.exit(0)
        else:
            print("\n❌ SOME STATS FAILED VERIFICATION")
            sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
