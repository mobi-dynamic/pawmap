# UX-001 — search, map, and place detail design

## Date
- 2026-03-14

## Summary
- Reviewed the current `apps/web` MVP shell against the PRD, architecture, and API contract.
- Produced a wireframe-level UX spec for the public read flow covering:
  - search entry and search results flow
  - map/list interaction model
  - place detail information hierarchy
  - unknown state
  - loading state
  - provider/cache-miss error state
  - trust and verification cues
- Added concrete implementation follow-ups for Nova so FE work can proceed without guessing.

## Deliverable
- `docs/ux-001-search-map-detail-spec.md`

## Key design decisions
- Search should be task-first, not hero/marketing-first.
- The list is the primary decision surface; the map is supporting context.
- Unknown and cache-miss must remain distinct states.
- Trust metadata belongs near the verdict, not buried below the fold.
- Confidence score should remain secondary to source type and last checked date.

## Suggested next step
- Nova should convert the current shell into the spec’d search/results layout using mock data first, then wire it to API-backed view models.
