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
| UX-001 | Design search + map + place detail wireframes | Maya | P1 | todo | Include provider/cache-miss error screen in core flow |
| BE-001 | Define API contract and DB schema | Raven | P0 | done | Docs updated for confirmed product decisions; initial migration scaffolded in `apps/api/migrations` |
| BE-002 | Scaffold API foundation for search, place detail, reports, and moderation | Raven | P0 | review | Minimal FastAPI app added with in-memory dev repository and Google resolve/cache-miss contract |
| FE-001 | Scaffold web app shell | Nova | P1 | todo | Depends on confirmed API/domain baseline and error-state requirements |
| OPS-001 | Set up CI, branch protections, deployment environments | Forge | P1 | todo | After initial scaffold |
