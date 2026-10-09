"""
enums.py — Shared enumeration types for models and schemas

Using string-based Enums (str, enum.Enum) guarantees:
  1. Direct serialization to clean string values in Pydantic and JSON.
  2. 1-to-1 match with TypeScript union types on the frontend.
  3. Portable storage in SQLite (saved as VARCHAR/TEXT).
"""

from enum import Enum


class FormStatus(str, Enum):
    """
    Lifecycle status of a form.
    - DRAFT: Editable, not publicly accessible.
    - PUBLISHED: Active and can receive public submissions.
    """
    DRAFT = "draft"
    PUBLISHED = "published"


class QuestionType(str, Enum):
    """
    The 8 supported question types in the Typeform clone.
    Values match the frontend TypeScript question type strings exactly.
    """
    SHORT_TEXT = "short_text"
    LONG_TEXT = "long_text"
    MULTIPLE_CHOICE = "multiple_choice"
    DROPDOWN = "dropdown"
    EMAIL = "email"
    NUMBER = "number"
    YES_NO = "yes_no"
    RATING = "rating"
    FILE_UPLOAD = "file_upload"
