# BE-005 Bounded Google collection adapter for launch geography seeding

- Status: review
- Priority: P0
- Owner: Raven
- Created: 2026-03-15

## Objective

Add the smallest reviewable Google collection slice for PawMap launch geography seeding: gather bounded metro-area Google place candidates, persist a reusable snapshot, and feed the existing BE-004 normalization + canonical upsert path without overbuilding a crawler or job system.

## Deliverables

- Launch geography collection plan for the initial Melbourne/Fitzroy slice
- Provider adapter boundary supporting either deterministic fixtures or live Google text-search calls
- `python -m app.db collect-google ...` command with optional immediate ingest
- Checked-in collection fixtures and tests covering dedupe + snapshot reuse

## Progress log

- 2026-03-15: Added `app.google_collection` with launch geography plans, bounded category queries, fixture collector mode, and live Google text-search adapter support.
- 2026-03-15: Added `collect-google` CLI flow in `app.db` to write reusable JSON snapshots and optionally pass them straight into BE-004 canonical ingest.
- 2026-03-15: Added checked-in Melbourne/Fitzroy collection fixtures under `apps/api/data/google/collection-fixtures/`.
- 2026-03-15: Added tests covering fixture-driven collection, cross-query dedupe, and snapshot reuse through the existing ingestion loader.
- 2026-04-03: Solved the Kingston 403 blocker for web source ingestion by adding a cached-page fallback in `app.web_source_ingestion` and checking in a Kingston snapshot so the verified dog-ownership source can still be ingested when the live site blocks `urllib`.
- 2026-04-05: Switched web source ingestion to cache-first loading, so the checked-in Kingston snapshot is reused instead of re-fetching live HTML on startup; PDF URLs are now recognized as a distinct source type.

## Key decisions

- Keep collection bounded to launch geography + a few priority query buckets (`cafe`, `restaurant`, `park`) rather than building generalized crawling infra.
- Reuse the BE-004 output contract (`places` array inside a JSON snapshot) so collected files can flow directly into the canonical ingest command.
- Support reviewable/local development through fixture mode first; live Google calls remain optional behind environment variables.
- Keep `GET /places/resolve/google/{googlePlaceId}` read-only; collection remains an explicit operator/developer action.

## Risks / follow-ups

- Live Google collection currently uses a direct text-search adapter only; paging/richer query strategies can come later if launch coverage needs more breadth.
- We still need an operator decision on the exact launch metro definition and seed run cadence.
- A later slice can add cron/admin automation around `collect-google --ingest` once secrets and operational expectations are settled.
