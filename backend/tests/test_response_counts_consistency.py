"""
tests/test_response_counts_consistency.py

Asserts that across the entire application:
  1. The response counts on the dashboard (/api/forms list)
  2. The Results tab badge / responses endpoint (/api/forms/{id}/responses total)
  3. The Summary statistics (/api/forms/{id}/summary total_responses & overall.started)
  4. The CSV export data rows count (/api/forms/{id}/export.csv excluding header)

ALL strictly agree for every form in the system.
Also asserts that status-filtered counts (completed, partial) agree between
the summary endpoint, responses endpoint, and filtered CSV export.
"""

import csv
import io
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.form import Form
from app.models.response import Response
from app.services.form_service import list_forms
from app.services.response_service import get_form_summary, export_responses_csv


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


def test_response_counts_consistency_all_forms(client, db):
    """
    Ensure dashboard count == results count == summary stats == CSV row count
    for every form in the database.
    """
    forms = db.query(Form).all()
    assert len(forms) > 0, "Database must have forms seeded before running test."

    # Fetch dashboard forms via service and API
    dash_forms = list_forms(db, user_id=1)
    dash_counts_by_id = {f.id: f.response_count for f in dash_forms}

    api_dash_res = client.get("/api/forms")
    assert api_dash_res.status_code == 200
    api_dash_items = api_dash_res.json()
    api_dash_counts_by_id = {f["id"]: f["response_count"] for f in api_dash_items}

    for form in forms:
        form_id = form.id

        # 1. Dashboard count
        dash_count = dash_counts_by_id.get(form_id, 0)
        api_dash_count = api_dash_counts_by_id.get(form_id, 0)
        assert dash_count == api_dash_count, f"Form {form_id}: service dash count {dash_count} != api dash count {api_dash_count}"

        # 2. Results Responses tab count
        resp_res = client.get(f"/api/forms/{form_id}/responses")
        assert resp_res.status_code == 200
        responses_data = resp_res.json()
        responses_tab_total = responses_data["total"]

        # 3. Summary stats
        summary_res = client.get(f"/api/forms/{form_id}/summary")
        assert summary_res.status_code == 200
        summary_data = summary_res.json()
        summary_total = summary_data["total_responses"]
        summary_started = summary_data["overall"]["started"]
        summary_completed = summary_data["completed_responses"]
        summary_partial = summary_data["overall"]["partial"]

        assert summary_total == summary_started, f"Form {form_id}: summary total_responses {summary_total} != overall.started {summary_started}"

        # 4. CSV export rows count
        csv_res = client.get(f"/api/forms/{form_id}/export.csv")
        assert csv_res.status_code == 200
        # UTF-8 BOM must be present
        assert csv_res.content.startswith(b"\xef\xbb\xbf")
        csv_text = csv_res.content.lstrip(b"\xef\xbb\xbf").decode("utf-8")
        csv_rows = list(csv.reader(io.StringIO(csv_text)))
        header = csv_rows[0]
        data_rows = csv_rows[1:]
        csv_data_count = len(data_rows)

        # 5. Core Assertion: All counts must agree exactly
        assert dash_count == responses_tab_total, (
            f"Form {form_id} '{form.title}': Dashboard count ({dash_count}) != Results Tab total ({responses_tab_total})"
        )
        assert dash_count == summary_total, (
            f"Form {form_id} '{form.title}': Dashboard count ({dash_count}) != Summary total ({summary_total})"
        )
        assert dash_count == csv_data_count, (
            f"Form {form_id} '{form.title}': Dashboard count ({dash_count}) != CSV data rows count ({csv_data_count})"
        )

        # 6. Status-filtered consistency checks
        # Filter: completed
        csv_comp_res = client.get(f"/api/forms/{form_id}/export.csv?status=completed")
        assert csv_comp_res.status_code == 200
        csv_comp_text = csv_comp_res.content.lstrip(b"\xef\xbb\xbf").decode("utf-8")
        csv_comp_data = list(csv.reader(io.StringIO(csv_comp_text)))[1:]
        assert len(csv_comp_data) == summary_completed, (
            f"Form {form_id}: completed CSV rows ({len(csv_comp_data)}) != summary completed ({summary_completed})"
        )

        resp_comp_res = client.get(f"/api/forms/{form_id}/responses?status=completed")
        assert resp_comp_res.status_code == 200
        assert resp_comp_res.json()["total"] == summary_completed, (
            f"Form {form_id}: completed responses total != summary completed"
        )

        # Filter: partial
        csv_part_res = client.get(f"/api/forms/{form_id}/export.csv?status=partial")
        assert csv_part_res.status_code == 200
        csv_part_text = csv_part_res.content.lstrip(b"\xef\xbb\xbf").decode("utf-8")
        csv_part_data = list(csv.reader(io.StringIO(csv_part_text)))[1:]
        assert len(csv_part_data) == summary_partial, (
            f"Form {form_id}: partial CSV rows ({len(csv_part_data)}) != summary partial ({summary_partial})"
        )

        resp_part_res = client.get(f"/api/forms/{form_id}/responses?status=partial")
        assert resp_part_res.status_code == 200
        assert resp_part_res.json()["total"] == summary_partial, (
            f"Form {form_id}: partial responses total != summary partial"
        )
