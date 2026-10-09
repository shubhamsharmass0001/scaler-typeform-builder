"""
test_csv_export.py — Comprehensive tests for GET /api/forms/{id}/export.csv

Covers:
  - UTF-8 BOM presence
  - Content-Disposition filename format
  - Column order: Response ID, Status, Started At (UTC), Submitted At (UTC), Q titles
  - Duplicate title disambiguation
  - Multi-select joined with "; "
  - Yes/No for yes_no questions
  - Option-label resolution (not raw IDs)
  - Rating/Number as plain numbers
  - Formula-injection guard (= + - @ tab CR prefixed with ')
  - Commas, quotes, and newlines properly escaped by Python csv module
  - Unicode text preserved
  - Empty form (no questions) → only metadata columns
  - Status filter ?status=completed / ?status=partial
  - Empty responses → header-only CSV
"""

import csv
import io
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.form import Form
from app.models.question import Question
from app.models.response import Response
from app.models.answer import Answer
from app.models.enums import FormStatus, QuestionType


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


def _parse_csv(content: bytes) -> list[list[str]]:
    """Strip UTF-8 BOM and parse CSV bytes to list of rows."""
    text = content.lstrip(b"\xef\xbb\xbf").decode("utf-8")
    return list(csv.reader(io.StringIO(text)))


def _create_test_form(db, user_id: int, title: str, questions: list[dict]) -> tuple[Form, list[Question]]:
    """Helper: create a published form with questions and return (form, questions)."""
    form = Form(
        user_id=user_id,
        title=title,
        status=FormStatus.PUBLISHED,
        slug=None,
    )
    db.add(form)
    db.commit()
    db.refresh(form)

    q_objs = []
    for i, qdef in enumerate(questions):
        q = Question(
            form_id=form.id,
            position=i,
            type=qdef["type"],
            title=qdef["title"],
            required=qdef.get("required", False),
            properties=qdef.get("properties", {}),
        )
        db.add(q)
        q_objs.append(q)
    db.commit()
    for q in q_objs:
        db.refresh(q)
    return form, q_objs


def _add_response(db, form_id: int, is_complete: bool, answers: dict[int, object]) -> Response:
    """Helper: create a response with answers; answers is {question_id: value}."""
    now = datetime.utcnow()
    r = Response(
        form_id=form_id,
        started_at=now - timedelta(minutes=5),
        submitted_at=now if is_complete else None,
        is_complete=is_complete,
    )
    db.add(r)
    db.commit()
    db.refresh(r)

    for qid, val in answers.items():
        db.add(Answer(response_id=r.id, question_id=qid, value=val))
    db.commit()
    return r


# ---------------------------------------------------------------------------
# 1. UTF-8 BOM and Content-Disposition
# ---------------------------------------------------------------------------

def test_utf8_bom_and_content_disposition(client, db):
    form, qs = _create_test_form(db, 1, "BOM Test", [
        {"type": QuestionType.SHORT_TEXT, "title": "Name"},
    ])
    _add_response(db, form.id, True, {qs[0].id: "Alice"})

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    assert resp.status_code == 200
    # BOM check
    assert resp.content[:3] == b"\xef\xbb\xbf", "Response must start with UTF-8 BOM"
    # Content-Disposition
    cd = resp.headers.get("content-disposition", "")
    assert "attachment" in cd
    assert ".csv" in cd
    # Filename should be slugified and dated
    assert "bom-test" in cd or "bom" in cd

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 2. Correct column headers
# ---------------------------------------------------------------------------

def test_column_headers(client, db):
    form, qs = _create_test_form(db, 1, "Header Test", [
        {"type": QuestionType.SHORT_TEXT, "title": "Q Alpha"},
        {"type": QuestionType.EMAIL, "title": "Q Beta"},
    ])

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    rows = _parse_csv(resp.content)
    assert rows[0] == ["Response ID", "Status", "Started At (UTC)", "Submitted At (UTC)", "Q Alpha", "Q Beta"]

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 3. Duplicate title disambiguation
# ---------------------------------------------------------------------------

