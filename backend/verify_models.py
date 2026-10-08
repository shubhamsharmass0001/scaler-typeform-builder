"""
verify_models.py — Verification script for SQLAlchemy 2.0 models, SQLite FK enforcement, and cascade delete.
"""

from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError
from app.database import engine, SessionLocal, Base
import app.models  # Ensure models are registered
from app.models.enums import FormStatus, QuestionType
from app.models.user import User
from app.models.form import Form
from app.models.question import Question
from app.models.response import Response
from app.models.answer import Answer


def verify_all():
    print("=" * 60)
    print("STEP 1: Creating all tables...")
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Detected tables in database: {tables}")
    expected_tables = {"users", "forms", "questions", "responses", "answers"}
    assert expected_tables.issubset(set(tables)), f"Missing tables! Expected {expected_tables}, got {tables}"
    print("✓ All 5 tables exist!")

    print("\n" + "=" * 60)
    print("STEP 2: Checking SQLite PRAGMA foreign_keys...")
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA foreign_keys;")).scalar()
        print(f"PRAGMA foreign_keys = {result}")
        assert result == 1, "Foreign keys are NOT enabled in SQLite!"
    print("✓ SQLite Foreign Key enforcement is active (1)!")

    print("\n" + "=" * 60)
    print("STEP 3: Testing Foreign Key constraint enforcement...")
    db = SessionLocal()
    try:
        # Attempting to insert a question with a non-existent form_id should fail
        bad_question = Question(
            form_id=999999,
            type=QuestionType.SHORT_TEXT,
            title="Ghost Question",
            position=0,
            properties={},
        )
        db.add(bad_question)
        try:
            db.commit()
            raise AssertionError("Foreign key violation was NOT caught!")
        except IntegrityError:
            db.rollback()
            print("✓ Foreign Key constraint correctly prevented orphan question insert (IntegrityError caught)!")

        print("\n" + "=" * 60)
        print("STEP 4: Testing Cascade Delete behavior...")
        # 1. Ensure user exists
        user = db.query(User).filter_by(id=1).first()
        if not user:
            user = User(id=1, name="Verification Creator", email="verifier@example.com")
            db.add(user)
            db.commit()

        # 2. Create a test form
        test_form = Form(
            user_id=user.id,
            title="Cascade Test Form",
            status=FormStatus.DRAFT,
            slug="cascade-test-form",
        )
        db.add(test_form)
        db.commit()
        db.refresh(test_form)
        form_id = test_form.id
        print(f"Created Form ID: {form_id}")

        # 3. Add 2 questions
        q1 = Question(
            form_id=form_id,
            type=QuestionType.SHORT_TEXT,
            title="What is your name?",
            position=1,
            properties={"placeholder": "Type here..."},
        )
        q2 = Question(
            form_id=form_id,
            type=QuestionType.RATING,
            title="How would you rate us?",
            position=2,
            properties={"steps": 5, "shape": "star"},
        )
        db.add_all([q1, q2])
        db.commit()
        db.refresh(q1)
        db.refresh(q2)
        print(f"Created Questions: ID {q1.id}, ID {q2.id}")

        # 4. Add a response and answers
        resp = Response(
            form_id=form_id,
            is_complete=True,
            last_question_id=q2.id,
        )
        db.add(resp)
        db.commit()
        db.refresh(resp)
        response_id = resp.id
        print(f"Created Response ID: {response_id}")

        a1 = Answer(response_id=response_id, question_id=q1.id, value="Alice")
        a2 = Answer(response_id=response_id, question_id=q2.id, value=5)
        db.add_all([a1, a2])
        db.commit()
        db.refresh(a1)
        db.refresh(a2)
        print(f"Created Answers: ID {a1.id}, ID {a2.id}")

        # Verify everything is present
        assert db.query(Form).filter_by(id=form_id).count() == 1
        assert db.query(Question).filter_by(form_id=form_id).count() == 2
        assert db.query(Response).filter_by(form_id=form_id).count() == 1
        assert db.query(Answer).filter_by(response_id=response_id).count() == 2
        print("✓ Form, Questions, Response, and Answers verified in database before deletion.")

        # 5. Delete the Form!
        print(f"\nDeleting Form ID {form_id}...")
        db.delete(test_form)
        db.commit()

        # 6. Check that questions, response, and answers are completely deleted
        q_count = db.query(Question).filter_by(form_id=form_id).count()
        r_count = db.query(Response).filter_by(form_id=form_id).count()
        a_count = db.query(Answer).filter_by(response_id=response_id).count()
        print(f"Remaining Questions for form {form_id}: {q_count}")
        print(f"Remaining Responses for form {form_id}: {r_count}")
        print(f"Remaining Answers for response {response_id}: {a_count}")

        assert q_count == 0, "Questions were not cascade-deleted!"
        assert r_count == 0, "Responses were not cascade-deleted!"
        assert a_count == 0, "Answers were not cascade-deleted!"

        print("\n" + "=" * 60)
        print("✓ SUCCESS: Cascade delete works perfectly across all 5 tables!")
        print("=" * 60)

    finally:
        db.close()


if __name__ == "__main__":
    verify_all()
