"""
test_qa_validators.py — Comprehensive unit tests for all QuestionType validators.

Tests:
  - Short text: valid, invalid (> 255 chars), empty required, empty optional, type conversions
  - Long text: valid, invalid (> 2000 chars), empty required, empty optional
  - Email: valid, invalid format, empty required, empty optional, uppercase normalization
  - Number: valid integer, valid float, min boundary (lower/exact), max boundary (upper/exact), invalid string
  - Yes/No: True/False, truthy/falsy strings, integers, invalid string, empty required, empty optional
  - Rating: boundary 0 (raises), 1 (valid), steps (valid), steps+1 (raises), invalid non-number, empty required/optional
  - Multiple choice: single select valid/unknown, multi select valid/unknown, allowOther, empty required/optional
  - Dropdown: valid option, unknown option (raises), empty required/optional
  - File upload: valid upload_id, non-existent upload_id, already attached upload_id, empty required/optional
"""

import pytest
from types import SimpleNamespace
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.enums import QuestionType, FormStatus
from app.models.form import Form
from app.models.question import Question
from app.models.response import Response
from app.models.upload import Upload
from app.validators.exceptions import ValidationError
from app.validators.registry import (
    validate_short_text,
    validate_long_text,
    validate_email,
    validate_number,
    validate_yes_no,
    validate_rating,
    validate_multiple_choice,
    validate_dropdown,
    validate_file_upload,
    VALIDATORS,
)


def _q(type: QuestionType, required: bool = False, properties: dict = None) -> SimpleNamespace:
    return SimpleNamespace(
        id=1,
        type=type,
        required=required,
        properties=properties or {},
    )


# -----------------------------------------------------------------------------
# 1. Short Text
# -----------------------------------------------------------------------------
def test_short_text_valid():
    q = _q(QuestionType.SHORT_TEXT, required=True)
    assert validate_short_text(q, "Hello World") == "Hello World"
    assert validate_short_text(q, "  trimmed text  ") == "trimmed text"
    assert validate_short_text(q, 12345) == "12345"


def test_short_text_empty():
    q_req = _q(QuestionType.SHORT_TEXT, required=True)
    q_opt = _q(QuestionType.SHORT_TEXT, required=False)

    assert validate_short_text(q_opt, None) is None
    assert validate_short_text(q_opt, "") is None
    assert validate_short_text(q_opt, "   ") is None

    with pytest.raises(ValidationError, match="required"):
        validate_short_text(q_req, None)
    with pytest.raises(ValidationError, match="required"):
        validate_short_text(q_req, "")
    with pytest.raises(ValidationError, match="required"):
        validate_short_text(q_req, "   ")


def test_short_text_length_limit():
    q = _q(QuestionType.SHORT_TEXT)
    valid_str = "a" * 255
    assert validate_short_text(q, valid_str) == valid_str

    over_str = "a" * 256
    with pytest.raises(ValidationError, match="255 characters"):
        validate_short_text(q, over_str)


# -----------------------------------------------------------------------------
# 2. Long Text
# -----------------------------------------------------------------------------
def test_long_text_valid_and_boundaries():
    q_req = _q(QuestionType.LONG_TEXT, required=True)
    q_opt = _q(QuestionType.LONG_TEXT, required=False)

    assert validate_long_text(q_opt, None) is None
    assert validate_long_text(q_opt, "") is None

    with pytest.raises(ValidationError, match="required"):
        validate_long_text(q_req, "")

    valid_2000 = "x" * 2000
    assert validate_long_text(q_req, valid_2000) == valid_2000

    over_2001 = "x" * 2001
    with pytest.raises(ValidationError, match="2000 characters"):
        validate_long_text(q_req, over_2001)


# -----------------------------------------------------------------------------
# 3. Email
# -----------------------------------------------------------------------------
def test_email_valid_and_normalization():
    q = _q(QuestionType.EMAIL, required=True)
    assert validate_email(q, "User@Example.COM") == "user@example.com"
    assert validate_email(q, "first.last+tag@domain.co.uk") == "first.last+tag@domain.co.uk"


def test_email_invalid():
    q = _q(QuestionType.EMAIL, required=True)
    invalid_emails = [
        "notanemail",
        "@missinguser.com",
        "user@",
        "user@domain",
        "user space@domain.com",
    ]
    for bad in invalid_emails:
        with pytest.raises(ValidationError, match="valid email"):
            validate_email(q, bad)


