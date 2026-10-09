"""
upload.py — Pydantic v2 schemas for file uploads
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class UploadOut(BaseModel):
    """Returned when a file is uploaded."""
    upload_id: int = Field(..., description="Unique upload identifier")
    name: str = Field(..., description="Sanitized original filename")
    size: int = Field(..., description="File size in bytes")


class UploadDetailOut(BaseModel):
    """Full metadata for an uploaded file."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    form_id: int
    response_id: Optional[int] = None
    original_name: str
    stored_name: str
    mime_type: str
    size_bytes: int
    created_at: datetime
