# Typeform Clone — Monorepo

A full-stack Typeform-inspired form builder for a full-stack assignment.

---

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

API docs available at: http://localhost:8000/docs  
Health check: http://localhost:8000/api/health

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App available at: http://localhost:3000

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | Next.js 14 (App Router), TypeScript, Tailwind   |
| Backend   | Python FastAPI, SQLAlchemy 2.0, Pydantic v2     |
| Database  | SQLite (via SQLAlchemy)                         |
| DnD       | @dnd-kit/core, @dnd-kit/sortable                |
| Animation | framer-motion                                   |
| Toasts    | sonner                                          |
| Fetching  | @tanstack/react-query                           |
| Icons     | lucide-react                                    |

---

## Architecture

```
Scaler/
├── frontend/                  # Next.js App Router
│   └── src/
│       ├── app/               # Pages and layouts
│       ├── components/        # Reusable UI components
│       ├── hooks/             # Custom React hooks
│       ├── lib/               # API client, utilities
│       └── types/             # TypeScript type definitions
│
└── backend/                   # FastAPI application
    └── app/
        ├── main.py            # App entry point, CORS, router registration
        ├── database.py        # Engine, SessionLocal, Base, get_db
        ├── models/            # SQLAlchemy ORM models
        ├── schemas/           # Pydantic v2 request/response schemas
        ├── routers/           # FastAPI route handlers (thin layer)
        ├── services/          # Business logic (called by routers)
        ├── validators/        # Answer validation logic per question type
        └── seed.py            # Seeds default creator (id=1)
```

---

## Database Schema

```mermaid
erDiagram
    users ||--o{ forms : "creates"
    forms ||--o{ questions : "contains"
    forms ||--o{ responses : "receives"
    responses ||--o{ answers : "has"
    questions ||--o{ answers : "answered_by"

    users {
        int id PK
        string name
        string email UK "unique, indexed"
        datetime created_at
    }

    forms {
        int id PK
        int user_id FK "indexed"
        string title
        text description "nullable"
        string status "draft | published"
        string slug UK "unique, indexed, nullable"
        json theme "backgroundColor, textColor, buttonColor, fontFamily"
        string welcome_title
        text welcome_description
        string welcome_button_text
        string thank_you_title
        text thank_you_message
        datetime created_at
        datetime updated_at
    }

    questions {
        int id PK
        int form_id FK "indexed"
        string type "short_text | long_text | multiple_choice | dropdown | email | number | yes_no | rating"
        string title
        text description "nullable"
        boolean required "default false"
        int position "indexed with form_id"
        json properties "options, allowOther, min, max, steps, shape"
        datetime created_at
        datetime updated_at
    }

    responses {
        int id PK
        int form_id FK "indexed"
        datetime started_at
        datetime submitted_at "nullable"
        boolean is_complete "default false"
        int last_question_id "nullable (drop-off tracking)"
    }

    answers {
        int id PK
        int response_id FK "indexed, unique with question_id"
        int question_id FK "indexed, unique with response_id"
        json value "arbitrary structured JSON"
        datetime created_at
    }
```

### Design Decisions

- **JSON properties vs per-type tables**: Rather than maintaining 8 distinct tables or relying on polymorphic table inheritance, type-specific configuration (choices for multiple-choice/dropdown, range bounds for ratings/numbers, and placeholders) is stored in a JSON `properties` column. This keeps the schema flat, eliminates multi-table joins when retrieving forms, and allows adding new question types without running database schema migrations.
- **Position-based ordering**: Questions are sequenced using an integer `position` column supported by an index on `(form_id, position)`. A database-level unique constraint on `(form_id, position)` is intentionally omitted because reordering operations (e.g. moving question 5 to position 2) produce transient index collisions that fail mid-operation. The non-unique index ensures high-speed sorting (`ORDER BY position ASC`) while permitting atomic batch reordering.
- **Separate responses and answers tables**: Form submissions are modeled into parent `responses` records and child `answers` records. The `responses` table captures session lifecycle and drop-off analytics (`started_at`, `submitted_at`, `is_complete`, and `last_question_id`), while the `answers` table stores question-specific values. A database unique constraint on `(response_id, question_id)` guarantees one answer per question per session, facilitating both partial-session tracking and per-question metric aggregations.
- **Cascade deletes**: Cascades are enforced concurrently at the database engine level (`ON DELETE CASCADE` foreign keys activated via SQLite `PRAGMA foreign_keys=ON`) and the ORM level (`cascade="all, delete-orphan"` on SQLAlchemy relationships). Deleting a form seamlessly cleans up all dependent questions, responses, and answers without creating orphan rows.

---

## API Overview

