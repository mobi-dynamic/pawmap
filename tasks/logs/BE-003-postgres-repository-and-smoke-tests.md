# BE-003 Postgres repository and smoke tests

- Status: review
- Priority: P0
- Owner: Raven
- Created: 2026-03-13

## Objective

Move the API scaffold off a hard-wired in-memory repository by adding a practical PostgreSQL-backed persistence path for the current MVP flows, while putting smoke-test coverage around the highest-value backend behavior.

## Deliverables

- Repository abstraction with PostgreSQL-backed implementation for current core flows
- In-memory fallback retained for local scaffold/dev ergonomics
- Smoke tests for auth/report submission, moderation flow, and Google resolve cache-miss behavior

## Progress log

- 2026-03-13: Reworked the API to resolve repositories via FastAPI dependency injection instead of a global singleton.
- 2026-03-13: Added `PostgresRepository` covering search, nearby lookup, place detail, Google resolve, report creation, report listing, and moderation actions.
- 2026-03-13: Kept `InMemoryRepository` as a fallback when `DATABASE_URL` is not configured, so the app still runs without infra during local work.
- 2026-03-13: Added smoke tests for auth/report submission, moderation approval updating published place rules, and Google resolve cache hit/miss behavior.
- 2026-03-13: Updated API README with `DATABASE_URL` and test instructions.
- 2026-03-13: Added a tiny `python -m app.db` helper to apply SQL migrations and seed a stable local-dev sample place into Postgres.
- 2026-03-13: Updated repo/API docs so a fresh local Postgres instance can be bootstrapped without extra tooling.
- 2026-03-14: Tightened the temporary auth seam so `X-User-Id` must be a UUID, matching the PostgreSQL schema instead of only working in in-memory mode.
- 2026-03-14: Added a tiny typed config module so repository selection no longer reads environment variables ad hoc.

## Key decisions

- Use `DATABASE_URL` as the switch between scaffold mode and PostgreSQL persistence, now read through a tiny typed settings module instead of ad hoc environment access.
- Keep API-facing IDs opaque strings even though the initial SQL schema stores canonical IDs as UUIDs.
- Require authenticated header identities to be valid UUIDs so local scaffold behavior matches the current PostgreSQL schema.
- Make moderation approval transactional inside the repository so report state and published pet-rule updates move together.
- Test API behavior through FastAPI dependency overrides instead of requiring a live database in smoke tests.

## Risks / follow-ups

- Search currently uses simple `ILIKE`/distance SQL, not full-text or PostGIS.
- Local bootstrap intentionally seeds just one sample place. Real ingest and richer seed fixtures can come later without changing the bootstrap shape.
- `GET /places/search` now supports canonical-place location bias, but it still only searches already-cached PawMap places rather than live provider hits.
