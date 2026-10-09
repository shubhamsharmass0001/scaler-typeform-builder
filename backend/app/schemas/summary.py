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


class OverallStats(BaseModel):
    """Overall response progress metrics for the form."""
    started: int
    completed: int
    partial: int
    completion_rate: float  # completed / started ratio (0.0 - 1.0)
    average_completion_seconds: Optional[float] = None


class DropoffQuestion(BaseModel):
    """Drop-off funnel metrics for a single question."""
    question_id: int
    title: str
    position: int
    reached_count: int
    dropped_here_count: int
    dropoff_percent: float  # e.g. 20.0%


class FormSummaryOut(BaseModel):
    """Complete summary report for a form's responses."""
    form_id: int
    total_responses: int
    completed_responses: int
    completion_rate: float  # 0.0 - 100.0 percentage for backwards compatibility
    drop_off_stats: dict[str, int] = Field(
        default_factory=dict,
        description="Mapping of question_id to abandon count at that step",
    )
    overall: OverallStats
    dropoff: list[DropoffQuestion] = Field(
        default_factory=list,
        description="Ordered list of drop-off funnel metrics per question",
    )
    questions: list[QuestionSummary]
