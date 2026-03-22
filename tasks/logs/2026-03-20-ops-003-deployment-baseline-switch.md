# OPS-003 — switch deployment baseline away from Vercel

## Date
- 2026-03-20

## Summary
- Replaced the earlier Vercel-first deployment assumption with a free-tier baseline centered on Netlify + Render + Neon.
- Added a dedicated deployment guide for the new platform split.
- Updated repo docs so architecture and onboarding material reflect the current recommendation.

## Why
- Vercel was failing as a practical default for this repo due to private GitHub organization deployment limitations on the Hobby plan.
- PawMap is better served by a simple full-stack split: Netlify for Next.js, Render for FastAPI, Neon for Postgres.

## Files touched
- `README.md`
- `docs/architecture.md`
- `docs/deployment-netlify-render-neon.md`
- `tasks/backlog.md`

## Notes
- This task updates the documented deployment baseline only.
- It does not yet provision Netlify/Render/Neon projects.
- Follow-up verification on 2026-03-21 confirmed the failing PR status named `Vercel` is an external GitHub ↔ Vercel integration check, not a repo workflow or application-code failure.
- Repo-side docs were updated to make that blocker explicit and to point maintainers at the real fix path: disconnect/disable the Vercel integration for this repo or move it to a supported Vercel plan.

## Suggested next step
- Remove or disable the stale Vercel GitHub integration for this repo, then add Netlify and/or Render preview setup explicitly if preview deploys are still wanted.