def test_duplicate_title_disambiguation(client, db):
    form, qs = _create_test_form(db, 1, "Dupe Titles", [
        {"type": QuestionType.SHORT_TEXT, "title": "Name"},
        {"type": QuestionType.SHORT_TEXT, "title": "Name"},
        {"type": QuestionType.SHORT_TEXT, "title": "Name"},
        {"type": QuestionType.SHORT_TEXT, "title": "Other"},
    ])

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    rows = _parse_csv(resp.content)
    headers = rows[0]
    assert "Name" in headers
    assert "Name (2)" in headers
    assert "Name (3)" in headers
    assert "Other" in headers

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 4. Multi-select joined with "; " (not ", ")
# ---------------------------------------------------------------------------

def test_multiselect_semicolon_join(client, db):
    form, qs = _create_test_form(db, 1, "Multiselect", [
        {
            "type": QuestionType.MULTIPLE_CHOICE,
            "title": "Hobbies",
            "properties": {
                "options": [
                    {"id": "opt_1", "label": "Reading"},
                    {"id": "opt_2", "label": "Cycling"},
                    {"id": "opt_3", "label": "Cooking"},
                ],
                "multiple": True,
            },
        }
    ])
    _add_response(db, form.id, True, {qs[0].id: ["opt_1", "opt_3"]})

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    rows = _parse_csv(resp.content)
    cell = rows[1][4]
    assert cell == "Reading; Cooking", f"Expected 'Reading; Cooking', got {cell!r}"

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 5. yes_no → Yes/No
# ---------------------------------------------------------------------------

def test_yes_no_formatting(client, db):
    form, qs = _create_test_form(db, 1, "YesNo Form", [
        {"type": QuestionType.YES_NO, "title": "Agree?"},
    ])
    _add_response(db, form.id, True, {qs[0].id: True})
    _add_response(db, form.id, True, {qs[0].id: False})

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    rows = _parse_csv(resp.content)
    values = {rows[1][4], rows[2][4]}
    assert values == {"Yes", "No"}

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 6. Option label resolution (not raw IDs)
# ---------------------------------------------------------------------------

def test_option_label_resolved(client, db):
    form, qs = _create_test_form(db, 1, "Label Resolve", [
        {
            "type": QuestionType.DROPDOWN,
            "title": "Color",
            "properties": {
                "options": [
                    {"id": "c1", "label": "Red"},
                    {"id": "c2", "label": "Blue"},
                ]
            },
        }
    ])
    _add_response(db, form.id, True, {qs[0].id: "c1"})

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    rows = _parse_csv(resp.content)
    assert rows[1][4] == "Red", f"Expected 'Red', got {rows[1][4]!r}"

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 7. Rating and Number as plain numbers
# ---------------------------------------------------------------------------

def test_rating_number_plain(client, db):
    form, qs = _create_test_form(db, 1, "Numbers", [
        {"type": QuestionType.RATING, "title": "Stars", "properties": {"steps": 5}},
        {"type": QuestionType.NUMBER, "title": "Age"},
    ])
    _add_response(db, form.id, True, {qs[0].id: 4, qs[1].id: 27})

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    rows = _parse_csv(resp.content)
    assert rows[1][4] == "4"
    assert rows[1][5] == "27"

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 8. Formula injection guard
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("dangerous_input,expected_prefix", [
    ("=SUM(A1:A10)", "'"),
    ("+1234567890", "'"),
    ("-1234567890", "'"),
    ("@SUM", "'"),
    ("\t=formula", "'"),
    ("\r=evil", "'"),
    ("Normal text", ""),
])
def test_formula_injection_guard(client, db, dangerous_input, expected_prefix):
    form, qs = _create_test_form(db, 1, "Formula Guard", [
        {"type": QuestionType.SHORT_TEXT, "title": "Input"},
    ])
    _add_response(db, form.id, True, {qs[0].id: dangerous_input})

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    rows = _parse_csv(resp.content)
    cell = rows[1][4]
    if expected_prefix:
        assert cell.startswith(expected_prefix), (
            f"Expected formula-injected cell to start with {expected_prefix!r}, got {cell!r}"
        )
    else:
        assert not cell.startswith("'"), f"Safe cell should not have prefix, got {cell!r}"

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 9. Commas, quotes, and newlines escaped by csv module
# ---------------------------------------------------------------------------

