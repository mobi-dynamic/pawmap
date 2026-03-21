# FE-004 — authenticated report submission UI on place detail

## Date
- 2026-03-20

## Summary
- Added a user-facing report submission form to the place detail page.
- Reused the web API client patterns with a typed report submission repository.
- Added a Next route handler so browser submissions flow through normalized validation/error handling and server-side dev auth headers.
- Wired local-dev user identity via `PAWMAP_DEV_USER_ID` instead of inventing a full auth product flow.
- Added focused repository coverage for payload sanitizing and authenticated submission wiring.

## Files touched
- `apps/web/.env.local.example`
- `apps/web/app/api/reports/route.ts`
- `apps/web/app/place/[placeSlug]/page.tsx`
- `apps/web/components/report-submission-form.tsx`
- `apps/web/lib/api/client.ts`
- `apps/web/lib/report-submission-repository.test.ts`
- `apps/web/lib/report-submission-repository.ts`
- `apps/web/lib/types.ts`
- `tasks/backlog.md`

## Verification
- `npm test`
- `npm run typecheck`
- `npm run build`

## Notes
- The form intentionally keeps all report fields optional except `placeId`, matching the backend contract while validating that at least one meaningful change/comment/evidence field is present.
- Browser requests post to `/api/reports`; the server route attaches the local dev user header and normalizes obvious validation failures before forwarding to the API.
- This is still an MVP seam. Real user auth/session wiring should replace `PAWMAP_DEV_USER_ID` before production exposure.
