"""
question.py — Pydantic v2 schemas for Question input and output
"""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import QuestionType


class QuestionBase(BaseModel):
    """Common fields for question definitions."""
    type: QuestionType = Field(..., description="One of the 8 supported question types")
    title: str = Field(..., min_length=1, max_length=255, description="Question headline")
    description: Optional[str] = Field(None, description="Optional supporting subtitle/help text")
    required: bool = Field(False, description="Whether an answer is required to proceed")
    position: int = Field(0, description="Display order within the form")
    properties: dict[str, Any] = Field(
        default_factory=dict,
        description="Type-specific properties (e.g. choices, min/max, placeholder, etc.)",
    )


class QuestionIn(QuestionBase):
    """Payload for creating or updating a question."""
    pass


class BulkQuestionItem(BaseModel):
    """
    Question definition within a bulk save request.
    Existing questions carry their integer `id`; newly added questions omit `id` (or pass null).
    `position` is implicitly assigned from the array order.
    """
    id: Optional[int] = Field(None, description="Existing question ID if updating; None if newly added")
    type: QuestionType = Field(..., description="One of the 8 supported question types")
    title: str = Field(..., min_length=1, max_length=255, description="Question headline")
    description: Optional[str] = Field(None, description="Optional supporting subtitle/help text")
    required: bool = Field(False, description="Whether an answer is required to proceed")
    properties: dict[str, Any] = Field(
        default_factory=dict,
        description="Type-specific properties (options, allowOther, min, max, steps, shape, etc.)",
    )


class QuestionOut(QuestionBase):
    """Serialized question representation returned to API consumers."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    form_id: int
    created_at: datetime
    updated_at: datetime