def test_commas_quotes_newlines_escaped(client, db):
    form, qs = _create_test_form(db, 1, "Special Chars", [
        {"type": QuestionType.SHORT_TEXT, "title": "Feedback"},
    ])
    tricky = 'He said, "Hello\nWorld"'
    _add_response(db, form.id, True, {qs[0].id: tricky})

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    rows = _parse_csv(resp.content)
    # Python csv reader should un-escape back to the original
    assert tricky in rows[1][4], f"Expected tricky value in cell, got {rows[1][4]!r}"

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 10. Unicode preserved
# ---------------------------------------------------------------------------

def test_unicode_preserved(client, db):
    form, qs = _create_test_form(db, 1, "Unicode 🌍", [
        {"type": QuestionType.SHORT_TEXT, "title": "Name"},
    ])
    _add_response(db, form.id, True, {qs[0].id: "José García 日本語 🎉"})

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    assert resp.content[:3] == b"\xef\xbb\xbf"
    rows = _parse_csv(resp.content)
    assert "José García 日本語 🎉" in rows[1][4]

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 11. Empty form (no questions) → only metadata columns
# ---------------------------------------------------------------------------

def test_empty_form_no_questions(client, db):
    form, _ = _create_test_form(db, 1, "Empty Form", [])
    _add_response(db, form.id, True, {})

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    rows = _parse_csv(resp.content)
    assert rows[0] == ["Response ID", "Status", "Started At (UTC)", "Submitted At (UTC)"]
    assert len(rows) == 2  # header + 1 response

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 12. Empty responses → header only
# ---------------------------------------------------------------------------

def test_empty_responses_header_only(client, db):
    form, _ = _create_test_form(db, 1, "No Responses", [
        {"type": QuestionType.SHORT_TEXT, "title": "Name"},
    ])

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    rows = _parse_csv(resp.content)
    assert len(rows) == 1
    assert rows[0][0] == "Response ID"

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 13. Status filter ?status=completed / ?status=partial
# ---------------------------------------------------------------------------

def test_status_filter(client, db):
    form, qs = _create_test_form(db, 1, "Status Filter", [
        {"type": QuestionType.SHORT_TEXT, "title": "Name"},
    ])
    _add_response(db, form.id, True, {qs[0].id: "Alice"})   # completed
    _add_response(db, form.id, False, {qs[0].id: "Bob"})    # partial

    # All
    resp_all = client.get(f"/api/forms/{form.id}/export.csv")
    rows_all = _parse_csv(resp_all.content)
    assert len(rows_all) == 3  # header + 2

    # Completed only
    resp_done = client.get(f"/api/forms/{form.id}/export.csv?status=completed")
    rows_done = _parse_csv(resp_done.content)
    assert len(rows_done) == 2  # header + 1
    assert rows_done[1][1] == "Completed"

    # Partial only
    resp_partial = client.get(f"/api/forms/{form.id}/export.csv?status=partial")
    rows_partial = _parse_csv(resp_partial.content)
    assert len(rows_partial) == 2  # header + 1
    assert rows_partial[1][1] == "Partial"

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 14. Status column values Completed / Partial
# ---------------------------------------------------------------------------

