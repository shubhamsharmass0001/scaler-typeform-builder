"""
database.py — Database setup using SQLAlchemy 2.0

Responsibilities:
  - Create the SQLite engine
  - Enable SQLite foreign key enforcement via PRAGMA foreign_keys=ON
  - Provide a session factory (SessionLocal)
  - Expose the declarative Base that all models inherit from
  - Provide the `get_db` dependency injected into FastAPI route handlers
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Read the database URL, defaulting to local SQLite typeform.db
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./typeform.db")

# `connect_args={"check_same_thread": False}` allows multi-threaded requests in FastAPI
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)


# SQLite does not enforce foreign keys by default.
# We attach an event listener to the engine's 'connect' event to run PRAGMA foreign_keys=ON.
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """
    Enable foreign key enforcement on each SQLite connection opened by SQLAlchemy.
    Without this, SQLite silently ignores FOREIGN KEY declarations and CASCADE deletes.
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# SessionLocal is a factory; each call produces a new database session.
SessionLocal = sessionmaker(
    autocommit=False,  # Explicit transaction commits
    autoflush=False,   # Explicit flush control
    bind=engine,
)


# All SQLAlchemy models inherit from this Base.
class Base(DeclarativeBase):
    pass


def get_db():
    """
    FastAPI dependency that yields a database session and guarantees cleanup.

    Usage in a route:
        def my_route(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db          # Hand the session to the route handler
    finally:
        db.close()        # Always close, even if an exception was raised
