"""
question.py — SQLAlchemy 2.0 Question model

Represents a single step/question inside a form.
Stores question type (one of 8 supported types) and type-specific properties in JSON.
"""

from datetime import datetime
from typing import Optional, Any, TYPE_CHECKING
from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey, Enum as SAEnum, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import QuestionType

if TYPE_CHECKING:
    from app.models.form import Form
    from app.models.answer import Answer


class Question(Base):
    __tablename__ = "questions"

    # Composite index for fast ordering without blocking intermediate reordering swaps
    __table_args__ = (
        Index("ix_questions_form_id_position", "form_id", "position"),
    )

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Parent form relationship (cascades on delete)
    form_id: Mapped[int] = mapped_column(
        ForeignKey("forms.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Type of question (short_text, rating, etc.)
    type: Mapped[QuestionType] = mapped_column(
        SAEnum(QuestionType, native_enum=False),
        nullable=False,
    )

    # Content
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Validation & ordering
    required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Flexible type-specific attributes (choices, min/max, steps, shape, etc.)
    properties: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    form: Mapped["Form"] = relationship("Form", back_populates="questions")

    # If a question is deleted, all its answers are also deleted
    answers: Mapped[list["Answer"]] = relationship(
        "Answer",
        back_populates="question",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Question id={self.id} type={self.type.value} position={self.position} title={self.title[:20]!r}>"
