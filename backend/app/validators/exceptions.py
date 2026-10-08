"""
exceptions.py — Custom validation exception for form question validators
"""


class ValidationError(Exception):
    """
    Raised when an answer fails question validation rules.
    Carries a human-readable error message displayed to the respondent.
    """
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message
