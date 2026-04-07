# PawMap

PawMap is a mobile-first app for dog owners to search places quickly and understand pet rules before they go.

The repo now uses **Expo Web** for the browser surface and **Vercel** for web hosting when needed. The main product remains mobile.

## Product goal

Answer one question fast:

> Can I bring my dog there, and under what rules?

## MVP focus

- Search places by name or location with Google Places
- View a place detail screen on mobile
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

## Repo structure

- `apps/api` — FastAPI backend scaffold and SQL migrations
- `apps/mobile` — Expo + React Native mobile app shell
- `packages/contracts` — shared enums and example payloads; source of truth for contract decisions
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

- Mobile frontend: Expo + React Native
- Web surface: Expo Web on Vercel
- Backend: FastAPI
- Database: PostgreSQL
- Maps/places: Google Maps Platform / Google Places
- Mobile distribution: Expo/EAS once the shell is stable

## Local development

### API

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload
```

Then open <http://127.0.0.1:8000/docs>.

### API against local Postgres

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

### Mobile

```bash
cd apps/mobile
cp .env.example .env
npm install
npm run dev
```

See `apps/mobile/README.md` for details.

### Web preview

```bash
cd apps/mobile
npm run web
```

For Vercel, use the `apps/mobile` project with `build:web` and `dist` as the output directory.

## CI baseline

GitHub Actions now runs a minimal monorepo CI baseline on pull requests and pushes to `main`:

- `apps/api`: install dev dependencies and run `pytest -q`
- `apps/mobile`: run `npm install` and `npm run typecheck`

This baseline intentionally skips lint as a required gate for now because linting is not consistently configured across the repo yet. Branch protection / required-status rules still need to be configured in GitHub settings.

## Status

Project bootstrap complete enough to continue the API + mobile MVP.
