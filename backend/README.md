# Butane Backend

Production-ready Django + Django REST Framework backend for the Butane exam /
assessment platform.

## Stack

- **Django 6** — web framework
- **Django REST Framework** — JSON API
- **PostgreSQL** — primary datastore (psycopg2)
- **Simple JWT** — stateless authentication (access + refresh tokens)
- **drf-spectacular** — OpenAPI 3 schema + Swagger/Redoc UI
- **django-filter** — declarative filtering on list endpoints
- **django-cors-headers** — CORS for the Next.js frontend
- **Pillow** — avatar / media handling

## Architecture

The project is split into small, reusable Django apps rather than one monolithic
`api` app:

```
backend/
├── manage.py
├── requirements.txt
├── .env.example            # copy to .env for local dev
├── core/                   # project package (settings, urls, shared infra)
│   ├── settings.py         # env-driven, prod + dev safe
│   ├── urls.py             # versioned /api/ routes + Swagger
│   ├── dj_env.py           # tiny env var reader
│   ├── models.py           # abstract bases: UUID, timestamps, soft delete
│   ├── pagination.py       # StandardPagination
│   ├── exceptions.py       # consistent error envelope
│   ├── logging_utils.py    # JSON log formatter
│   └── logs/               # rotating log files (gitignored)
├── accounts/               # auth, users, teacher/student profiles
│   ├── models.py           # User, Teacher, Student
│   ├── permissions.py     # role-based permission classes
│   ├── serializers.py
│   ├── views.py            # JWT login, /me, listings
│   └── urls.py
└── exams/                  # the exam domain
    ├── models.py           # Exam, Question, Choice, Attempt, AttemptAnswer, Result
    ├── serializers.py
    ├── filters.py
    ├── views.py            # viewsets + submit/grade action
    └── urls.py
```

## Configuration

All environment-specific values and secrets come from environment variables
(see `.env.example`). Nothing secret is committed. In production the app refuses
to boot with the insecure default `DJANGO_SECRET_KEY` / `JWT_SECRET_KEY`.

- **UUID primary keys** — used everywhere to avoid leaking object counts/order.
- **Timestamps** — `created_at` / `updated_at` on every model.
- **Soft delete** — `Teacher`, `Student`, `Exam`, `Attempt`, `Result` use a
  `SoftDeleteModel` base so historical records (attempts, results) survive even
  when a profile or exam is removed.
- **Logging** — console + rotating JSON file; level via `DJANGO_LOG_LEVEL`.
- **CORS** — strict allow-list via `CORS_ALLOWED_ORIGINS`.
- **Media / static** — `MEDIA_ROOT` (`/media/`) and `STATIC_ROOT`
  (`/staticfiles/`) configured for served uploads and collected assets.
- **Security** — hardened headers, HSTS, secure cookies enabled when
  `DEBUG=false`.

## Database Design

### Entities & relationships

`User` (auth identity, email login, `role`)
→ `Teacher` (1:1) — profile for exam authors
→ `Student` (1:1) — profile for exam takers

`Teacher` 1 ── * `Exam` — *a teacher authors many exams*; `PROTECT` keeps the
author of record even if their profile is later edited.

`Exam` 1 ── * `Question` — *an exam is composed of many questions*; questions
carry their own `marks` so the exam total aggregates from parts. `order`
preserves authored sequence (shuffling happens at delivery, not in storage).

`Question` 1 ── * `Choice` — *each question has multiple selectable options*; a
boolean `is_correct` marks the right answer(s). Normalizing choices as rows (not
JSON) keeps data queryable and lets the client receive shuffled choices without
exposing the correct one.

`Exam` 1 ── * `Attempt` ← `Student` — *a student's single sitting for an exam*.
Linking both exam and student enables per-student and per-exam analytics and
enforces one attempt context per sitting. `PROTECT` preserves attempts even if
the exam is archived.

`Attempt` 1 ── * `AttemptAnswer` → `Question`, `Choice` — *the actual recorded
answers*. Stored per attempt (not on the question) so a historical, immutable
record survives later edits to the question. `selected_choice` may be null
(unanswered).

`Attempt` 1 ── 1 `Result` — *aggregated outcome* (score, percentage, pass/fail,
breakdown). Stored separately so dashboards/reporting read a single row without
re-aggregating answer rows each time; the detailed breakdown stays available via
the attempt's answers.

### Why these relationships

- **One-to-one User↔Profile** — separates auth/credentials from domain data so a
  profile can be soft-deleted or extended without touching login identity.
