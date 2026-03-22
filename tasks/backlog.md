# Backlog

## Conventions

- Status: `todo`, `in-progress`, `blocked`, `review`, `done`
- Priority: `P0`, `P1`, `P2`

## Tasks

| ID | Title | Owner | Priority | Status | Notes |
|---|---|---|---|---|---|
| PM-001 | Project bootstrap: repo governance, docs, task logging, PR templates | Jarvis | P0 | done | Bootstrap docs/templates and GitHub-visible progress flow are now in place; tracking continues in repo issues/PRs |
| PM-002 | Finalize MVP PRD | Sophie | P0 | done | MVP decisions are locked: reports auth-only, favorites cut, Google-only provider, cache miss gets dedicated error state |
| TL-001 | Finalize technical architecture and stack decisions | Atlas | P0 | done | Google Maps / Places selected; FastAPI + Postgres baseline chosen and now reflected in merged repo work |
| UX-001 | Design search + map + place detail wireframes | Maya | P1 | done | UX spec landed in `docs/ux-001-search-map-detail-spec.md`; follow-on FE work shipped against it |
| BE-001 | Define API contract and DB schema | Raven | P0 | done | Docs updated for confirmed product decisions; initial migration scaffolded in `apps/api/migrations` |
| BE-002 | Scaffold API foundation for search, place detail, reports, and moderation | Raven | P0 | in-progress | Core API/search/detail/report/moderation foundations are merged; remaining work is hardening toward live Postgres and next backend slices |
| BE-004 | Add Google ingestion + canonical upsert path for geography seeding | Raven | P0 | done | Added deterministic Google normalization/upsert path, DB CLI ingest command, sample Fitzroy seed file, and tests |
| BE-005 | Add bounded Google collection adapter for launch geography seeding | Raven | P0 | done | Added launch-geo collection planning, fixture/live Google collector modes, `collect-google` CLI, reusable snapshot output, and tests that feed the BE-004 ingestion path |
| FE-001 | Scaffold web app shell | Nova | P1 | in-progress | Search/results shell, detail flow, API adapter/repository layer, and cache-miss/resolve handling are merged; remaining work is deeper API integration and polish |
| FE-003 | Add admin moderation UI and review actions | Nova | P1 | done | Added `/admin/moderation`, typed admin moderation repository functions, approve/reject route handlers, env-backed local admin headers, and repository coverage |
| FE-004 | Add authenticated report submission UI on place detail | Nova | P1 | done | Added place-detail user report form, typed submission repository + route, env-backed local dev user header forwarding, and verification coverage |
| OPS-001 | Set up CI, branch protections, deployment environments | Forge | P1 | in-progress | GitHub Actions CI baseline is merged; remaining GitHub-side branch protection/ruleset configuration still needs to be applied in settings |
| OPS-003 | Switch deployment baseline to Netlify + Render + Neon | Forge | P1 | done | Vercel-first assumption removed from docs; deployment baseline and migration rationale are now merged |
| OPS-002 | Make local MVP stack runnable via Compose | Forge | P1 | done | Added `web + api + postgres` Compose flow, env examples, safe repeatable API bootstrap, API healthcheck/readiness gating for web startup, and fixed API UUID place slug parsing in web detail routes |
