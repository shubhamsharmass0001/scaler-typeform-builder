"""
registry.py — Validator registry keyed by QuestionType

Each validator takes (question, raw_value) and returns:
  - Normalized value on success
  - None if the value is empty and the question is optional
  - Raises ValidationError on violation
"""

import re
from typing import Any, Callable
from app.models.enums import QuestionType
from app.validators.exceptions import ValidationError

# RFC 5322 simplified standard email regex
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def _is_empty(value: Any) -> bool:
    """Helper to detect empty inputs (None, whitespace strings, empty collections)."""
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    if isinstance(value, (list, tuple, dict, set)) and len(value) == 0:
        return True
    return False


def validate_short_text(question: Any, raw_value: Any) -> Any:
    """Validate short text (max 255 chars)."""
    if _is_empty(raw_value):
        if question.required:
            raise ValidationError("This field is required")
        return None

    if not isinstance(raw_value, str):
        raw_value = str(raw_value)

    cleaned = raw_value.strip()
    if len(cleaned) > 255:
        raise ValidationError("Response must be 255 characters or fewer")
    return cleaned


def validate_long_text(question: Any, raw_value: Any) -> Any:
    """Validate long text (max 2000 chars)."""
    if _is_empty(raw_value):
        if question.required:
            raise ValidationError("This field is required")
        return None

    if not isinstance(raw_value, str):
        raw_value = str(raw_value)

    cleaned = raw_value.strip()
    if len(cleaned) > 2000:
        raise ValidationError("Response must be 2000 characters or fewer")
    return cleaned


def validate_email(question: Any, raw_value: Any) -> Any:
    """Validate email address format and normalize to lowercase."""
    if _is_empty(raw_value):
        if question.required:
            raise ValidationError("This field is required")
        return None

    cleaned = str(raw_value).strip().lower()
    if not EMAIL_REGEX.match(cleaned):
        raise ValidationError("Please enter a valid email address")
    return cleaned


def validate_number(question: Any, raw_value: Any) -> Any:
    """Validate numeric input with optional min/max boundaries."""
    if _is_empty(raw_value):
        if question.required:
            raise ValidationError("This field is required")
        return None

    try:
        num = float(raw_value)
    except (ValueError, TypeError):
        raise ValidationError("Please enter a valid number")

    props = question.properties or {}
    min_val = props.get("min")
    max_val = props.get("max")

    if min_val is not None and num < float(min_val):
        raise ValidationError(f"Value must be at least {min_val}")
    if max_val is not None and num > float(max_val):
        raise ValidationError(f"Value must be at most {max_val}")

    return int(num) if num.is_integer() else num


def validate_yes_no(question: Any, raw_value: Any) -> Any:
    """Validate boolean yes/no choice."""
    if _is_empty(raw_value):
        if question.required:
            raise ValidationError("This field is required")
        return None

    if isinstance(raw_value, bool):
        return raw_value

    if isinstance(raw_value, (int, float)):
        if raw_value == 1:
            return True
        if raw_value == 0:
            return False

    if isinstance(raw_value, str):
        lowered = raw_value.strip().lower()
        if lowered in ("true", "yes", "y", "1"):
            return True
        if lowered in ("false", "no", "n", "0"):
            return False

    raise ValidationError("Please select Yes or No")


def _get_option_keys(options: list) -> tuple[set[str], dict[str, str]]:
    """
    Extract set of valid IDs/labels and a mapping from label to ID.
    Options can be either strings or objects with 'id' and 'label'.
    """
    valid_keys = set()
    label_to_id = {}
    for opt in options:
        if isinstance(opt, dict):
            opt_id = str(opt.get("id", "")).strip()
            opt_label = str(opt.get("label", "")).strip()
            if opt_id:
                valid_keys.add(opt_id)
            if opt_label:
                valid_keys.add(opt_label)
                if opt_id:
                    label_to_id[opt_label] = opt_id
        elif isinstance(opt, str):
            clean_str = opt.strip()
            if clean_str:
                valid_keys.add(clean_str)
    return valid_keys, label_to_id


