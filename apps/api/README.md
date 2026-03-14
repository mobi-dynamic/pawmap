# PawMap API

Minimal FastAPI scaffold for the PawMap MVP.

## What is included

- Public read endpoints for search, nearby, place detail, and pet rules
- Auth-only report submission
- Admin moderation endpoints
- Google place resolve endpoint with explicit cache-miss handling
- First PostgreSQL migration under `migrations/0001_init.sql`
- Tiny DB helper CLI for migrate/seed/bootstrap flows: `python -m app.db ...`
- Repository abstraction with PostgreSQL-backed persistence when `DATABASE_URL` is set
- In-memory fallback repository for local scaffold work and fast smoke tests

## Run locally

### Full local stack with Docker Compose

From the repo root:

```bash
cp .env.example .env
docker compose up --build
```

Then open:

- Web: <http://127.0.0.1:3000>
- API docs: <http://127.0.0.1:8000/docs>

The API container runs `python -m app.db bootstrap` on startup, and migrations are tracked in `schema_migrations` so repeated starts stay safe.

### In-memory fallback

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload
```

Open <http://127.0.0.1:8000/docs>.

### PostgreSQL-backed local dev

Point the API at a local Postgres instance before starting the app:

```bash
export DATABASE_URL='postgresql://postgres:postgres@localhost:5432/pawmap'
python -m app.db bootstrap
uvicorn app.main:app --reload
```

The bootstrap helper keeps local setup intentionally small:

- `python -m app.db migrate` applies every SQL file in `migrations/`
- `python -m app.db seed` inserts one stable local-dev place
- `python -m app.db bootstrap --skip-seed` is useful when you want schema only

Seeded local-dev identifiers:

- `placeId`: `11111111-1111-1111-1111-111111111111`
- `googlePlaceId`: `ChIJ-puppy-cafe`

Example if you need to create the database first:

```bash
createdb pawmap
python -m app.db bootstrap
```

## Dev auth headers

Temporary local-dev headers until real auth is integrated:

- `X-User-Id`: required for `POST /reports` and must be a UUID string
- `X-Role`: set to `admin` or `moderator` for admin endpoints

## Example requests

```bash
curl -s http://127.0.0.1:8000/health | jq .

curl -s "http://127.0.0.1:8000/places/search?q=puppy" | jq .

curl -s -X POST http://127.0.0.1:8000/reports \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: 6d2d3fba-8f38-4b18-bd43-5a1d85fce112' \
  -d '{
    "placeId": "11111111-1111-1111-1111-111111111111",
    "proposedDogPolicyStatus": "allowed",
    "proposedIndoorAllowed": true,
    "reporterComment": "Staff confirmed dogs are allowed inside today."
  }' | jq .

pytest
```
