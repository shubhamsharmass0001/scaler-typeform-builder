"""
summary.py — Pydantic schemas for Form response analytics and summary metrics
"""

from typing import Optional, Any
from pydantic import BaseModel, Field

from app.models.enums import QuestionType


class OptionBreakdown(BaseModel):
    """Breakdown for choice/dropdown/yes_no questions."""
    option: str
    count: int
    percentage: float  # e.g. 45.5


class NumericStats(BaseModel):
    """Statistical summary for rating and number questions."""
    average: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    distribution: dict[str, int] = Field(
        default_factory=dict,
        description="Value-to-count distribution mapping, e.g. {'1': 2, '5': 10}",
    )


class TextStats(BaseModel):
    """Summary for short_text, long_text, and email questions."""
    total_answered: int
    recent_answers: list[str] = Field(
        default_factory=list,
        description="Up to 5 most recent non-empty text responses",
    )


class QuestionSummary(BaseModel):
    """Aggregated response metrics for an individual question."""
    question_id: int
    title: str
    type: QuestionType
    total_answered: int
    options_breakdown: Optional[list[OptionBreakdown]] = None
    numeric_stats: Optional[NumericStats] = None
    text_stats: Optional[TextStats] = None


class FormSummaryOut(BaseModel):
    """Complete summary report for a form's responses."""
    form_id: int
    total_responses: int
    completed_responses: int
    completion_rate: float  # 0.0 - 100.0 percentage
    drop_off_stats: dict[str, int] = Field(
        default_factory=dict,
        description="Mapping of question_id to abandon count at that step",
    )
    questions: list[QuestionSummary]
