# BE-004 Google ingestion and canonical upsert

- Status: review
- Priority: P0
- Owner: Raven
- Created: 2026-03-15

## Objective

Add the first real backend ingestion slice for PawMap so launch-geography Google place payloads can be normalized and stored as canonical `places` + `place_provider_refs` rows without requiring live API credentials.

## Deliverables

- Deterministic normalization from Google place payloads into canonical upsert records
- Repository upsert path for `places` + `place_provider_refs` with placeholder unknown pet rules
- DB helper command for geography-scoped ingest from checked-in JSON files
- Sample Fitzroy-area seed payload and test coverage

## Progress log

- 2026-03-15: Added `app.google_ingestion` with payload normalization, category mapping, deterministic canonical UUID generation, and geography manifest helpers.
- 2026-03-15: Added repository-level `upsert_google_places(...)` support for both in-memory and PostgreSQL backends.
- 2026-03-15: Added `python -m app.db ingest-google <seed_file> --geography-slug <slug>` for geography-scoped seed ingestion.
- 2026-03-15: Added a checked-in sample input file at `apps/api/data/google/melbourne-fitzroy-sample.json`.
- 2026-03-15: Added tests covering deterministic normalization, in-memory canonical upsert behavior, and seed-file loading.

## Key decisions

- Keep this slice backend-only and geography-scoped; do not couple it to live Google API fetches yet.
- Preserve the existing read-only semantics of `GET /places/resolve/google/{googlePlaceId}`.
- Create placeholder `pet_rules` records with unknown policy state at ingest time so canonical places remain readable through existing detail/search joins.
- Use deterministic UUIDv5 IDs keyed by `google_places:{googlePlaceId}` so repeated ingests are stable across environments.

## Risks / follow-ups

- This slice assumes a curated JSON payload file exists; fetching metro-area Google results still needs a separate collection step.
- Placeholder pet rules use `verification_source_type=other` in Postgres purely to satisfy the current non-null schema; a future migration could relax that field for provider-only place creation.
- We still do not have bounding-box/radius-driven live ingestion or async hydration from search/detail traffic.