### Creator Endpoints (`/api/forms`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/forms` | List all forms with status, question_count, response_count, updated_at |
| POST | `/api/forms` | Create a form (default title, theme, auto-created starter question) |
| GET | `/api/forms/{id}` | Get form with ordered questions |
| PATCH | `/api/forms/{id}` | Partial update (title, theme, welcome/thank-you screens) |
| DELETE | `/api/forms/{id}` | Delete form (cascades to questions, responses, answers) |
| POST | `/api/forms/{id}/duplicate` | Deep copy form + questions (draft status, no responses) |
| POST | `/api/forms/{id}/publish` | Publish form & generate unique 8-character slug |
| POST | `/api/forms/{id}/unpublish` | Revert published form to draft status |
| PUT | `/api/forms/{id}/questions` | Bulk save & reorder questions atomically |
| GET | `/api/forms/{id}/responses` | Paginated response submissions (newest first) |
| GET | `/api/forms/{id}/responses/{rid}` | Single response with answers joined to question titles |
| DELETE | `/api/forms/{id}/responses/{rid}` | Delete individual response session |
| GET | `/api/forms/{id}/summary` | Aggregate analytics (rates, drop-offs, per-type metrics) |
| GET | `/api/forms/{id}/export.csv` | Export all responses as CSV file download |
| GET | `/api/forms/{id}/uploads/{upload_id}` | Download uploaded file (creator only) |

### Public & Health Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness check |
| GET | `/api/public/forms/{slug}` | Fetch published form metadata and questions (respondent view) |
| POST | `/api/public/forms/{slug}/upload` | Upload file attachment (multipart/form-data) |
| POST | `/api/public/forms/{slug}/start` | Start response session (returns response_id) |
| POST | `/api/public/forms/{slug}/submit` | Submit answers with server-side validation (returns 422 errors per question on failure) |
| PATCH | `/api/public/forms/{slug}/progress` | Record last_question_id for drop-off funnel analytics |

---

---

## Features Checklist

| Feature | Category | Status | Details |
|---|---|:---:|---|
| **Conditional Logic Jumps** | Bonus | ✅ Done | Typeform-style jumps (`equals`, `not_equals`, `contains`, `greater_than`, `less_than`, `is_answered`, `is_empty`, jump to end, logic default, cycle detection & backward jump prevention, dynamic path stack, non-regressive progress bar, builder visual jump arrows). |
| **Custom Themes** | Bonus | ✅ Done | Custom colors (background, question, answer, button, button text), Google Fonts (`Inter`, `Playfair Display`, `Outfit`, `JetBrains Mono` etc.), font scaling (`small`/`medium`/`large`), button corner radius (`sharp`/`rounded`/`pill`), background image presets & opacity/overlay. Isolated from creator dark mode. |
| **CSV Export** | Bonus | ✅ Done | Streaming CSV export with UTF-8 BOM, metadata headers, completion status filtering, dynamic question titles, formatted answers, and uploaded filenames. |
| **Partial-Response Tracking** | Bonus | ✅ Done | Session lifecycle tracking (`started_at`, `submitted_at`, `is_complete`, `last_question_id`), completion rate percentage, drop-off funnel analytics per question, and average completion duration. |
| **File Upload Question** | Bonus | ✅ Done | Secure multipart file upload with chunked streaming, MIME & extension validation, executable magic-byte inspection, filename sanitization, creator-only download stream, results drawer integration, and automatic cascade cleanup. |
| **Creator App Dark Mode** | Bonus | ✅ Done | Semantic CSS design tokens (`tokens.css`), light/dark/system mode toggle, anti-flash layout script, OS scheme change listener, complete dark styling across creator chrome while keeping public respondent forms strictly isolated. |

---

## Conditional Logic Specification

Logic rules are stored within a question's `properties` column:

```json
{
  "logic": [
    {
      "id": "rule_1712345678901",
      "match": "all",
      "conditions": [
        {
          "operator": "equals",
          "value": "opt_enterprise"
        }
      ],
      "action": {
        "type": "jump",
        "target_question_id": 105
      }
    },
    {
      "id": "rule_1712345678902",
      "match": "all",
      "conditions": [
        {
          "operator": "equals",
          "value": "opt_unqualified"
        }
      ],
      "action": {
        "type": "jump",
        "target_question_id": "end"
      }
    }
  ],
  "logicDefault": 103
}
```

