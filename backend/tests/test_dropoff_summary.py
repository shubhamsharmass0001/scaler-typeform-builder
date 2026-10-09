"""
test_dropoff_summary.py — Pytest validating partial-response tracking and drop-off funnel calculations
"""

from datetime import datetime, timedelta
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


@pytest.fixture(scope="module")
def db_session():
    """Provide a database session and clean up created test records after tests."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)


def test_dropoff_summary_10_responses(client, db_session):
    """
    Creates a form with 4 questions and 10 responses:
      - 6 complete responses (completed duration: 100 seconds)
      - 4 partial responses at known questions:
          * 1 dropped at Q0
          * 1 dropped at Q1
          * 2 dropped at Q2
    Asserts exact overall metrics and drop-off funnel calculations.
    """
    # 1. Ensure a user exists
    user = db_session.query(User).filter(User.id == 1).first()
    if not user:
        user = User(id=1, email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

    # 2. Create a test form
    test_form = Form(
        user_id=user.id,
        title="Pytest Dropoff Form",
        status=FormStatus.PUBLISHED,
        slug="pytest-dropoff-test",
    )
    db_session.add(test_form)
    db_session.commit()
    db_session.refresh(test_form)

    # 3. Add 4 questions with positions 0, 1, 2, 3
    q0 = Question(
        form_id=test_form.id,
        position=0,
        type=QuestionType.SHORT_TEXT,
        title="Q0: What is your name?",
        required=True,
    )
    q1 = Question(
        form_id=test_form.id,
        position=1,
        type=QuestionType.EMAIL,
        title="Q1: What is your email?",
        required=True,
    )
    q2 = Question(
        form_id=test_form.id,
        position=2,
        type=QuestionType.NUMBER,
        title="Q2: What is your age?",
        required=True,
    )
    q3 = Question(
        form_id=test_form.id,
        position=3,
        type=QuestionType.LONG_TEXT,
        title="Q3: Additional feedback?",
        required=False,
    )
    db_session.add_all([q0, q1, q2, q3])
    db_session.commit()
    db_session.refresh(q0)
    db_session.refresh(q1)
    db_session.refresh(q2)
    db_session.refresh(q3)

    now = datetime.utcnow()
    # 4. Create 6 complete responses
    for i in range(6):
        start_time = now - timedelta(seconds=200 + i * 10)
        submit_time = start_time + timedelta(seconds=100)  # exactly 100s duration
        comp_resp = Response(
            form_id=test_form.id,
            started_at=start_time,
            submitted_at=submit_time,
            is_complete=True,
            last_question_id=q3.id,
        )
        db_session.add(comp_resp)
        db_session.flush()

        # Add answers for all 4 questions
        db_session.add_all([
            Answer(response_id=comp_resp.id, question_id=q0.id, value=f"User {i}"),
            Answer(response_id=comp_resp.id, question_id=q1.id, value=f"user{i}@test.com"),
            Answer(response_id=comp_resp.id, question_id=q2.id, value=25 + i),
            Answer(response_id=comp_resp.id, question_id=q3.id, value="Great form!"),
        ])

    # 5. Create 4 partial responses at known questions:
    # Partial 1: Drops at Q0 (no answers, last_question_id=q0)
    p1 = Response(
        form_id=test_form.id,
        started_at=now - timedelta(minutes=15),
        submitted_at=None,
        is_complete=False,
        last_question_id=q0.id,
    )
    db_session.add(p1)

    # Partial 2: Answered Q0, drops at Q1 (last_question_id=q1)
    p2 = Response(
        form_id=test_form.id,
        started_at=now - timedelta(minutes=14),
        submitted_at=None,
        is_complete=False,
        last_question_id=q1.id,
    )
    db_session.add(p2)
    db_session.flush()
    db_session.add(Answer(response_id=p2.id, question_id=q0.id, value="Partial User 2"))

    # Partial 3: Answered Q0 and Q1, drops at Q2 (last_question_id=q2)
    p3 = Response(
        form_id=test_form.id,
        started_at=now - timedelta(minutes=13),
        submitted_at=None,
        is_complete=False,
        last_question_id=q2.id,
    )
    db_session.add(p3)
    db_session.flush()
    db_session.add_all([
        Answer(response_id=p3.id, question_id=q0.id, value="Partial User 3"),
        Answer(response_id=p3.id, question_id=q1.id, value="p3@test.com"),
    ])

    # Partial 4: Answered Q0 and Q1, drops at Q2 (last_question_id=q2)
    p4 = Response(
        form_id=test_form.id,
        started_at=now - timedelta(minutes=12),
        submitted_at=None,
        is_complete=False,
        last_question_id=q2.id,
    )
    db_session.add(p4)
    db_session.flush()
    db_session.add_all([
        Answer(response_id=p4.id, question_id=q0.id, value="Partial User 4"),
        Answer(response_id=p4.id, question_id=q1.id, value="p4@test.com"),
    ])

    db_session.commit()

    # 6. Call GET /api/forms/{id}/summary
    response = client.get(f"/api/forms/{test_form.id}/summary")
    assert response.status_code == 200
    data = response.json()

    # 7. Assert Overall Stats
    overall = data["overall"]
    assert overall["started"] == 10
    assert overall["completed"] == 6
    assert overall["partial"] == 4
    assert overall["completion_rate"] == 0.6
    assert overall["average_completion_seconds"] == 100.0

    # 8. Assert Dropoff Funnel per question
    dropoff = data["dropoff"]
    assert len(dropoff) == 4

    # Question 0
    d0 = dropoff[0]
    assert d0["question_id"] == q0.id
    assert d0["position"] == 0
    assert d0["reached_count"] == 10
    assert d0["dropped_here_count"] == 1
    assert d0["dropoff_percent"] == 10.0

    # Question 1
    d1 = dropoff[1]
    assert d1["question_id"] == q1.id
    assert d1["position"] == 1
    assert d1["reached_count"] == 9
    assert d1["dropped_here_count"] == 1
    assert d1["dropoff_percent"] == 11.1

    # Question 2
    d2 = dropoff[2]
    assert d2["question_id"] == q2.id
    assert d2["position"] == 2
    assert d2["reached_count"] == 8
    assert d2["dropped_here_count"] == 2
    assert d2["dropoff_percent"] == 25.0

    # Question 3
    d3 = dropoff[3]
    assert d3["question_id"] == q3.id
    assert d3["position"] == 3
    assert d3["reached_count"] == 6
    assert d3["dropped_here_count"] == 0
    assert d3["dropoff_percent"] == 0.0

    # Clean up test form and cascaded records
    db_session.delete(test_form)
    db_session.commit()
