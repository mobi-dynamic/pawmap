# BE-002 API foundation scaffold

- Status: review
- Priority: P0
- Owner: Raven
- Created: 2026-03-13

## Objective

Scaffold the first backend slice from the confirmed MVP contract and data model so frontend work can start against a concrete service shape.

## Deliverables

- `apps/api` FastAPI scaffold
- Initial SQL migration for core MVP tables
- Basic run instructions and local verification notes

## Progress log

- 2026-03-13: Created `apps/api` FastAPI project scaffold with typed request/response models.
- 2026-03-13: Added in-memory development repository to exercise search, place detail, report submission, and moderation flows without a live database.
- 2026-03-13: Added Google resolve endpoint with explicit cache-miss error contract.
- 2026-03-13: Added first SQL migration aligned to the MVP schema and confirmed product decisions.
- 2026-03-13: Verified Python syntax via `python3 -m compileall apps/api/app`.

## Key decisions

- Use FastAPI + Pydantic v2 on Python 3.12 as the backend baseline.
- Keep the runtime repository in-memory for this first slice while shipping SQL migrations in parallel.
- Simulate auth via request headers (`X-User-Id`, `X-Role`) until real auth wiring lands.
- Exclude favorites entirely from the scaffold.

## Risks / follow-ups

- Search is still seeded/in-memory; Google Places live integration and DB persistence are next.
- Header-based auth is only a temporary local-dev seam.
- Moderation writes are not yet transactional against PostgreSQL.
