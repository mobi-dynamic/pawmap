# FE-003 — admin moderation UI and review actions

## Date
- 2026-03-15

## Summary
- Added an admin moderation page at `/admin/moderation` for reviewing submitted reports.
- Added typed repository functions for listing reports and submitting approve/reject actions.
- Wired local-dev admin identity through env-backed headers without inventing a full auth layer.
- Added server route handlers for approve/reject so the browser can update state cleanly with normalized error handling.
- Surfaced place context, proposed changes, evidence/comments, and review status in the moderation UI.

## Files touched
- `apps/web/.env.local.example`
- `apps/web/app/layout.tsx`
- `apps/web/app/admin/moderation/page.tsx`
- `apps/web/app/api/admin/reports/[reportId]/approve/route.ts`
- `apps/web/app/api/admin/reports/[reportId]/reject/route.ts`
- `apps/web/components/admin-moderation-shell.tsx`
- `apps/web/lib/api/client.ts`
- `apps/web/lib/admin-moderation-repository.ts`
- `apps/web/lib/admin-moderation-repository.test.ts`
- `apps/web/lib/types.ts`

## Verification
- `npm run build` ✅
- `npm run typecheck` ✅
- `npm test` ✅

## Notes
- The moderation page depends on `PAWMAP_API_BASE_URL`; if the backend is unavailable, the page shows an explicit warning state rather than mock data.
- Report rows currently enrich themselves with place-detail lookups, which is acceptable for MVP queue sizes but should eventually move into a dedicated admin summary response.
- This task also confirmed a repo-level tooling issue: sub-agents need the same shared workspace as the main session when they are expected to modify the same repo.

## Suggested next step
- Open and review the FE-003 PR, then either connect a real admin auth path or tighten the local-dev moderation headers before broader testing.
