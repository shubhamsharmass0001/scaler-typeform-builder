"""
response.py — Pydantic v2 schemas for Responses and Answers
"""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import QuestionType


class AnswerIn(BaseModel):
    """Payload representing an answer to a single question."""
    question_id: int = Field(..., description="Target question ID")
    value: Any = Field(None, description="Arbitrary JSON value (string, number, array, boolean, etc.)")


class AnswerOut(BaseModel):
    """Serialized answer response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    response_id: int
    question_id: int
    value: Any
    created_at: datetime


class AnswerWithQuestionOut(BaseModel):
    """Answer joined with target question title and type for rich inspector view."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    response_id: int
    question_id: int
    question_title: str
    question_type: QuestionType
    value: Any
    created_at: datetime


class ResponseOut(BaseModel):
    """Serialized form response/session record."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    form_id: int
    started_at: datetime
    submitted_at: Optional[datetime] = None
    is_complete: bool
    last_question_id: Optional[int] = None
    answers: list[AnswerOut] = []


class ResponseDetailOut(BaseModel):
    """Single response record with answers augmented with question details."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    form_id: int
    started_at: datetime
    submitted_at: Optional[datetime] = None
    is_complete: bool
    last_question_id: Optional[int] = None
    answers: list[AnswerWithQuestionOut] = []


class PaginatedResponsesOut(BaseModel):
    """Paginated collection of responses for a form."""
    items: list[ResponseOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class SubmitPayload(BaseModel):
    """
    Payload sent when a respondent submits a form or updates their in-progress session.
    """
    answers: list[AnswerIn] = Field(default_factory=list, description="List of answers supplied so far")
    last_question_id: Optional[int] = Field(None, description="Last question reached (for drop-off analytics)")
    is_complete: bool = Field(True, description="True if respondent reached and finished the final thank you screen")
