"""
main.py — FastAPI application entry point

Responsibilities:
  - Create the FastAPI app instance
  - Configure CORS (Cross-Origin Resource Sharing) so the Next.js frontend
    can call the API from a different port (3000 → 8000)
  - Register all routers with their URL prefixes
  - Add the /api/health endpoint
  - Create all database tables on startup
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.database import engine, Base
import app.models  # noqa: F401 - Register all SQLAlchemy models with Base.metadata
from app.routers import forms, questions, responses, public
from app.services.public_service import FormSubmissionValidationError

# Load .env before reading any environment variables
load_dotenv()

# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Typeform Clone API",
    description="A full-stack Typeform-inspired form builder.",
    version="0.1.0",
)


@app.exception_handler(FormSubmissionValidationError)
async def form_submission_validation_exception_handler(
    request: Request,
    exc: FormSubmissionValidationError,
):
    """
    Format submission validation errors into exact {"errors": {"<qid>": "message"}} JSON.
    """
    return JSONResponse(
        status_code=422,
        content={"errors": exc.errors},
    )

# ---------------------------------------------------------------------------
# Database table creation & initial seed
# ---------------------------------------------------------------------------
# Create all tables defined in our models on startup.
Base.metadata.create_all(bind=engine)

# Automatically seed demo user and forms if database is empty
from app.seed import seed_db_if_empty
seed_db_if_empty()

# ---------------------------------------------------------------------------
# CORS middleware
# ---------------------------------------------------------------------------
# Read the allowed frontend origin from the environment.
# Default to localhost:3000 for local development.
FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
ALLOWED_ORIGINS: list[str] = [
   o.strip().rstrip("/") for o in FRONTEND_ORIGIN.split(",") if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    # allow_origins lists the exact URLs that browsers are permitted to call from.
    allow_origins=ALLOWED_ORIGINS,
    # Allow cookies / Authorization headers to be forwarded.
    allow_credentials=True,
    # Which HTTP methods are allowed (GET, POST, PUT, DELETE, OPTIONS, PATCH)
    allow_methods=["*"],
    # Which request headers the browser may send
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
# Each router handles one resource area (forms, questions, etc.).
# The `prefix` is prepended to every route defined inside that router.

app.include_router(forms.router,     prefix="/api/forms",     tags=["Forms"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(responses.router, prefix="/api/responses", tags=["Responses"])
app.include_router(public.router,    prefix="/api/public",    tags=["Public"])

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/health", tags=["Health"])
def health_check():
    """
    Simple liveness probe.
    Returns 200 OK with a status message so you can verify the server is up.
    """
    return {"status": "ok", "message": "Typeform Clone API is running"}
