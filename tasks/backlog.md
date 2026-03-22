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
| FE-001 | Scaffold web app shell | Nova | P2 | in-progress | Web is now a secondary internal/admin/demo surface; keep it useful for QA, moderation, and fallback rather than flagship user polish |
| FE-003 | Add admin moderation UI and review actions | Nova | P1 | done | Added `/admin/moderation`, typed admin moderation repository functions, approve/reject route handlers, env-backed local admin headers, and repository coverage |
| FE-004 | Add authenticated report submission UI on place detail | Nova | P1 | done | Added place-detail user report form, typed submission repository + route, env-backed local dev user header forwarding, and verification coverage |
| TL-002 | Update architecture and repo conventions for mobile-first delivery | Atlas | P0 | done | Mobile-first direction is adopted: React Native + Expo becomes the primary client, backend remains shared, and web is downgraded to internal/admin/demo/fallback |
| FE-MOB-001 | Scaffold Expo app and shared API client path | Nova | P0 | in-progress | Stand up `apps/mobile` as the new primary product surface with environment/config wiring to the existing API contract |
| FE-MOB-002 | Deliver mobile search + nearby + place detail vertical slice | Nova | P0 | todo | First mobile user slice should prove search, map/nearby discovery, and place detail against the existing FastAPI backend |
| FE-MOB-003 | Deliver mobile report submission flow | Nova | P1 | todo | Reuse the existing report contract and authenticated flow from the backend in the mobile client |
| BE-006 | Harden API ergonomics for mobile search/nearby/detail flows | Raven | P0 | todo | Tighten payloads, error semantics, and mobile-oriented API assumptions without changing the shared backend architecture |
| FE-WEB-005 | Re-scope web app to admin/demo/fallback only | Nova | P1 | todo | Remove flagship-web assumptions from future work; preserve admin, QA, and demo value |
| OPS-001 | Set up CI, branch protections, deployment environments | Forge | P1 | in-progress | GitHub Actions CI baseline is merged; remaining GitHub-side branch protection/ruleset configuration still needs to be applied in settings |
| OPS-003 | Switch deployment baseline to Netlify + Render + Neon | Forge | P1 | done | Vercel-first assumption removed from docs; deployment baseline and migration rationale are now merged |
| OPS-002 | Make local MVP stack runnable via Compose | Forge | P1 | done | Added `web + api + postgres` Compose flow, env examples, safe repeatable API bootstrap, API healthcheck/readiness gating for web startup, and fixed API UUID place slug parsing in web detail routes |