### Fields & Rules
- **`match`**: `"all"` | `"any"` (currently single condition per rule; stored as list for extensible multi-criteria matching).
- **`conditions[].operator`**:
  - Choice / Dropdown / Yes-No: `equals`, `not_equals`, `is_answered`, `is_empty`
  - Multiple Choice: `contains`, `not_contains`, `is_answered`, `is_empty`
  - Number / Rating: `equals`, `not_equals`, `greater_than`, `less_than`, `is_answered`, `is_empty`
  - Text / Long Text / Email: `equals`, `contains`, `is_answered`, `is_empty`
  - File Upload: `is_answered`, `is_empty`
- **`action.target_question_id`**: Either a positive integer question ID or `"end"` (submits form immediately).
- **`logicDefault`**: Target question ID or `"end"` when no rules match (or `null` to advance to the next sequential question).
- **Validation Constraints**: Only forward jumps are permitted; self-jumps and backward jumps are prohibited to guarantee cycle-free execution.

---

## Custom Theme Schema

Themes are saved in `forms.theme` as structured JSON:

```json
{
  "backgroundColor": "#FFFFFF",
  "questionColor": "#191919",
  "answerColor": "#0284C7",
  "buttonColor": "#0284C7",
  "buttonTextColor": "#FFFFFF",
  "fontFamily": "Inter",
  "fontScale": "medium",
  "buttonRadius": "rounded",
  "backgroundImage": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=2000&q=80",
  "backgroundBrightness": 0.5
}
```

### Options & Enums
- **`fontFamily`**: `"System Default"`, `"Inter"`, `"Roboto"`, `"Playfair Display"`, `"Outfit"`, `"Space Grotesk"`, `"Plus Jakarta Sans"`, `"Poppins"`, `"Merriweather"`, `"JetBrains Mono"`.
- **`fontScale`**:
  - `"small"`: 0.9x sizing
  - `"medium"`: 1.0x sizing (standard)
  - `"large"`: 1.15x sizing
- **`buttonRadius`**:
  - `"sharp"`: `0px`
  - `"rounded"`: `8px`
  - `"pill"`: `9999px`
- **Theme Isolation**: Forms apply CSS variables (`--theme-bg`, `--theme-question`, `--theme-answer`, `--theme-btn-bg`, `--theme-font`, etc.) inside a scoped `[data-theme-isolated="true"]` boundary to prevent creator dark mode classes from altering respondent designs.

---

## File Upload Question & Storage Limitations

The `file_upload` question type allows respondents to upload attachments with enterprise-grade safety:

### Question Properties
```json
{
  "maxSizeMB": 5,
  "allowedTypes": ["image", "pdf", "doc"]
}
```
- **`maxSizeMB`**: 1 to 10 MB (defaults to 5 MB).
- **`allowedTypes`**: Array containing any combination of `"image"`, `"pdf"`, and `"doc"`.

### Security Protections
1. **Filename Sanitization**: Client-supplied filenames are stripped of directories (`os.path.basename`) and sanitized against path traversal (`../`) attacks. Files are written to disk using a unique UUID v4 filename.
2. **MIME & Extension Double-Check**: Both the HTTP `Content-Type` header and the file extension must match the allowed categories:
   - `image`: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml` (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`)
   - `pdf`: `application/pdf` (`.pdf`)
   - `doc`: `.doc`, `.docx`, `.txt`, `.csv`, `.xls`, `.xlsx`
3. **Magic-Byte Anti-Spoofing**: Inspects the initial bytes of incoming streams to reject spoofed executable payloads (such as Windows PE `MZ`, Linux ELF `\x7fELF`, and Mach-O).
4. **Draft Protection & Rate Limiting**: Uploads to unpublished forms return HTTP 403. Public uploads are throttled to 60 requests per minute per IP address.
5. **Access Control**: Public respondents can never download or browse stored files. File downloads (`GET /api/forms/{id}/uploads/{upload_id}`) strictly require creator authentication and form ownership verification.
6. **Cascade Cleanup**: When a response or form is deleted, physical files in `backend/uploads/` are purged immediately via SQLAlchemy event hooks.

> [!NOTE]
> **Ephemeral Disk Notice**: Free hosting platforms (such as Render, Railway, Fly.io, or Heroku free dynos) use ephemeral filesystem disks. Files stored in local directories like `backend/uploads/` are wiped upon container restarts or redeployments. For persistent multi-instance production environments, an S3-compatible object store (e.g., AWS S3, Cloudflare R2) should be configured.

---

## Assumptions

1. **No authentication** — A single default creator (id=1) is seeded at startup.
2. **SQLite** — Used for simplicity; swapping for PostgreSQL requires only changing `DATABASE_URL`.
3. **One question per screen** — Like Typeform, the respondent view shows one question at a time.
4. **Local File Storage** — Files are saved locally to disk under `backend/uploads/` with ephemeral hosting considerations noted above.
5. **Slug is auto-generated** from the form title using `python-slugify`.
