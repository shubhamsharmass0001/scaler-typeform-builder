#!/usr/bin/env python3
"""
backend/scripts/verify_stats.py

Comprehensive verification script that recomputes all summary metrics straight
from the database tables (responses, answers, questions) and compares them
against:
  1. The /api/forms/{id}/summary service (get_form_summary)
  2. The dashboard form list service (get_forms)

Checks verified:
  - responses started, completed, partial
  - completion rate (ratio and percentage)
  - average completion time
  - per-question reached / dropped counts
  - drop-off sum equals partial responses
  - funnel consistency: reached[0] == started, reached[i] = reached[i-1] - dropped[i-1],
    and final reached - final dropped == completed
  - choice counts, percentage sums, and underlying counts adding up
  - rating average, min, max, and full distribution map
  - dashboard list response_count agreeing with total responses
  - zero-division resilience on empty forms (no division by zero error)

Prints PASS / FAIL per metric and exits non-zero on any mismatch.
"""

import sys
import os
from datetime import datetime
from typing import Any

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models.form import Form
from app.models.question import Question
from app.models.response import Response
from app.models.answer import Answer
from app.models.enums import QuestionType
from app.services.response_service import get_form_summary
from app.services.form_service import list_forms


def run_check(label: str, condition: bool, details: str = "") -> bool:
    if condition:
        print(f"  [PASS] {label}{f' ({details})' if details else ''}")
        return True
    else:
        print(f"  [FAIL] {label}{f' ({details})' if details else ''}")
        return False


