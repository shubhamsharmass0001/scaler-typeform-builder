"""
test_logic.py — Comprehensive tests for conditional logic jumps, operators, cycle detection,
and submit path validation.

Tests:
  1. Each operator by question type:
     - choice / dropdown / yes_no: equals, not_equals, is_answered, is_empty
     - multi-select: contains, not contains, is_answered, is_empty
     - number / rating: equals, not_equals, greater_than, less_than, is_answered, is_empty
     - text / email: equals, contains, is_answered
     - Invalid operator rejection (422)
  2. Multi-rule priority (first match wins)
  3. Default fallthrough (logicDefault vs sequential next vs end)
  4. Jump to end (action.target_question_id = "end")
  5. Cycle detection:
     - Direct cycle (Q2 -> Q5 -> Q2)
     - Indirect cycle (Q1 -> Q2 -> Q3 -> Q1)
     - Self-jump (Q1 -> Q1)
     - Non-existent target rejection
     - Bulk save endpoint returns 422 naming the cycle
  6. Server validation with visited path:
     - Skipped-required tolerance: required questions outside the path are not errors
     - Answers submitted for bypassed questions are rejected (422 per-question error)
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.form import Form
from app.models.question import Question
from app.models.enums import FormStatus, QuestionType
from app.services.logic import (
    validate_logic,
    next_question,
    compute_visited_path,
    evaluate_condition,
    LogicValidationError,
)


@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


# ---------------------------------------------------------------------------
# 1. Tests for Condition Evaluation and Operators by Type
# ---------------------------------------------------------------------------

def test_operator_equals_and_not_equals_choice():
    props = {
        "options": [
            {"id": "opt_yes", "label": "Yes"},
            {"id": "opt_no", "label": "No"},
        ]
    }
    # Matches by ID
    assert evaluate_condition("equals", "opt_yes", "opt_yes", "multiple_choice", props) is True
    assert evaluate_condition("equals", "opt_no", "opt_yes", "multiple_choice", props) is False

    # Matches by label to ID
    assert evaluate_condition("equals", "Yes", "opt_yes", "multiple_choice", props) is True
    assert evaluate_condition("equals", "opt_yes", "Yes", "multiple_choice", props) is True

    # not_equals
    assert evaluate_condition("not_equals", "opt_no", "opt_yes", "multiple_choice", props) is True
    assert evaluate_condition("not_equals", "opt_yes", "opt_yes", "multiple_choice", props) is False


def test_operator_yes_no_boolean():
    # Boolean and string variations
    assert evaluate_condition("equals", True, "yes", "yes_no", {}) is True
    assert evaluate_condition("equals", "yes", True, "yes_no", {}) is True
    assert evaluate_condition("equals", False, "no", "yes_no", {}) is True
    assert evaluate_condition("equals", True, "no", "yes_no", {}) is False
    assert evaluate_condition("not_equals", True, "no", "yes_no", {}) is True


def test_operator_number_and_rating_comparisons():
    # Numeric equals
    assert evaluate_condition("equals", 5, "5", "number", {}) is True
    assert evaluate_condition("equals", 5.0, 5, "number", {}) is True
    assert evaluate_condition("not_equals", 4, 5, "number", {}) is True

    # greater_than and less_than
    assert evaluate_condition("greater_than", 10, 5, "number", {}) is True
    assert evaluate_condition("greater_than", 5, 10, "number", {}) is False
    assert evaluate_condition("less_than", 3, 5, "rating", {}) is True
    assert evaluate_condition("less_than", 5, 3, "rating", {}) is False

    # None / empty handling
    assert evaluate_condition("greater_than", None, 5, "number", {}) is False
    assert evaluate_condition("less_than", None, 5, "number", {}) is False


def test_operator_multi_select_contains_and_not_contains():
    props = {
        "multiple": True,
        "options": [
            {"id": "opt_a", "label": "Option A"},
            {"id": "opt_b", "label": "Option B"},
            {"id": "opt_c", "label": "Option C"},
        ]
    }
    # User selected ["opt_a", "opt_b"]
    answers = ["opt_a", "opt_b"]
    assert evaluate_condition("contains", answers, "opt_a", "multiple_choice", props) is True
    assert evaluate_condition("contains", answers, "opt_c", "multiple_choice", props) is False
    assert evaluate_condition("not contains", answers, "opt_c", "multiple_choice", props) is True
    assert evaluate_condition("not_contains", answers, "opt_c", "multiple_choice", props) is True
    assert evaluate_condition("not contains", answers, "opt_a", "multiple_choice", props) is False


def test_operator_text_and_email_contains_and_equals():
    # text substring contains
    assert evaluate_condition("contains", "Hello world from Scaler", "scaler", "short_text", {}) is True
    assert evaluate_condition("contains", "Hello world", "scaler", "short_text", {}) is False

    # email equals and contains
    assert evaluate_condition("equals", "user@test.com", "USER@TEST.COM", "email", {}) is True
    assert evaluate_condition("contains", "user@company.org", "company", "email", {}) is True


def test_operator_is_answered_and_is_empty():
    # is_answered
    assert evaluate_condition("is_answered", "filled", None, "short_text", {}) is True
    assert evaluate_condition("is_answered", "", None, "short_text", {}) is False
    assert evaluate_condition("is_answered", None, None, "short_text", {}) is False
    assert evaluate_condition("is_answered", [], None, "multiple_choice", {}) is False
    assert evaluate_condition("is_answered", ["opt_1"], None, "multiple_choice", {}) is True

    # is_empty
    assert evaluate_condition("is_empty", None, None, "number", {}) is True
    assert evaluate_condition("is_empty", "", None, "short_text", {}) is True
    assert evaluate_condition("is_empty", [], None, "multiple_choice", {}) is True
    assert evaluate_condition("is_empty", 42, None, "number", {}) is False


# ---------------------------------------------------------------------------
# 2. Validation of Invalid Operators per Question Type
# ---------------------------------------------------------------------------

def test_validate_logic_invalid_operator_rejected():
    questions = [
        {
            "id": 1,
            "type": "short_text",
            "title": "Text Question",
            "properties": {
                "logic": [
                    {
                        "id": "r1",
                        "conditions": [{"operator": "greater_than", "value": 10}],
                        "action": {"type": "jump", "target_question_id": 2},
                    }
                ]
            },
        },
        {"id": 2, "type": "short_text", "title": "Next Question", "properties": {}},
    ]

    with pytest.raises(LogicValidationError) as exc:
        validate_logic(None, questions)

    assert "Operator 'greater_than' is invalid for question type 'short_text'" in exc.value.detail


def test_validate_logic_number_contains_rejected():
    questions = [
        {
            "id": 1,
            "type": "number",
            "title": "Number Question",
            "properties": {
                "logic": [
                    {
                        "id": "r1",
                        "conditions": [{"operator": "contains", "value": 5}],
                        "action": {"type": "jump", "target_question_id": 2},
                    }
                ]
            },
        },
        {"id": 2, "type": "number", "title": "Q2", "properties": {}},
    ]

    with pytest.raises(LogicValidationError) as exc:
        validate_logic(None, questions)

    assert "Operator 'contains' is invalid for question type 'number'" in exc.value.detail


# ---------------------------------------------------------------------------
# 3. Multi-Rule Priority (First match wins)
# ---------------------------------------------------------------------------

def test_multi_rule_priority_first_match_wins():
    q1 = {
        "id": 1,
        "type": "number",
        "title": "Age",
        "properties": {
            "logic": [
                {
                    "id": "rule_minor",
                    "conditions": [{"operator": "less_than", "value": 18}],
                    "action": {"type": "jump", "target_question_id": 10},
                },
                {
                    "id": "rule_adult",
                    "conditions": [{"operator": "greater_than", "value": 0}],
                    "action": {"type": "jump", "target_question_id": 20},
                },
            ]
        },
    }
    q10 = {"id": 10, "type": "short_text", "title": "Minor Flow", "properties": {}}
    q20 = {"id": 20, "type": "short_text", "title": "Adult Flow", "properties": {}}
    ordered = [q1, q10, q20]

    # Age = 15: both less_than 18 and greater_than 0 are True, but rule_minor is first!
    nxt = next_question(q1, {1: 15}, ordered)
    assert nxt == 10

    # Age = 25: only rule_adult matches -> jumps to 20
    nxt = next_question(q1, {1: 25}, ordered)
    assert nxt == 20


# ---------------------------------------------------------------------------
# 4. Default Fallthrough & Jump to End
# ---------------------------------------------------------------------------

def test_default_fallthrough_with_logic_default():
    q1 = {
        "id": 1,
        "type": "multiple_choice",
        "title": "Select choice",
        "properties": {
            "logic": [
                {
                    "id": "rule_special",
                    "conditions": [{"operator": "equals", "value": "vip"}],
                    "action": {"type": "jump", "target_question_id": 5},
                }
            ],
            "logicDefault": 3,
        },
    }
    q2 = {"id": 2, "type": "short_text", "title": "Regular 2", "properties": {}}
    q3 = {"id": 3, "type": "short_text", "title": "Default Target 3", "properties": {}}
    q5 = {"id": 5, "type": "short_text", "title": "VIP Target 5", "properties": {}}
    ordered = [q1, q2, q3, q5]

    # When rule matches -> 5
    assert next_question(q1, {1: "vip"}, ordered) == 5

    # When rule does not match -> uses logicDefault (3) instead of sequential next (2)
    assert next_question(q1, {1: "standard"}, ordered) == 3


def test_default_fallthrough_sequential_when_logic_default_none():
    q1 = {
        "id": 1,
        "type": "multiple_choice",
        "title": "Q1",
        "properties": {
            "logic": [
                {
                    "id": "r1",
                    "conditions": [{"operator": "equals", "value": "vip"}],
                    "action": {"type": "jump", "target_question_id": 3},
                }
            ],
            "logicDefault": None,
        },
    }
    q2 = {"id": 2, "type": "short_text", "title": "Q2", "properties": {}}
    q3 = {"id": 3, "type": "short_text", "title": "Q3", "properties": {}}
    ordered = [q1, q2, q3]

    # No rule match, logicDefault is None -> sequential next is 2
    assert next_question(q1, {1: "regular"}, ordered) == 2


def test_jump_to_end():
    q1 = {
        "id": 1,
        "type": "yes_no",
        "title": "Disqualify?",
        "properties": {
            "logic": [
                {
                    "id": "rule_dq",
                    "conditions": [{"operator": "equals", "value": True}],
                    "action": {"type": "jump", "target_question_id": "end"},
                }
            ]
        },
    }
    q2 = {"id": 2, "type": "short_text", "title": "Q2", "properties": {}}
    q3 = {"id": 3, "type": "short_text", "title": "Q3", "properties": {}}
    ordered = [q1, q2, q3]

    # When disqualified -> "end"
    assert next_question(q1, {1: True}, ordered) == "end"

    # Visited path stops at Q1
    path = compute_visited_path(ordered, {1: True})
    assert len(path) == 1
    assert path[0]["id"] == 1


# ---------------------------------------------------------------------------
# 5. Cycle Detection (Direct, Indirect, Self-Jump, Non-existent targets)
# ---------------------------------------------------------------------------

def test_self_jump_rejected():
    questions = [
        {
            "id": 1,
            "type": "short_text",
            "title": "Q1",
            "properties": {
                "logic": [
                    {
                        "id": "r1",
                        "conditions": [{"operator": "is_answered", "value": None}],
                        "action": {"type": "jump", "target_question_id": 1},
                    }
                ]
            },
        }
    ]
    with pytest.raises(LogicValidationError) as exc:
        validate_logic(None, questions)
    assert "jumps to itself" in exc.value.detail


def test_nonexistent_target_rejected():
    questions = [
        {
            "id": 1,
            "type": "short_text",
            "title": "Q1",
            "properties": {
                "logic": [
                    {
                        "id": "r1",
                        "conditions": [{"operator": "is_answered", "value": None}],
                        "action": {"type": "jump", "target_question_id": 999},
                    }
                ]
            },
        }
    ]
    with pytest.raises(LogicValidationError) as exc:
        validate_logic(None, questions)
    assert "Target question '999' does not exist in this form" in exc.value.detail


def test_cycle_detection_direct_q2_q5_q2():
    # Setup Q1 -> Q2 -> Q3 -> Q4 -> Q5
    # Q2 jumps to Q5 on rule
    # Q5 jumps to Q2 on rule
    questions = [
        {"id": 1, "position": 0, "type": "short_text", "title": "Q1", "properties": {}},
        {
            "id": 2,
            "position": 1,
            "type": "multiple_choice",
            "title": "Q2",
            "properties": {
                "logic": [
                    {
                        "id": "r2",
                        "conditions": [{"operator": "equals", "value": "jump_5"}],
                        "action": {"type": "jump", "target_question_id": 5},
                    }
                ]
            },
        },
        {"id": 3, "position": 2, "type": "short_text", "title": "Q3", "properties": {}},
        {"id": 4, "position": 3, "type": "short_text", "title": "Q4", "properties": {}},
        {
            "id": 5,
            "position": 4,
            "type": "multiple_choice",
            "title": "Q5",
            "properties": {
                "logic": [
                    {
                        "id": "r5",
                        "conditions": [{"operator": "equals", "value": "jump_2"}],
                        "action": {"type": "jump", "target_question_id": 2},
                    }
                ]
            },
        },
    ]

    with pytest.raises(LogicValidationError) as exc:
        validate_logic(None, questions)

    assert "Circular logic path detected: Q2 -> Q5 -> Q2" in exc.value.detail


def test_cycle_detection_indirect():
    # Q1 -> Q2 -> Q3 -> Q4 with Q4 jumping back to Q2
    questions = [
        {"id": 1, "position": 0, "type": "short_text", "title": "Q1", "properties": {}},
        {"id": 2, "position": 1, "type": "short_text", "title": "Q2", "properties": {}},
        {"id": 3, "position": 2, "type": "short_text", "title": "Q3", "properties": {}},
        {
            "id": 4,
            "position": 3,
            "type": "multiple_choice",
            "title": "Q4",
            "properties": {
                "logic": [
                    {
                        "id": "r4",
                        "conditions": [{"operator": "equals", "value": "back"}],
                        "action": {"type": "jump", "target_question_id": 2},
                    }
                ]
            },
        },
    ]

    with pytest.raises(LogicValidationError) as exc:
        validate_logic(None, questions)

    assert "Q2 -> Q3 -> Q4 -> Q2" in exc.value.detail


# ---------------------------------------------------------------------------
# 6. Bulk Save API Rejection of Cycles (Integration Test)
# ---------------------------------------------------------------------------

def test_bulk_save_api_cycle_returns_422(client, db):
    # Create form in DB
    form = Form(
        user_id=1,
        title="Logic Test Form",
        status=FormStatus.DRAFT,
    )
    db.add(form)
    db.commit()
    db.refresh(form)

    # Initial bulk save of 5 questions
    initial_payload = [
        {"id": None, "type": "short_text", "title": "Q1", "required": False, "properties": {}},
        {"id": None, "type": "multiple_choice", "title": "Q2", "required": False, "properties": {}},
        {"id": None, "type": "short_text", "title": "Q3", "required": False, "properties": {}},
        {"id": None, "type": "short_text", "title": "Q4", "required": False, "properties": {}},
        {"id": None, "type": "multiple_choice", "title": "Q5", "required": False, "properties": {}},
    ]
    res = client.put(f"/api/forms/{form.id}/questions", json=initial_payload)
    assert res.status_code == 200
    saved = res.json()
    q_ids = [q["id"] for q in saved]
    assert len(q_ids) == 5

    # Attempt to bulk save with circular jump: Q2 -> Q5 and Q5 -> Q2
    cycle_payload = [
        {"id": q_ids[0], "type": "short_text", "title": "Q1", "required": False, "properties": {}},
        {
            "id": q_ids[1],
            "type": "multiple_choice",
            "title": "Q2",
            "required": False,
            "properties": {
                "logic": [
                    {
                        "id": "r2",
                        "conditions": [{"operator": "equals", "value": "to_5"}],
                        "action": {"type": "jump", "target_question_id": q_ids[4]},
                    }
                ]
            },
        },
        {"id": q_ids[2], "type": "short_text", "title": "Q3", "required": False, "properties": {}},
        {"id": q_ids[3], "type": "short_text", "title": "Q4", "required": False, "properties": {}},
        {
            "id": q_ids[4],
            "type": "multiple_choice",
            "title": "Q5",
            "required": False,
            "properties": {
                "logic": [
                    {
                        "id": "r5",
                        "conditions": [{"operator": "equals", "value": "to_2"}],
                        "action": {"type": "jump", "target_question_id": q_ids[1]},
                    }
                ]
            },
        },
    ]

    res_cycle = client.put(f"/api/forms/{form.id}/questions", json=cycle_payload)
    assert res_cycle.status_code == 422
    data = res_cycle.json()
    assert "detail" in data
    assert "Q2 -> Q5 -> Q2" in data["detail"]


# ---------------------------------------------------------------------------
# 7. Server Validation: Skipped-Required Tolerance & Bypassed Answers
# ---------------------------------------------------------------------------

def test_skipped_required_tolerance_and_bypassed_answers(client, db):
    # Setup published form with slug
    import uuid
    test_slug = f"path-test-{uuid.uuid4().hex[:8]}"
    form = Form(
        user_id=1,
        title="Path Validation Form",
        status=FormStatus.PUBLISHED,
        slug=test_slug,
    )
    db.add(form)
    db.commit()
    db.refresh(form)

    # 3 questions:
    # Q1: yes_no (if yes -> jump to Q3)
    # Q2: short_text (REQUIRED!)
    # Q3: short_text (REQUIRED!)
    q1 = Question(
        form_id=form.id,
        type=QuestionType.YES_NO,
        title="Q1",
        required=False,
        position=0,
        properties={},  # will set logic below once Q3 id is known
    )
    q2 = Question(
        form_id=form.id,
        type=QuestionType.SHORT_TEXT,
        title="Q2",
        required=True,  # Required!
        position=1,
        properties={},
    )
    q3 = Question(
        form_id=form.id,
        type=QuestionType.SHORT_TEXT,
        title="Q3",
        required=True,  # Required!
        position=2,
        properties={},
    )
    db.add_all([q1, q2, q3])
    db.commit()
    db.refresh(q1)
    db.refresh(q2)
    db.refresh(q3)

    # Set Q1 rule jumping directly to Q3 on "yes"
    q1.properties = {
        "logic": [
            {
                "id": "rule_jump",
                "conditions": [{"operator": "equals", "value": True}],
                "action": {"type": "jump", "target_question_id": q3.id},
            }
        ]
    }
    db.commit()

    # 1. Respondent says "yes" on Q1 -> jumps over Q2 to Q3.
    # Answers submitted: Q1 = True, Q3 = "Answer 3". Q2 is omitted!
    # Expected: SUCCESS! Q2's required constraint must NOT fail.
    submit_payload_valid = {
        "response_id": None,
        "answers": [
            {"question_id": q1.id, "value": True},
            {"question_id": q3.id, "value": "Answer 3"},
        ],
    }
    res_valid = client.post(f"/api/public/forms/{form.slug}/submit", json=submit_payload_valid)
    assert res_valid.status_code == 200
    assert res_valid.json()["status"] == "success"

    # 2. Respondent answers Q1 = True, but also submits an answer for bypassed Q2!
    # Expected: REJECTED with 422 naming question 2.
    submit_payload_bypassed = {
        "response_id": None,
        "answers": [
            {"question_id": q1.id, "value": True},
            {"question_id": q2.id, "value": "I answered Q2 anyway"},
            {"question_id": q3.id, "value": "Answer 3"},
        ],
    }
    res_bypassed = client.post(f"/api/public/forms/{form.slug}/submit", json=submit_payload_bypassed)
    assert res_bypassed.status_code == 422
    errors = res_bypassed.json()["errors"]
    assert str(q2.id) in errors
    assert "bypassed" in errors[str(q2.id)].lower()
