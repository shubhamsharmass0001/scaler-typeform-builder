"""
upload.py — SQLAlchemy 2.0 Upload model for file_upload question type

Tracks uploaded files associated with forms and responses.
Physical files are stored under backend/uploads/ and cleaned up on deletion.
"""

import os
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Integer, String, event
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.form import Form
    from app.models.response import Response


# Directory where uploaded files are saved
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))


class Upload(Base):
    __tablename__ = "uploads"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Form association (deleting a form cascades and removes uploads)
    form_id: Mapped[int] = mapped_column(
        ForeignKey("forms.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Response session association (nullable until submission, cascades on delete)
    response_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("responses.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )

    # File attributes
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    form: Mapped["Form"] = relationship("Form", back_populates="uploads")
    response: Mapped[Optional["Response"]] = relationship("Response", back_populates="uploads")

    def __repr__(self) -> str:
        return f"<Upload id={self.id} form_id={self.form_id} file={self.original_name!r}>"


# Cleanup hook: delete physical file on disk when an Upload record is deleted
@event.listens_for(Upload, "after_delete")
def delete_physical_file(mapper, connection, target: Upload):
    if target.stored_name:
        file_path = os.path.join(UPLOAD_DIR, target.stored_name)
        if os.path.isfile(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