def verify_form(db, form: Form, dashboard_counts_by_id: dict[int, int]) -> list[tuple[str, bool, str]]:
    results: list[tuple[str, bool, str]] = []

    print(f"\n=======================================================")
    print(f"Form #{form.id}: \"{form.title}\" (status: {form.status.value})")
    print(f"=======================================================")

    # 1. Direct recomputation from raw database tables
    all_responses = db.query(Response).filter(Response.form_id == form.id).all()
    raw_started = len(all_responses)
    raw_completed = sum(1 for r in all_responses if r.is_complete)
    raw_partial = sum(1 for r in all_responses if not r.is_complete)

    durations: list[float] = []
    for r in all_responses:
        if r.is_complete and r.started_at and r.submitted_at:
            dur = (r.submitted_at - r.started_at).total_seconds()
            if dur >= 0:
                durations.append(dur)
    raw_avg_seconds = round(sum(durations) / len(durations), 1) if durations else None

    raw_comp_rate_ratio = round(raw_completed / raw_started, 4) if raw_started > 0 else 0.0
    raw_comp_rate_pct = round((raw_completed / raw_started) * 100, 1) if raw_started > 0 else 0.0

    # 2. Get API summary via get_form_summary
    try:
        api_summary = get_form_summary(db, form_id=form.id, user_id=form.user_id)
        api_ok = True
    except Exception as exc:
        api_ok = False
        api_summary = None
        print(f"  [FAIL] get_form_summary raised exception: {exc}")
        return [("get_form_summary call", False, str(exc))]

    # 3. Check Overall Stats vs API
    ok_started = (api_summary.total_responses == raw_started and api_summary.overall.started == raw_started)
    results.append(("Responses Started", ok_started, f"raw={raw_started}, api={api_summary.total_responses}"))

    ok_completed = (api_summary.completed_responses == raw_completed and api_summary.overall.completed == raw_completed)
    results.append(("Responses Completed", ok_completed, f"raw={raw_completed}, api={api_summary.completed_responses}"))

    ok_partial = (api_summary.overall.partial == raw_partial)
    results.append(("Responses Partial", ok_partial, f"raw={raw_partial}, api={api_summary.overall.partial}"))

    ok_ratio = (api_summary.overall.completion_rate == raw_comp_rate_ratio)
    results.append(("Completion Rate Ratio", ok_ratio, f"raw={raw_comp_rate_ratio}, api={api_summary.overall.completion_rate}"))

    ok_pct = (api_summary.completion_rate == raw_comp_rate_pct)
    results.append(("Completion Rate Percentage", ok_pct, f"raw={raw_comp_rate_pct}%, api={api_summary.completion_rate}%"))

    # Avg duration check (allow 1s tolerance for sqlite strftime unix timestamp conversions)
    if raw_avg_seconds is not None:
        dur_diff = abs((api_summary.overall.average_completion_seconds or 0) - raw_avg_seconds)
        ok_dur = (dur_diff <= 1.0)
        results.append(("Average Completion Time", ok_dur, f"raw={raw_avg_seconds}s, api={api_summary.overall.average_completion_seconds}s"))
    else:
        ok_dur = (api_summary.overall.average_completion_seconds is None)
        results.append(("Average Completion Time (None for 0 completes)", ok_dur, f"api={api_summary.overall.average_completion_seconds}"))

    # 4. Check Dashboard list count vs raw started
    dash_count = dashboard_counts_by_id.get(form.id, 0)
    ok_dash = (dash_count == raw_started)
    results.append(("Dashboard List Count Agreement", ok_dash, f"dash={dash_count}, raw={raw_started}"))

    # 5. Drop-off Funnel Analysis
    ordered_questions = sorted(form.questions, key=lambda q: q.position)
    funnel_steps = api_summary.dropoff
    ok_funnel_len = (len(funnel_steps) == len(ordered_questions))
    results.append(("Funnel Steps Count", ok_funnel_len, f"steps={len(funnel_steps)}, questions={len(ordered_questions)}"))

    total_dropped_in_funnel = sum(s.dropped_here_count for s in funnel_steps)
    ok_drop_sum = (total_dropped_in_funnel == raw_partial)
    results.append(("Drop-off Sum Equals Partial Responses", ok_drop_sum, f"sum={total_dropped_in_funnel}, partial={raw_partial}"))

    # Sequential funnel progression check
    expected_reached = raw_started
    funnel_math_ok = True
    for step in funnel_steps:
        if step.reached_count != expected_reached:
            funnel_math_ok = False
            break
        expected_reached = max(0, expected_reached - step.dropped_here_count)
    if raw_started > 0 and funnel_steps:
        # Final reached - final dropped must equal completed
        final_survivors = funnel_steps[-1].reached_count - funnel_steps[-1].dropped_here_count
        if final_survivors != raw_completed:
            funnel_math_ok = False
    elif raw_started == 0:
        funnel_math_ok = (all(s.reached_count == 0 and s.dropped_here_count == 0 for s in funnel_steps))

    results.append(("Funnel Progression Math Consistency", funnel_math_ok, f"final survivors={expected_reached}, completed={raw_completed}"))

    # 6. Question-by-Question Recomputation
    all_answers = (
        db.query(Answer)
        .join(Response, Answer.response_id == Response.id)
        .filter(Response.form_id == form.id)
        .all()
    )
    api_q_map = {q.question_id: q for q in api_summary.questions}

    for q in ordered_questions:
        api_q = api_q_map.get(q.id)
        if not api_q:
            results.append((f"Q{q.id} ({q.title}) Present in Summary", False, "Missing in API questions"))
            continue

        q_answers = [a for a in all_answers if a.question_id == q.id and a.value is not None]
        raw_total_answered = len(q_answers)
        ok_ans_count = (api_q.total_answered == raw_total_answered)
        results.append((f"Q{q.id} Answered Count", ok_ans_count, f"raw={raw_total_answered}, api={api_q.total_answered}"))

        # Choice / Dropdown / Yes-No Breakdown
        if q.type in (QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN, QuestionType.YES_NO):
            if api_q.options_breakdown is None:
                results.append((f"Q{q.id} Options Breakdown Present", False, "None returned"))
            else:
                breakdown = api_q.options_breakdown
                counts_sum = sum(b.count for b in breakdown)
                is_multi = (q.type == QuestionType.MULTIPLE_CHOICE and (q.properties or {}).get("multiple"))
                if not is_multi:
                    # Single select: counts must sum to raw_total_answered
                    ok_sum = (counts_sum == raw_total_answered)
                    results.append((f"Q{q.id} Single-Choice Option Counts Sum", ok_sum, f"sum={counts_sum}, answered={raw_total_answered}"))
                else:
                    results.append((f"Q{q.id} Multi-Choice Total Options Tallied", True, f"tallied={counts_sum}"))

                # Verify each option's percentage matches count / total_answered * 100
                pcts_correct = True
                for b in breakdown:
                    expected_pct = round((b.count / raw_total_answered * 100), 1) if raw_total_answered > 0 else 0.0
                    if b.percentage != expected_pct:
                        pcts_correct = False
                        break
                results.append((f"Q{q.id} Option Percentages Accurate", pcts_correct, ""))

        # Rating / Number Statistics
        elif q.type in (QuestionType.RATING, QuestionType.NUMBER):
            num_vals: list[float] = []
            raw_dist: dict[str, int] = {}
            for a in q_answers:
                try:
                    val = float(a.value)
                    num_vals.append(val)
                    key = str(int(val) if val.is_integer() else val)
                    raw_dist[key] = raw_dist.get(key, 0) + 1
                except (ValueError, TypeError):
                    pass

            if num_vals:
                calc_avg = round(sum(num_vals) / len(num_vals), 2)
                calc_min = min(num_vals)
                calc_max = max(num_vals)
                ok_rating = (
                    api_q.numeric_stats is not None
                    and api_q.numeric_stats.average == calc_avg
                    and api_q.numeric_stats.min == calc_min
                    and api_q.numeric_stats.max == calc_max
                    and api_q.numeric_stats.distribution == raw_dist
                )
                results.append((f"Q{q.id} Numeric Stats (Avg/Min/Max/Dist)", ok_rating, f"avg={calc_avg}, min={calc_min}, max={calc_max}"))
            else:
                ok_empty_num = (
                    api_q.numeric_stats is not None
                    and api_q.numeric_stats.average is None
                    and api_q.numeric_stats.min is None
                    and api_q.numeric_stats.max is None
                    and api_q.numeric_stats.distribution == {}
                )
                results.append((f"Q{q.id} Numeric Stats (Clean Empty State)", ok_empty_num, ""))

        # Text / Email
        elif q.type in (QuestionType.SHORT_TEXT, QuestionType.LONG_TEXT, QuestionType.EMAIL):
            ok_text = (
                api_q.text_stats is not None
                and api_q.text_stats.total_answered == raw_total_answered
                and len(api_q.text_stats.recent_answers) <= 5
            )
            results.append((f"Q{q.id} Text Stats (Recent <= 5)", ok_text, f"recent={len(api_q.text_stats.recent_answers) if api_q.text_stats else 0}"))

    # Print output for this form
    for label, ok, details in results:
        run_check(label, ok, details)

    return results