def test_status_column_values(client, db):
    form, qs = _create_test_form(db, 1, "Status Col", [
        {"type": QuestionType.SHORT_TEXT, "title": "Name"},
    ])
    _add_response(db, form.id, True, {qs[0].id: "Done"})
    _add_response(db, form.id, False, {qs[0].id: "WIP"})

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    rows = _parse_csv(resp.content)
    statuses = {rows[1][1], rows[2][1]}
    assert statuses == {"Completed", "Partial"}

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 15. Unanswered questions → empty cell (not None/null)
# ---------------------------------------------------------------------------

def test_unanswered_empty_cell(client, db):
    form, qs = _create_test_form(db, 1, "Unanswered", [
        {"type": QuestionType.SHORT_TEXT, "title": "Q1"},
        {"type": QuestionType.SHORT_TEXT, "title": "Q2"},
    ])
    # Only answer Q1; Q2 is unanswered
    _add_response(db, form.id, False, {qs[0].id: "Hello"})

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    rows = _parse_csv(resp.content)
    assert rows[1][4] == "Hello"
    assert rows[1][5] == ""  # Q2 unanswered → empty

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 16. Multi-select with formula-injected option labels guarded
# ---------------------------------------------------------------------------

def test_multiselect_with_formula_options_guarded(client, db):
    form, qs = _create_test_form(db, 1, "Formula Options", [
        {
            "type": QuestionType.MULTIPLE_CHOICE,
            "title": "Scores",
            "properties": {
                "options": [
                    {"id": "o1", "label": "+100 points"},
                    {"id": "o2", "label": "=SUM(A1:B1)"},
                ]
            },
        }
    ])
    _add_response(db, form.id, True, {qs[0].id: ["o1", "o2"]})

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    rows = _parse_csv(resp.content)
    cell = rows[1][4]
    # The cell must start with ' to guard spreadsheet formula injection
    assert cell.startswith("'"), f"Expected formula guard on multiselect cell, got: {cell!r}"

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 17. Empty form with zero responses
# ---------------------------------------------------------------------------

def test_empty_form_zero_responses(client, db):
    form, _ = _create_test_form(db, 1, "Zero Questions Zero Responses", [])
    resp = client.get(f"/api/forms/{form.id}/export.csv")
    assert resp.status_code == 200
    assert resp.content[:3] == b"\xef\xbb\xbf"
    rows = _parse_csv(resp.content)
    assert len(rows) == 1
    assert rows[0] == ["Response ID", "Status", "Started At (UTC)", "Submitted At (UTC)"]

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 18. Streaming response headers and media type
# ---------------------------------------------------------------------------

def test_streaming_response_content_type(client, db):
    form, qs = _create_test_form(db, 1, "Streaming Headers Test", [
        {"type": QuestionType.SHORT_TEXT, "title": "Feedback"}
    ])
    _add_response(db, form.id, True, {qs[0].id: "All good"})

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    assert resp.status_code == 200
    ct = resp.headers.get("content-type", "")
    assert "text/csv" in ct
    assert "utf-8" in ct.lower()

    cd = resp.headers.get("content-disposition", "")
    assert "attachment" in cd
    assert 'filename="streaming-headers-test-responses-' in cd

    db.delete(form)
    db.commit()


# ---------------------------------------------------------------------------
# 19. Excel/Sheets complex cell unescaping
# ---------------------------------------------------------------------------

def test_excel_sheets_complex_escaping(client, db):
    form, qs = _create_test_form(db, 1, "Complex Escaping", [
        {"type": QuestionType.LONG_TEXT, "title": "Story"},
        {"type": QuestionType.SHORT_TEXT, "title": "Tags"},
    ])
    story_text = 'Line 1,\nLine 2 with "double quotes",\nand Line 3.'
    tags_text = 'apple, banana, "cherry"'
    _add_response(db, form.id, True, {qs[0].id: story_text, qs[1].id: tags_text})

    resp = client.get(f"/api/forms/{form.id}/export.csv")
    assert resp.status_code == 200
    rows = _parse_csv(resp.content)
    assert len(rows) == 2
    assert rows[1][4] == story_text
    assert rows[1][5] == tags_text

    db.delete(form)
    db.commit()
