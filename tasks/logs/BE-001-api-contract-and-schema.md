# BE-001 API contract and DB schema baseline

- Status: done
- Priority: P0
- Owner: Raven
- Created: 2026-03-13

## Objective

Turn the architecture outline into an implementation-ready API and data-model baseline for the first backend/frontend scaffold PRs.

## Deliverables

- MVP API contract document
- MVP relational data model document
- Backlog updates to reflect progress and dependencies more clearly

## Progress log

- 2026-03-13: Reviewed existing bootstrap docs and task logs.
- 2026-03-13: Added `docs/api-contract.md` covering public, write, and moderation endpoints.
- 2026-03-13: Added `docs/data-model.md` with canonical place model, provider refs, published pet rules, reports, and favorites.
- 2026-03-13: User confirmed MVP decisions: reports auth-only, favorites removed, Google standardized, cache miss should be explicit.
- 2026-03-13: Updated architecture/PRD/API/data model docs to encode the confirmed decisions and removed favorites from MVP.
- 2026-03-13: Closed open questions about report auth and provider family for the initial scaffold.

## Key decisions

- Use internal canonical `place_id` instead of provider IDs in public API.
- Keep published rule truth in `pet_rules` and proposed changes in `user_reports`.
- Treat moderation as an explicit workflow, not an overloaded report status field only.
- Standardize provider references on `google_places` for MVP.
- Require authentication for report submission.
- Remove favorites from MVP.
- Represent unresolved Google provider references as a dedicated cache-miss API error so the web client can render an error screen.

## Follow-ups

- Implement the first API scaffold from the updated contract.
- Decide whether search should hide uncached Google hits or trigger hydration in a later slice.
