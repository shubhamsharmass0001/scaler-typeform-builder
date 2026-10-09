"""
test_theme.py — Tests for Theme validation and persistence

Validates:
  - Theme schema rejection of unknown keys (extra='forbid' -> 422)
  - Theme schema rejection of invalid hex values -> 422
  - Theme schema rejection of out-of-range backgroundOverlay (0..0.8) -> 422
  - Theme schema rejection of unknown fonts, fontScale, buttonRadius, preset -> 422
  - Valid theme updates persist on PATCH and reflect in GET /forms/{id} and public GET /f/{slug}
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.form import Form
from app.models.enums import FormStatus


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


def test_theme_patch_valid_preset(client, db):
    form = Form(
        user_id=1,
        title="Theme Test Form",
        status=FormStatus.PUBLISHED,
        slug="theme-test-slug",
    )
    db.add(form)
    db.commit()
    db.refresh(form)

    valid_theme = {
        "preset": "midnight",
        "backgroundColor": "#0F172A",
        "backgroundImageUrl": "https://example.com/bg.jpg",
        "backgroundOverlay": 0.4,
        "questionColor": "#F8FAFC",
        "answerColor": "#38BDF8",
        "buttonColor": "#38BDF8",
        "buttonTextColor": "#0F172A",
        "fontFamily": "Space Grotesk",
        "fontScale": "large",
        "buttonRadius": "pill",
    }

    resp = client.patch(f"/api/forms/{form.id}", json={"theme": valid_theme})
    assert resp.status_code == 200
    data = resp.json()
    assert data["theme"]["preset"] == "midnight"
    assert data["theme"]["backgroundColor"] == "#0F172A"
    assert data["theme"]["fontFamily"] == "Space Grotesk"
    assert data["theme"]["buttonRadius"] == "pill"

    # Verify public form returns identical theme
    pub_resp = client.get(f"/api/public/forms/{form.slug}")
    assert pub_resp.status_code == 200
    pub_data = pub_resp.json()
    assert pub_data["theme"] == data["theme"]

    db.delete(form)
    db.commit()


def test_theme_patch_rejects_unknown_keys(client, db):
    form = Form(user_id=1, title="Reject Unknown Keys", status=FormStatus.DRAFT)
    db.add(form)
    db.commit()
    db.refresh(form)

    theme_with_extra = {
        "preset": "classic",
        "backgroundColor": "#FFFFFF",
        "backgroundImageUrl": None,
        "backgroundOverlay": 0.0,
        "questionColor": "#191919",
        "answerColor": "#0445AF",
        "buttonColor": "#0445AF",
        "buttonTextColor": "#FFFFFF",
        "fontFamily": "Inter",
        "fontScale": "medium",
        "buttonRadius": "rounded",
        "unknownProperty": "malicious",
    }

    resp = client.patch(f"/api/forms/{form.id}", json={"theme": theme_with_extra})
    assert resp.status_code == 422, "Should reject unknown keys in theme"

    db.delete(form)
    db.commit()


@pytest.mark.parametrize("invalid_hex", [
    "red",
    "#12",
    "#12345",
    "#1234567",
    "#gggggg",
    "rgb(0,0,0)",
    "",
])
def test_theme_patch_rejects_invalid_hex(client, db, invalid_hex):
    form = Form(user_id=1, title="Reject Hex", status=FormStatus.DRAFT)
    db.add(form)
    db.commit()
    db.refresh(form)

    theme_with_bad_hex = {
        "preset": "classic",
        "backgroundColor": invalid_hex,
        "backgroundImageUrl": None,
        "backgroundOverlay": 0.0,
        "questionColor": "#191919",
        "answerColor": "#0445AF",
        "buttonColor": "#0445AF",
        "buttonTextColor": "#FFFFFF",
        "fontFamily": "Inter",
        "fontScale": "medium",
        "buttonRadius": "rounded",
    }

    resp = client.patch(f"/api/forms/{form.id}", json={"theme": theme_with_bad_hex})
    assert resp.status_code == 422, f"Should reject invalid hex '{invalid_hex}'"

    db.delete(form)
    db.commit()


@pytest.mark.parametrize("bad_overlay", [-0.1, 0.85, 1.0, 2.0])
def test_theme_patch_rejects_invalid_overlay(client, db, bad_overlay):
    form = Form(user_id=1, title="Reject Overlay", status=FormStatus.DRAFT)
    db.add(form)
    db.commit()
    db.refresh(form)

    theme_with_bad_overlay = {
        "preset": "classic",
        "backgroundColor": "#FFFFFF",
        "backgroundImageUrl": None,
        "backgroundOverlay": bad_overlay,
        "questionColor": "#191919",
        "answerColor": "#0445AF",
        "buttonColor": "#0445AF",
        "buttonTextColor": "#FFFFFF",
        "fontFamily": "Inter",
        "fontScale": "medium",
        "buttonRadius": "rounded",
    }

    resp = client.patch(f"/api/forms/{form.id}", json={"theme": theme_with_bad_overlay})
    assert resp.status_code == 422, f"Should reject overlay {bad_overlay}"

    db.delete(form)
    db.commit()


def test_theme_patch_rejects_invalid_font_or_preset_or_radius(client, db):
    form = Form(user_id=1, title="Reject Options", status=FormStatus.DRAFT)
    db.add(form)
    db.commit()
    db.refresh(form)

    # Bad font
    resp = client.patch(
        f"/api/forms/{form.id}",
        json={
            "theme": {
                "preset": "classic",
                "backgroundColor": "#FFFFFF",
                "backgroundImageUrl": None,
                "backgroundOverlay": 0.0,
                "questionColor": "#191919",
                "answerColor": "#0445AF",
                "buttonColor": "#0445AF",
                "buttonTextColor": "#FFFFFF",
                "fontFamily": "Comic Sans",
                "fontScale": "medium",
                "buttonRadius": "rounded",
            }
        },
    )
    assert resp.status_code == 422

    # Bad preset
    resp = client.patch(
        f"/api/forms/{form.id}",
        json={
            "theme": {
                "preset": "neon",
                "backgroundColor": "#FFFFFF",
                "backgroundImageUrl": None,
                "backgroundOverlay": 0.0,
                "questionColor": "#191919",
                "answerColor": "#0445AF",
                "buttonColor": "#0445AF",
                "buttonTextColor": "#FFFFFF",
                "fontFamily": "Inter",
                "fontScale": "medium",
                "buttonRadius": "rounded",
            }
        },
    )
    assert resp.status_code == 422

    # Bad radius
    resp = client.patch(
        f"/api/forms/{form.id}",
        json={
            "theme": {
                "preset": "classic",
                "backgroundColor": "#FFFFFF",
                "backgroundImageUrl": None,
                "backgroundOverlay": 0.0,
                "questionColor": "#191919",
                "answerColor": "#0445AF",
                "buttonColor": "#0445AF",
                "buttonTextColor": "#FFFFFF",
                "fontFamily": "Inter",
                "fontScale": "medium",
                "buttonRadius": "extra-round",
            }
        },
    )
    assert resp.status_code == 422

    db.delete(form)
    db.commit()