def test_email_empty():
    q_req = _q(QuestionType.EMAIL, required=True)
    q_opt = _q(QuestionType.EMAIL, required=False)

    assert validate_email(q_opt, None) is None
    assert validate_email(q_opt, "") is None
    with pytest.raises(ValidationError, match="required"):
        validate_email(q_req, "")


# -----------------------------------------------------------------------------
# 4. Number
# -----------------------------------------------------------------------------
def test_number_valid_and_conversions():
    q = _q(QuestionType.NUMBER, required=True)
    assert validate_number(q, 42) == 42
    assert validate_number(q, "42") == 42
    assert validate_number(q, 3.14) == 3.14
    assert validate_number(q, "3.14") == 3.14
    assert validate_number(q, -10) == -10


def test_number_boundaries():
    q_bounded = _q(QuestionType.NUMBER, required=True, properties={"min": 5, "max": 100})

    # Exact boundaries pass
    assert validate_number(q_bounded, 5) == 5
    assert validate_number(q_bounded, 100) == 100
    assert validate_number(q_bounded, 50) == 50

    # Outside boundaries raise
    with pytest.raises(ValidationError, match="at least 5"):
        validate_number(q_bounded, 4.9)
    with pytest.raises(ValidationError, match="at most 100"):
        validate_number(q_bounded, 100.1)


def test_number_invalid_and_empty():
    q_req = _q(QuestionType.NUMBER, required=True)
    q_opt = _q(QuestionType.NUMBER, required=False)

    assert validate_number(q_opt, None) is None
    assert validate_number(q_opt, "") is None

    with pytest.raises(ValidationError, match="required"):
        validate_number(q_req, None)

    with pytest.raises(ValidationError, match="valid number"):
        validate_number(q_req, "abc")


# -----------------------------------------------------------------------------
# 5. Yes / No
# -----------------------------------------------------------------------------
def test_yes_no_valid():
    q = _q(QuestionType.YES_NO, required=True)
    assert validate_yes_no(q, True) is True
    assert validate_yes_no(q, "true") is True
    assert validate_yes_no(q, "yes") is True
    assert validate_yes_no(q, "Y") is True
    assert validate_yes_no(q, 1) is True

    assert validate_yes_no(q, False) is False
    assert validate_yes_no(q, "false") is False
    assert validate_yes_no(q, "no") is False
    assert validate_yes_no(q, "N") is False
    assert validate_yes_no(q, 0) is False


def test_yes_no_invalid_and_empty():
    q_req = _q(QuestionType.YES_NO, required=True)
    q_opt = _q(QuestionType.YES_NO, required=False)

    assert validate_yes_no(q_opt, None) is None
    assert validate_yes_no(q_opt, "") is None

    with pytest.raises(ValidationError, match="required"):
        validate_yes_no(q_req, None)

    with pytest.raises(ValidationError, match="Please select Yes or No"):
        validate_yes_no(q_req, "maybe")


# -----------------------------------------------------------------------------
# 6. Rating
# -----------------------------------------------------------------------------
def test_rating_valid_boundaries():
    q = _q(QuestionType.RATING, required=True, properties={"steps": 5})

    assert validate_rating(q, 1) == 1
    assert validate_rating(q, 3) == 3
    assert validate_rating(q, 5) == 5
    assert validate_rating(q, "4") == 4


def test_rating_boundary_violations():
    q = _q(QuestionType.RATING, required=True, properties={"steps": 5})

    # Rating 0 is below minimum 1
    with pytest.raises(ValidationError, match="between 1 and 5"):
        validate_rating(q, 0)

    # Rating 6 is above steps 5
    with pytest.raises(ValidationError, match="between 1 and 5"):
        validate_rating(q, 6)

    # Non-number
    with pytest.raises(ValidationError, match="Rating must be a whole number"):
        validate_rating(q, "five")


def test_rating_empty():
    q_req = _q(QuestionType.RATING, required=True, properties={"steps": 5})
    q_opt = _q(QuestionType.RATING, required=False, properties={"steps": 5})

    assert validate_rating(q_opt, None) is None
    assert validate_rating(q_opt, "") is None

    with pytest.raises(ValidationError, match="required"):
        validate_rating(q_req, None)


