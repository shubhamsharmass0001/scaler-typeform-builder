"""
response.py — SQLAlchemy 2.0 Response model

Represents a respondent's session or submission for a form.
Tracks session progress, completion status, and drop-off question.
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.form import Form
    from app.models.answer import Answer


class Response(Base):
    __tablename__ = "responses"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Parent form relationship (cascades on delete)
    form_id: Mapped[int] = mapped_column(
        ForeignKey("forms.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Submission lifecycle
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_complete: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Drop-off tracking: last question viewed/answered before abandoning
    last_question_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    form: Mapped["Form"] = relationship("Form", back_populates="responses")

    # If a response is deleted, all its individual answers are deleted
    answers: Mapped[list["Answer"]] = relationship(
        "Answer",
        back_populates="response",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Response id={self.id} form_id={self.form_id} is_complete={self.is_complete}>"