- **Teacher→Exam (FK, PROTECT)** — attribution that must not silently vanish.
- **Exam→Question→Choice (FK cascade)** — composition hierarchy; deleting an exam
  removes its questions and choices, but questions protect their exam.
- **Attempt→Student/Exam (FK, PROTECT)** — analytics + integrity; results remain
  meaningful after the exam or student is archived.
- **Attempt→AttemptAnswer→Choice (FK, PROTECT on choice)** — a graded attempt
  must keep referencing the exact choice picked, even if that choice is later
  edited or the question reused.
- **Attempt→Result (one-to-one)** — exactly one outcome per attempt, cheap to
  read for reporting.

## API

Base path: `/api/`

- `POST /api/accounts/auth/login/` — obtain JWT (email + password)
- `POST /api/accounts/auth/refresh/` — rotate refresh token
- `GET  /api/accounts/me/` — current user
- `GET  /api/accounts/teachers/`, `/api/accounts/students/`

### Exams (teacher-owned)

- `GET/POST/PUT/PATCH/DELETE /api/exams/` — exam CRUD (teachers see only their own)
- `POST /api/exams/{id}/publish/` — publish (status → ongoing, enables public link)
- `POST /api/exams/{id}/generate-public-token/` — create/rotate the signed public token + URL
- `POST /api/exams/{id}/revoke-public-token/` — disable public access
- `POST /api/exams/{id}/duplicate/` — deep-copy exam (new draft, questions + choices)
- `POST /api/exams/{id}/archive/` — archive (status → completed, public link off)

### Questions (nested under an exam)

- `GET/POST /api/exams/{exam_id}/questions/` — list / create
- `GET/PUT/PATCH/DELETE /api/exams/{exam_id}/questions/{id}/` — retrieve / update / delete
- `POST /api/exams/{exam_id}/questions/reorder/` — `{"question_ids": [...]}`
- `POST /api/exams/{exam_id}/questions/{id}/duplicate/` — duplicate a question
- `PATCH /api/exams/{exam_id}/questions/{id}/mark-correct/` — `{"choice_id"}` or `{"choice_ids": [...]}`

### Attempts & results

- `GET/POST /api/attempts/` — attempts; `POST /api/attempts/{id}/submit/` grades
- `GET  /api/results/` — aggregated results (read-only reporting)



### Automatic grading

On submission the attempt's answers are compared against the stored correct
choices and a ``Result`` is created with score, percentage, correct/incorrect/
unanswered counts, and pass/fail. Grading is idempotent. Result visibility
follows the exam settings:

- ``show_result=True`` → instant results returned to the student on submit.
- ``show_result=False`` → hidden results; only a submission confirmation is returned.
- ``allow_review=True`` → the per-question review (correct/incorrect, never the answer text) is included.

### Reporting (teacher-only)

- `GET /api/reports/exams/{exam_id}/` — exam statistics: average/highest/lowest score, pass rate, attempt counts, score distribution, per-question statistics, and top performers
- `GET /api/reports/exams/{exam_id}/questions/` — per-question correct-rate analytics
- `GET /api/reports/students/{student_id}/` — student attempt history + summary (average, highest, lowest, pass rate, rank)
- `GET /api/results/` — paginated, filterable, sortable results (filter by `exam`, `student`, `passed`, `min_percentage`, `max_percentage`, `graded_after/before`; search by student/exam; sort by `percentage`, `score`, `graded_at`)
- `POST /api/attempts/{id}/submit/` — grade an authenticated student attempt (instant/hidden per settings)


### Public student flow (unauthenticated, token-guarded)

Reached via the exam's ``public_token``; attempt mutations also require the
per-attempt ``access_token`` returned on start. Correct answers are never served.

- `GET  /api/public/exams/{token}/` — safe exam details (validates published / available / not expired)
- `POST /api/public/exams/{token}/start/` — create student if needed, create/resume attempt; returns `access_token`
- `GET  /api/public/attempts/{id}/?token=...` — resume: attempt + saved answers
- `POST /api/public/attempts/{id}/save/` — autosave answers + duration/metadata
- `POST /api/public/attempts/{id}/submit/` — grade, finalize, return result (review answers only if `allow_review`)


Docs:

- Swagger UI: `/api/docs/`
- Redoc: `/api/redoc/`
- Schema: `/api/schema/`

## Local development

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # PostgreSQL connection details
createdb butane                 # or adjust DB_* in .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

> The project targets PostgreSQL. For a quick local check without a running
> Postgres server you can temporarily point `DATABASES` at sqlite, but
> PostgreSQL is the supported production database.
