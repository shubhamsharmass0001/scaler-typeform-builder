"""
dependencies.py — FastAPI dependency injection providers

Provides:
  - get_db: Database session management
  - get_current_user: Resolves the active user (default seeded creator id=1)
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User


def get_current_user(db: Session = Depends(get_db)) -> User:
    """
    Returns the active creator user.
    Since authentication is out of scope, this resolves the default seeded creator (id=1).
    Ensures every query is strictly scoped to the creator.
    """
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        # If seed hasn't run yet, auto-create the default creator
        user = User(id=1, name="Shubham", email="sshubham3_be23@thapar.edu")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