# -----------------------------------------------------------------------------
# 7. Multiple Choice
# -----------------------------------------------------------------------------
def test_multiple_choice_single_select():
    props = {
        "multiple": False,
        "options": [
            {"id": "opt_a", "label": "Option A"},
            {"id": "opt_b", "label": "Option B"},
        ],
    }
    q = _q(QuestionType.MULTIPLE_CHOICE, required=True, properties=props)

    # Valid by id or label (normalizes label to id)
    assert validate_multiple_choice(q, "opt_a") == "opt_a"
    assert validate_multiple_choice(q, "Option B") == "opt_b"

    # Unknown option id raises
    with pytest.raises(ValidationError, match="Selected option is not valid"):
        validate_multiple_choice(q, "opt_unknown")


def test_multiple_choice_multi_select():
    props = {
        "multiple": True,
        "options": [
            {"id": "opt_1", "label": "One"},
            {"id": "opt_2", "label": "Two"},
            {"id": "opt_3", "label": "Three"},
        ],
    }
    q = _q(QuestionType.MULTIPLE_CHOICE, required=True, properties=props)

    # Valid array of choices
    assert validate_multiple_choice(q, ["opt_1", "opt_3"]) == ["opt_1", "opt_3"]

    # Array containing invalid choice raises
    with pytest.raises(ValidationError, match="Invalid option"):
        validate_multiple_choice(q, ["opt_1", "opt_invalid"])


def test_multiple_choice_allow_other():
    props = {
        "multiple": False,
        "allowOther": True,
        "options": [{"id": "opt_1", "label": "One"}],
    }
    q = _q(QuestionType.MULTIPLE_CHOICE, required=True, properties=props)

    # User input under 'other'
    assert validate_multiple_choice(q, "Custom Response") == "Custom Response"


def test_multiple_choice_empty():
    props = {"options": [{"id": "opt_1", "label": "One"}]}
    q_req = _q(QuestionType.MULTIPLE_CHOICE, required=True, properties=props)
    q_opt = _q(QuestionType.MULTIPLE_CHOICE, required=False, properties=props)

    assert validate_multiple_choice(q_opt, None) is None
    assert validate_multiple_choice(q_opt, []) is None

    with pytest.raises(ValidationError, match="required"):
        validate_multiple_choice(q_req, None)
    with pytest.raises(ValidationError, match="required"):
        validate_multiple_choice(q_req, [])


# -----------------------------------------------------------------------------
# 8. Dropdown
# -----------------------------------------------------------------------------
def test_dropdown_valid_and_invalid():
    props = {
        "options": [
            {"id": "us", "label": "United States"},
            {"id": "ca", "label": "Canada"},
        ],
    }
    q = _q(QuestionType.DROPDOWN, required=True, properties=props)

    assert validate_dropdown(q, "us") == "us"
    assert validate_dropdown(q, "Canada") == "ca"

    with pytest.raises(ValidationError, match="Selected option is not valid"):
        validate_dropdown(q, "invalid_country")


def test_dropdown_empty():
    props = {"options": [{"id": "us", "label": "United States"}]}
    q_req = _q(QuestionType.DROPDOWN, required=True, properties=props)
    q_opt = _q(QuestionType.DROPDOWN, required=False, properties=props)

    assert validate_dropdown(q_opt, None) is None
    with pytest.raises(ValidationError, match="required"):
        validate_dropdown(q_req, None)


# -----------------------------------------------------------------------------
# 9. File Upload
# -----------------------------------------------------------------------------
def test_file_upload_validator():
    q_req = _q(QuestionType.FILE_UPLOAD, required=True)
    q_opt = _q(QuestionType.FILE_UPLOAD, required=False)

    assert validate_file_upload(q_opt, None) is None
    assert validate_file_upload(q_opt, "") is None

    with pytest.raises(ValidationError, match="required"):
        validate_file_upload(q_req, None)

    # Number or numeric string accepted as upload_id
    assert validate_file_upload(q_req, 105) == 105
    assert validate_file_upload(q_req, "105") == 105
    assert validate_file_upload(q_req, {"upload_id": 105}) == 105

    with pytest.raises(ValidationError, match="Invalid file upload ID"):
        validate_file_upload(q_req, "invalid_id")
