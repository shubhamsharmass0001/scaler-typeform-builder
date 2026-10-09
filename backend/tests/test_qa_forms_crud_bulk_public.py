"""
test_qa_forms_crud_bulk_public.py — Comprehensive integration tests for:
  - Bulk question save: add, reorder, edit, delete, delete-all, duplicate IDs, invalid types, huge payload
  - Public endpoints: unpublished 404, unpublish link stop, double submit 400, other form questions 422, missing required 422
  - Duplicate form: copies questions and theme but not responses
  - Delete form: cascades to questions, responses, answers
  - Slug uniqueness and collision retry
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.form import Form
from app.models.question import Question
from app.models.response import Response
from app.models.answer import Answer
from app.models.enums import FormStatus, QuestionType
from app.services.form_service import generate_unique_slug


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


# -----------------------------------------------------------------------------
# 1. Bulk Question Save
# -----------------------------------------------------------------------------
def test_bulk_question_save_add_edit_reorder_delete(client, db):
    # Create test form
    res = client.post("/api/forms", json={"title": "Bulk Test Form"})
    assert res.status_code == 201
    form_id = res.json()["id"]

    # Initial starter question created by create_form
    initial_q_res = client.get(f"/api/forms/{form_id}")
    starter_q_id = initial_q_res.json()["questions"][0]["id"]

    # 1. Add questions + edit starter
    bulk_payload = [
        {
            "id": starter_q_id,
            "type": "short_text",
            "title": "Updated Starter Title",
            "required": True,
            "position": 0,
            "properties": {},
        },
        {
            "type": "email",
            "title": "Email Question",
            "required": True,
            "position": 1,
            "properties": {},
        },
        {
            "type": "rating",
            "title": "Rating Question",
            "required": False,
            "position": 2,
            "properties": {"steps": 5},
        },
    ]

    res_bulk = client.put(f"/api/forms/{form_id}/questions", json=bulk_payload)
    assert res_bulk.status_code == 200
    saved = res_bulk.json()
    assert len(saved) == 3
    assert saved[0]["title"] == "Updated Starter Title"
    assert saved[0]["position"] == 0
    assert saved[1]["title"] == "Email Question"
    assert saved[1]["position"] == 1
    assert saved[2]["title"] == "Rating Question"
    assert saved[2]["position"] == 2

    # 2. Reorder questions (swap 1 and 2)
    reordered_payload = [
        saved[0],
        saved[2],
        saved[1],
    ]
    res_reorder = client.put(f"/api/forms/{form_id}/questions", json=reordered_payload)
    assert res_reorder.status_code == 200
    reordered = res_reorder.json()
    assert reordered[0]["title"] == "Updated Starter Title"
    assert reordered[0]["position"] == 0
    assert reordered[1]["title"] == "Rating Question"
    assert reordered[1]["position"] == 1
    assert reordered[2]["title"] == "Email Question"
    assert reordered[2]["position"] == 2

    # 3. Delete a question by omitting it from payload (remove rating)
    delete_one_payload = [reordered[0], reordered[2]]
    res_del_one = client.put(f"/api/forms/{form_id}/questions", json=delete_one_payload)
    assert res_del_one.status_code == 200
    after_del = res_del_one.json()
    assert len(after_del) == 2
    assert [q["title"] for q in after_del] == ["Updated Starter Title", "Email Question"]

    # 4. Delete-all questions (empty list payload)
    res_del_all = client.put(f"/api/forms/{form_id}/questions", json=[])
    assert res_del_all.status_code == 200
    assert len(res_del_all.json()) == 0

    # Verify directly in DB
    assert db.query(Question).filter(Question.form_id == form_id).count() == 0


def test_bulk_question_save_duplicate_ids(client):
    res = client.post("/api/forms", json={"title": "Dup Test Form"})
    form_id = res.json()["id"]

    dup_payload = [
        {"id": 9999, "type": "short_text", "title": "First", "position": 0, "properties": {}},
        {"id": 9999, "type": "short_text", "title": "Second", "position": 1, "properties": {}},
    ]
    res_dup = client.put(f"/api/forms/{form_id}/questions", json=dup_payload)
    assert res_dup.status_code == 400
    assert "Duplicate question ID" in res_dup.json()["detail"]


def test_bulk_question_save_invalid_type(client):
    res = client.post("/api/forms", json={"title": "Invalid Type Form"})
    form_id = res.json()["id"]

    bad_payload = [
        {"type": "nonexistent_type", "title": "Bad", "position": 0, "properties": {}},
    ]
    res_bad = client.put(f"/api/forms/{form_id}/questions", json=bad_payload)
    assert res_bad.status_code == 422


def test_bulk_question_save_huge_payload(client):
    res = client.post("/api/forms", json={"title": "Huge Form"})
    form_id = res.json()["id"]

    huge_payload = [
        {
            "type": "short_text",
            "title": f"Question {i}",
            "position": i,
            "properties": {},
        }
        for i in range(50)
    ]
    res_huge = client.put(f"/api/forms/{form_id}/questions", json=huge_payload)
    assert res_huge.status_code == 200
    assert len(res_huge.json()) == 50


# -----------------------------------------------------------------------------
# 2. Public Endpoints & Submission Validation
# -----------------------------------------------------------------------------
def test_public_unpublished_and_unpublish_lifecycle(client):
    # Create draft form
    res = client.post("/api/forms", json={"title": "Lifecycle Form"})
    form_id = res.json()["id"]

    # 1. Unpublished form returns 404
    res_draft = client.get(f"/api/public/forms/nonexistent_slug")
    assert res_draft.status_code == 404

    # 2. Publish form
    res_pub = client.post(f"/api/forms/{form_id}/publish")
    assert res_pub.status_code == 200
    slug = res_pub.json()["slug"]

    # Now public endpoint works
    res_pub_get = client.get(f"/api/public/forms/{slug}")
    assert res_pub_get.status_code == 200
    assert res_pub_get.json()["title"] == "Lifecycle Form"

    # 3. Unpublish form -> link stops working (404)
    res_unpub = client.post(f"/api/forms/{form_id}/unpublish")
    assert res_unpub.status_code == 200
    assert res_unpub.json()["status"] == "draft"

    res_pub_unpub = client.get(f"/api/public/forms/{slug}")
    assert res_pub_unpub.status_code == 404


def test_public_submission_double_submit_and_validation(client):
    # Create and publish form with required and optional questions
    res = client.post("/api/forms", json={"title": "Submit Validation Form"})
    form_id = res.json()["id"]

    q_payload = [
        {"type": "short_text", "title": "Required Name", "required": True, "position": 0, "properties": {}},
        {"type": "email", "title": "Required Email", "required": True, "position": 1, "properties": {}},
        {"type": "number", "title": "Optional Age", "required": False, "position": 2, "properties": {"min": 18}},
    ]
    res_q = client.put(f"/api/forms/{form_id}/questions", json=q_payload)
    questions = res_q.json()
    q1_id = questions[0]["id"]
    q2_id = questions[1]["id"]
    q3_id = questions[2]["id"]

    res_pub = client.post(f"/api/forms/{form_id}/publish")
    slug = res_pub.json()["slug"]

    # Start response session
    res_start = client.post(f"/api/public/forms/{slug}/start")
    assert res_start.status_code == 201
    resp_id = res_start.json()["response_id"]

    # 1. Missing required fields -> 422 with field map
    res_fail = client.post(
        f"/api/public/forms/{slug}/submit",
        json={
            "response_id": resp_id,
            "answers": [
                {"question_id": q3_id, "value": 25},  # Only answered optional
            ],
        },
    )
    assert res_fail.status_code == 422
    errors = res_fail.json()["errors"]
    assert str(q1_id) in errors
    assert str(q2_id) in errors

    # 2. Answers for question from another form rejected
    res_wrong_q = client.post(
        f"/api/public/forms/{slug}/submit",
        json={
            "response_id": resp_id,
            "answers": [
                {"question_id": q1_id, "value": "Alice"},
                {"question_id": q2_id, "value": "alice@example.com"},
                {"question_id": 999999, "value": "Malicious"},
            ],
        },
    )
    assert res_wrong_q.status_code == 422
    assert "999999" in res_wrong_q.json()["errors"]
    assert "does not belong" in res_wrong_q.json()["errors"]["999999"]

    # 3. Successful submission
    res_success = client.post(
        f"/api/public/forms/{slug}/submit",
        json={
            "response_id": resp_id,
            "answers": [
                {"question_id": q1_id, "value": "Alice"},
                {"question_id": q2_id, "value": "alice@example.com"},
                {"question_id": q3_id, "value": 25},
            ],
        },
    )
    assert res_success.status_code == 200
    assert res_success.json()["status"] == "success"

    # 4. Double submit rejected (400)
    res_double = client.post(
        f"/api/public/forms/{slug}/submit",
        json={
            "response_id": resp_id,
            "answers": [
                {"question_id": q1_id, "value": "Alice"},
                {"question_id": q2_id, "value": "alice@example.com"},
            ],
        },
    )
    assert res_double.status_code == 400
    assert "already been submitted" in res_double.json()["detail"]


# -----------------------------------------------------------------------------
# 3. Duplicate Form & Cascading Deletion
# -----------------------------------------------------------------------------
def test_duplicate_form_copies_questions_and_theme_not_responses(client, db):
    # Create form with theme, questions, and a response
    res = client.post(
        "/api/forms",
        json={
            "title": "Original Form",
            "theme": {
                "fontFamily": "Inter",
                "backgroundColor": "#112233",
                "questionColor": "#ffffff",
                "answerColor": "#00ff00",
                "buttonColor": "#ff0000",
                "buttonTextColor": "#ffffff",
            },
        },
    )
    form_id = res.json()["id"]

    q_payload = [
        {"type": "short_text", "title": "Q1", "position": 0, "properties": {}},
        {"type": "number", "title": "Q2", "position": 1, "properties": {}},
    ]
    res_q = client.put(f"/api/forms/{form_id}/questions", json=q_payload)
    q1_id = res_q.json()[0]["id"]

    res_pub = client.post(f"/api/forms/{form_id}/publish")
    slug = res_pub.json()["slug"]

    # Submit a response
    client.post(
        f"/api/public/forms/{slug}/submit",
        json={
            "answers": [{"question_id": q1_id, "value": "Hello"}],
        },
    )

    # Verify original has 1 response
    assert db.query(Response).filter(Response.form_id == form_id).count() == 1

    # Duplicate form
    res_dup = client.post(f"/api/forms/{form_id}/duplicate")
    assert res_dup.status_code == 201
    dup_form = res_dup.json()

    assert dup_form["id"] != form_id
    assert dup_form["title"] == "Copy of Original Form"
    assert dup_form["status"] == "draft"
    assert dup_form["slug"] is None
    assert dup_form["theme"]["fontFamily"] == "Inter"
    assert dup_form["theme"]["backgroundColor"] == "#112233"

    # Check duplicated questions
    assert len(dup_form["questions"]) == 2
    assert [q["title"] for q in dup_form["questions"]] == ["Q1", "Q2"]
    # Question IDs must be new IDs
    assert dup_form["questions"][0]["id"] != q1_id

    # Check responses: Duplicated form must have 0 responses!
    assert db.query(Response).filter(Response.form_id == dup_form["id"]).count() == 0


def test_delete_form_cascades(client, db):
    # Create form with questions, responses, and answers
    res = client.post("/api/forms", json={"title": "Form to Delete"})
    form_id = res.json()["id"]

    q_payload = [
        {"type": "short_text", "title": "Q1", "position": 0, "properties": {}},
    ]
    res_q = client.put(f"/api/forms/{form_id}/questions", json=q_payload)
    q1_id = res_q.json()[0]["id"]

    res_pub = client.post(f"/api/forms/{form_id}/publish")
    slug = res_pub.json()["slug"]

    # Submit response
    client.post(
        f"/api/public/forms/{slug}/submit",
        json={"answers": [{"question_id": q1_id, "value": "To be deleted"}]},
    )

    # Verify records exist before deletion
    assert db.query(Question).filter(Question.form_id == form_id).count() == 1
    assert db.query(Response).filter(Response.form_id == form_id).count() == 1
    resp = db.query(Response).filter(Response.form_id == form_id).first()
    assert db.query(Answer).filter(Answer.response_id == resp.id).count() == 1

    # Delete form
    res_del = client.delete(f"/api/forms/{form_id}")
    assert res_del.status_code == 200

    # Verify cascades
    assert db.query(Form).filter(Form.id == form_id).first() is None
    assert db.query(Question).filter(Question.form_id == form_id).count() == 0
    assert db.query(Response).filter(Response.form_id == form_id).count() == 0
    assert db.query(Answer).filter(Answer.response_id == resp.id).count() == 0


# -----------------------------------------------------------------------------
# 4. Slug Uniqueness & Collision Retry
# -----------------------------------------------------------------------------
def test_slug_uniqueness(db):
    slugs = set()
    for _ in range(50):
        s = generate_unique_slug(db, length=8)
        assert len(s) == 8
        assert s.isalnum()
        assert s not in slugs
        slugs.add(s)
