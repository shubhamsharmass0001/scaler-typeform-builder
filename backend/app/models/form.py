"""
form.py — SQLAlchemy 2.0 Form model

Represents a form containing questions, theme configuration,
welcome and thank-you screens, and recorded respondent responses.
"""

from datetime import datetime
from typing import Optional, Any, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SAEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import FormStatus

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.question import Question
    from app.models.response import Response
    from app.models.upload import Upload


def default_theme() -> dict[str, Any]:
    """Default Typeform-inspired visual theme tokens."""
    return {
        "preset": "classic",
        "backgroundColor": "#FFFFFF",
        "backgroundImageUrl": None,
        "backgroundOverlay": 0.0,
        "questionColor": "#191919",
        "answerColor": "#0445AF",
        "buttonColor": "#0445AF",
        "buttonTextColor": "#FFFFFF",
        "fontFamily": "Inter",
        "fontScale": "medium",
        "buttonRadius": "rounded",
    }


class Form(Base):
    __tablename__ = "forms"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Foreign key to users
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Basic metadata
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Status: draft or published (defaults to draft)
    status: Mapped[FormStatus] = mapped_column(
        SAEnum(FormStatus, native_enum=False),
        default=FormStatus.DRAFT,
        nullable=False,
    )

    # Public slug: unique, indexed, nullable until first publish
    slug: Mapped[Optional[str]] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=True,
    )

    # Theme customization stored as JSON
    theme: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSON,
        default=default_theme,
        nullable=True,
    )

    # Welcome screen customization
    welcome_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    welcome_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    welcome_button_text: Mapped[Optional[str]] = mapped_column(String(100), default="Start", nullable=True)

    # Thank-you screen customization
    thank_you_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    thank_you_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="forms")

    # Ordered questions list; deleting a form cascades down to all its questions
    questions: Mapped[list["Question"]] = relationship(
        "Question",
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="Question.position",
    )

    # Respondent submissions; deleting a form cascades down to all its responses
    responses: Mapped[list["Response"]] = relationship(
        "Response",
        back_populates="form",
        cascade="all, delete-orphan",
    )

    # Form uploads; deleting a form cascades down to all its uploads
    uploads: Mapped[list["Upload"]] = relationship(
        "Upload",
        back_populates="form",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Form id={self.id} title={self.title!r} status={self.status.value}>"