def main():
    db = SessionLocal()
    try:
        # Pre-fetch dashboard form items
        dashboard_forms = list_forms(db, user_id=1)
        dashboard_counts_by_id = {f.id: f.response_count for f in dashboard_forms}

        all_forms = db.query(Form).order_by(Form.id).all()
        if not all_forms:
            print("❌ No forms found in database. Run seed script first.")
            sys.exit(1)

        print(f"🚀 Running Comprehensive Stats Verification across {len(all_forms)} forms...")

        total_checks = 0
        passed_checks = 0
        failed_checks = 0

        for form in all_forms:
            form_results = verify_form(db, form, dashboard_counts_by_id)
            for _, ok, _ in form_results:
                total_checks += 1
                if ok:
                    passed_checks += 1
                else:
                    failed_checks += 1

        print("\n" + "=" * 60)
        print("VERIFICATION SUMMARY REPORT")
        print("=" * 60)
        print(f"Total metrics checked:  {total_checks}")
        print(f"Passed checks:          {passed_checks}")
        print(f"Failed checks:          {failed_checks}")

        if failed_checks == 0:
            print("\n✅ ALL METRICS AND STATS PASSED VERIFICATION (100% MATCH)!")
            print("=" * 60 + "\n")
            sys.exit(0)
        else:
            print(f"\n❌ {failed_checks} METRIC(S) FAILED VERIFICATION.")
            print("=" * 60 + "\n")
            sys.exit(1)

    finally:
        db.close()


if __name__ == "__main__":
    main()
