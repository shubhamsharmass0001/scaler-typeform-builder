"""
answer.py — SQLAlchemy 2.0 Answer model

Represents a single answer provided by a respondent for a specific question.
Stores arbitrary structured values (string, integer, array of choices, etc.) in JSON.
"""

from datetime import datetime
from typing import Any, Optional, TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.response import Response
    from app.models.question import Question


class Answer(Base):
    __tablename__ = "answers"

    # Enforce at most one answer per question per response session
    __table_args__ = (
        UniqueConstraint("response_id", "question_id", name="uq_answers_response_question"),
    )

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Foreign key to parent response session
    response_id: Mapped[int] = mapped_column(
        ForeignKey("responses.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Foreign key to target question
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # The actual answer value, stored flexibly as JSON:
    # - short/long text: string
    # - number/rating: integer/float
    # - yes_no: boolean
    # - multiple_choice/dropdown: string or list of choice IDs/strings
    value: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)

    # Audit timestamp
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    response: Mapped["Response"] = relationship("Response", back_populates="answers")
    question: Mapped["Question"] = relationship("Question", back_populates="answers")

    def __repr__(self) -> str:
        return f"<Answer id={self.id} response_id={self.response_id} question_id={self.question_id}>"
