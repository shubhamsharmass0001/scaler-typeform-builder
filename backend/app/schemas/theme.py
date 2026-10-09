"""
theme.py — Pydantic schema for Form Theme validation

Enforces strict schema constraints:
  - preset: 'classic' | 'midnight' | 'sunset' | 'forest' | 'custom'
  - backgroundColor, questionColor, answerColor, buttonColor, buttonTextColor: valid #hex format
  - backgroundImageUrl: None or valid URL string
  - backgroundOverlay: float in [0.0, 0.8]
  - fontFamily: one of 6 allowed fonts ('Inter', 'Roboto', 'Outfit', 'Playfair Display', 'Poppins', 'Space Grotesk')
  - fontScale: 'small' | 'medium' | 'large'
  - buttonRadius: 'square' | 'rounded' | 'pill'
  - Reject unknown keys (extra='forbid')
"""

import re
from typing import Optional, Literal, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

HEX_REGEX = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")

ALLOWED_PRESETS = ("classic", "midnight", "sunset", "forest", "custom")
ALLOWED_FONTS = (
    "Inter",
    "Roboto",
    "Outfit",
    "Playfair Display",
    "Poppins",
    "Space Grotesk",
)
ALLOWED_FONT_SCALES = ("small", "medium", "large")
ALLOWED_BUTTON_RADII = ("square", "rounded", "pill")


class ThemeSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="before")
    @classmethod
    def normalize_legacy_keys(cls, data: Any) -> Any:
        if isinstance(data, dict):
            data_copy = dict(data)
            if "textColor" in data_copy:
                if "questionColor" not in data_copy:
                    data_copy["questionColor"] = data_copy["textColor"]
                del data_copy["textColor"]
            return data_copy
        return data

    preset: Literal["classic", "midnight", "sunset", "forest", "custom"] = "classic"
    backgroundColor: str = "#FFFFFF"
    backgroundImageUrl: Optional[str] = None
    backgroundOverlay: float = Field(default=0.0, ge=0.0, le=0.8)
    questionColor: str = "#191919"
    answerColor: str = "#0445AF"
    buttonColor: str = "#0445AF"
    buttonTextColor: str = "#FFFFFF"
    fontFamily: Literal[
        "Inter",
        "Roboto",
        "Outfit",
        "Playfair Display",
        "Poppins",
        "Space Grotesk",
    ] = "Inter"
    fontScale: Literal["small", "medium", "large"] = "medium"
    buttonRadius: Literal["square", "rounded", "pill"] = "rounded"

    @field_validator(
        "backgroundColor",
        "questionColor",
        "answerColor",
        "buttonColor",
        "buttonTextColor",
    )
    @classmethod
    def validate_hex(cls, v: str) -> str:
        if not isinstance(v, str) or not HEX_REGEX.match(v.strip()):
            raise ValueError(f"Invalid hex color format: '{v}'. Must be #RGB or #RRGGBB.")
        return v.strip()

    @field_validator("backgroundImageUrl")
    @classmethod
    def validate_image_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v_str = str(v).strip()
        if not v_str:
            return None
        if not (
            v_str.startswith("http://")
            or v_str.startswith("https://")
            or v_str.startswith("data:image/")
            or v_str.startswith("/")
        ):
            raise ValueError(
                f"Invalid image URL: '{v}'. Must start with http://, https://, data:image/, or /."
            )
        return v_str
