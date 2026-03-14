# PawMap

PawMap is a web app for dog owners to search places on a map and quickly understand pet rules before they go.

## Product goal

Answer one question fast:

> Can I bring my dog there, and under what rules?

## MVP focus

- Search places by name or location with Google Maps / Google Places
- View a place on the map
- Show dog policy status: allowed, restricted, not allowed, unknown
- Show structured rules: indoor/outdoor, leash, size limits, notes
- Display verification source and last checked time
- Let authenticated users submit reports
- Moderate updates before publishing
- Show a dedicated error state when a Google place cannot be resolved from cache

## Working agreements

- All work must be logged under `tasks/`
- All changes go through pull requests
- Merge only after review is completed
- Keep scope tight for MVP

## Initial repo structure

- `apps/api` — FastAPI backend scaffold and SQL migrations
- `docs/` — PRD, architecture, API contract, data model, ADRs
- `tasks/` — task logs, backlog, release checklist
- `.github/` — PR and issue templates

## Key planning docs

- `docs/prd.md` — MVP product scope
- `docs/architecture.md` — system shape and near-term roadmap
- `docs/api-contract.md` — initial HTTP contract for MVP endpoints
- `docs/data-model.md` — canonical relational schema baseline
- `docs/adr-001-repo-and-workflow.md` — repo/process decisions

## Planned stack

- Frontend: Next.js + TypeScript + Tailwind
- Backend: FastAPI
- Database: PostgreSQL
- Maps/places: Google Maps Platform / Google Places
- Hosting: Vercel + Railway/Render + managed Postgres

## API quick start

### In-memory mode

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload
```

Then open <http://127.0.0.1:8000/docs>.

### PostgreSQL-backed local dev

Run the API against a local Postgres instance:

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
export DATABASE_URL='postgresql://postgres:postgres@localhost:5432/pawmap'
python -m app.db bootstrap
uvicorn app.main:app --reload
```

`python -m app.db bootstrap` applies SQL migrations and seeds one stable sample place so the API works immediately on a fresh database.

## Status

Project bootstrap complete enough to start the first backend slice.
