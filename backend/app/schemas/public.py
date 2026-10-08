"""
public.py — Pydantic schemas for Public Form respondent endpoints
"""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import QuestionType


class PublicQuestionOut(BaseModel):
    """Respondent-facing question representation (excludes internal timestamps)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: QuestionType
    title: str
    description: Optional[str] = None
    required: bool
    position: int
    properties: dict[str, Any] = Field(default_factory=dict)


class PublicFormOut(BaseModel):
    """
    Public form representation for respondents.
    Includes theme, welcome/thank-you screens, and questions, but excludes creator user_id.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    slug: str
    theme: Optional[dict[str, Any]] = None
    welcome_title: Optional[str] = None
    welcome_description: Optional[str] = None
    welcome_button_text: Optional[str] = "Start"
    thank_you_title: Optional[str] = "Thank you!"
    thank_you_message: Optional[str] = "Your response has been recorded."
    questions: list[PublicQuestionOut] = []


class StartResponseOut(BaseModel):
    """Response returned when a respondent starts a new session."""
    response_id: int


class PublicAnswerItem(BaseModel):
    """A single question answer submitted by the respondent."""
    question_id: int
    value: Any = None


class PublicSubmitPayload(BaseModel):
    """Payload sent by respondent upon submitting their answers."""
    response_id: Optional[int] = None
    answers: list[PublicAnswerItem] = Field(default_factory=list)


class PublicSubmitOut(BaseModel):
    """Response returned upon successful submission."""
    status: str = "success"
    response_id: int
    submitted_at: datetime


class ProgressPayload(BaseModel):
    """Payload to save respondent drop-off progress."""
    response_id: int
    last_question_id: int


class ProgressOut(BaseModel):
    """Response returned after recording question drop-off progress."""
    status: str = "ok"
    response_id: int
    last_question_id: int