def validate_multiple_choice(question: Any, raw_value: Any) -> Any:
    """
    Validate multiple choice answers.
    Supports single or multi-select and allowOther custom entries.
    """
    if _is_empty(raw_value):
        if question.required:
            raise ValidationError("This field is required")
        return None

    props = question.properties or {}
    options = props.get("options", [])
    allow_other = bool(props.get("allowOther", False))
    is_multi = bool(props.get("multiple", False))

    valid_keys, label_to_id = _get_option_keys(options)

    if is_multi:
        if not isinstance(raw_value, list):
            raw_value = [raw_value]

        normalized_list = []
        for item in raw_value:
            if isinstance(item, dict):
                # e.g. {"id": "other", "value": "User custom text"}
                if allow_other and (item.get("id") == "other" or "value" in item):
                    normalized_list.append(item)
                    continue
                item_val = str(item.get("id", item.get("label", ""))).strip()
            else:
                item_val = str(item).strip()

            if item_val in valid_keys:
                normalized_list.append(label_to_id.get(item_val, item_val))
            elif allow_other:
                normalized_list.append(item_val)
            else:
                raise ValidationError(f"Invalid option: '{item_val}'")

        if not normalized_list and question.required:
            raise ValidationError("This field is required")
        return normalized_list

    else:
        # Single choice
        val = raw_value[0] if isinstance(raw_value, list) and len(raw_value) == 1 else raw_value

        if isinstance(val, dict):
            if allow_other and (val.get("id") == "other" or "value" in val):
                return val
            val = str(val.get("id", val.get("label", ""))).strip()
        else:
            val = str(val).strip()

        if val in valid_keys:
            return label_to_id.get(val, val)
        elif allow_other:
            return val
        else:
            raise ValidationError("Selected option is not valid")


def validate_dropdown(question: Any, raw_value: Any) -> Any:
    """Validate dropdown single-select answer against configured options."""
    if _is_empty(raw_value):
        if question.required:
            raise ValidationError("This field is required")
        return None

    props = question.properties or {}
    options = props.get("options", [])
    valid_keys, label_to_id = _get_option_keys(options)

    val = raw_value[0] if isinstance(raw_value, list) and len(raw_value) == 1 else raw_value

    if isinstance(val, dict):
        val = str(val.get("id", val.get("label", ""))).strip()
    else:
        val = str(val).strip()

    if val not in valid_keys:
        raise ValidationError("Selected option is not valid")

    return label_to_id.get(val, val)


def validate_rating(question: Any, raw_value: Any) -> Any:
    """Validate rating scale answer (integer between 1 and steps, default 5)."""
    if _is_empty(raw_value):
        if question.required:
            raise ValidationError("This field is required")
        return None

    props = question.properties or {}
    steps = int(props.get("steps", 5))

    try:
        val = int(raw_value)
    except (ValueError, TypeError):
        raise ValidationError("Rating must be a whole number")

    if val < 1 or val > steps:
        raise ValidationError(f"Rating must be between 1 and {steps}")

    return val


# Registry mapping QuestionType enum values to validator functions
VALIDATORS: dict[QuestionType, Callable[[Any, Any], Any]] = {
    QuestionType.SHORT_TEXT: validate_short_text,
    QuestionType.LONG_TEXT: validate_long_text,
    QuestionType.EMAIL: validate_email,
    QuestionType.NUMBER: validate_number,
    QuestionType.YES_NO: validate_yes_no,
    QuestionType.MULTIPLE_CHOICE: validate_multiple_choice,
    QuestionType.DROPDOWN: validate_dropdown,
    QuestionType.RATING: validate_rating,
}


def validate_answer(question: Any, raw_value: Any) -> Any:
    """
    Entrypoint to validate an answer against its question type.
    Looks up the validator by question.type and returns the normalized value.
    """
    q_type = question.type
    # Handle both QuestionType enum and string representations
    if isinstance(q_type, str):
        try:
            q_type = QuestionType(q_type)
        except ValueError:
            raise ValidationError(f"Unsupported question type '{q_type}'")

    validator = VALIDATORS.get(q_type)
    if not validator:
        raise ValidationError(f"No validator registered for question type '{q_type}'")

    return validator(question, raw_value)
