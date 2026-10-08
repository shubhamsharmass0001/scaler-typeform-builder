"""
form.py — Pydantic v2 schemas for Form input, update, and serialized output
"""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import FormStatus
from app.schemas.question import QuestionOut


class FormBase(BaseModel):
    """Common metadata fields across form schemas."""
    title: str = Field(default="Untitled form", min_length=1, max_length=255, description="Form title")
    description: Optional[str] = Field(None, description="Optional form description")
    theme: Optional[dict[str, Any]] = Field(
        None,
        description="JSON theme token overrides (backgroundColor, textColor, buttonColor, fontFamily)",
    )
    welcome_title: Optional[str] = Field(None, max_length=255)
    welcome_description: Optional[str] = Field(None)
    welcome_button_text: Optional[str] = Field("Start", max_length=100)
    thank_you_title: Optional[str] = Field("Thank you!", max_length=255)
    thank_you_message: Optional[str] = Field("Your response has been recorded.")


class FormCreate(BaseModel):
    """Payload for creating a new form."""
    title: Optional[str] = Field("Untitled form", max_length=255)
    description: Optional[str] = None
    theme: Optional[dict[str, Any]] = None
    welcome_title: Optional[str] = None
    welcome_description: Optional[str] = None
    welcome_button_text: Optional[str] = "Start"
    thank_you_title: Optional[str] = "Thank you!"
    thank_you_message: Optional[str] = "Your response has been recorded."


class FormUpdate(BaseModel):
    """Partial update payload for a form."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[FormStatus] = None
    slug: Optional[str] = Field(None, max_length=255)
    theme: Optional[dict[str, Any]] = None
    welcome_title: Optional[str] = None
    welcome_description: Optional[str] = None
    welcome_button_text: Optional[str] = None
    thank_you_title: Optional[str] = None
    thank_you_message: Optional[str] = None


class FormOut(FormBase):
    """Full form payload including questions, returned for builder and preview."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: FormStatus
    slug: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    questions: list[QuestionOut] = []


class FormListItem(BaseModel):
    """Condensed form summary used in dashboard lists."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    status: FormStatus
    slug: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    response_count: int = 0
    question_count: int = 0


class PublishOut(BaseModel):
    """Response returned when a form is published."""
    status: FormStatus
    slug: str
    public_url: str


class MessageOut(BaseModel):
    """Standard message payload for simple mutations (e.g. delete)."""
    detail: str
