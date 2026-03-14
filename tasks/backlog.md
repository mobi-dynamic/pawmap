# Backlog

## Conventions

- Status: `todo`, `in-progress`, `blocked`, `review`, `done`
- Priority: `P0`, `P1`, `P2`

## Tasks

| ID | Title | Owner | Priority | Status | Notes |
|---|---|---|---|---|---|
| PM-001 | Project bootstrap: repo governance, docs, task logging, PR templates | Jarvis | P0 | review | Bootstrap docs and templates are in place; first PR still needs review/opening |
| PM-002 | Finalize MVP PRD | Sophie | P0 | review | Confirmed MVP decisions captured: reports auth-only, favorites cut, Google-only provider, cache miss gets dedicated error state |
| TL-001 | Finalize technical architecture and stack decisions | Atlas | P0 | review | Google Maps / Places selected; backend scaffold can proceed on FastAPI + Postgres baseline |
| UX-001 | Design search + map + place detail wireframes | Maya | P1 | review | UX spec added in `docs/ux-001-search-map-detail-spec.md`; includes provider/cache-miss error screen and Nova follow-ups |
| BE-001 | Define API contract and DB schema | Raven | P0 | done | Docs updated for confirmed product decisions; initial migration scaffolded in `apps/api/migrations` |
| BE-002 | Scaffold API foundation for search, place detail, reports, and moderation | Raven | P0 | review | FastAPI scaffold now exposes integration-ready search/detail payloads for frontend wiring, including realistic seeded places, explicit unknown-policy detail state, Google resolve/cache-miss contract, and docs/examples aligned to the actual `PlaceDetail` response shape |
| FE-001 | Scaffold web app shell | Nova | P1 | review | Search/results shell now follows UX-001, includes a web API adapter/repository layer with server-driven search + detail loading, slug/id route helpers, safe mock fallback while API wiring is incomplete, a minimal Vitest harness covering Google resolve redirect + cache-miss warning state, and a demo-readiness polish pass that removes dev-facing homepage/detail copy, trims landing-page state callouts, and makes result-card actions detail-first |
| OPS-001 | Set up CI, branch protections, deployment environments | Forge | P1 | review | GitHub Actions CI baseline added for API + web; branch protection/rulesets still need to be configured in GitHub |
| OPS-002 | Make local MVP stack runnable via Compose | Forge | P1 | review | Added `web + api + postgres` Compose flow, env examples, safe repeatable API bootstrap, API healthcheck/readiness gating for web startup, and fixed API UUID place slug parsing in web detail routes |
