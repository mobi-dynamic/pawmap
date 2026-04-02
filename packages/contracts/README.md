# PawMap shared contracts

This directory is the MVP source of truth for shared app-level contracts.

Scope for PR #6:
- shared enum decisions
- example payloads used by docs/reviews
- explicit separation between API canonical IDs and web slugs

Rules:
- API uses canonical `placeId` values (for example `plc_123`)
- Web routes may use SEO-friendly `slug` values, but that is a frontend URL concern, not the API identity model
- Docs, frontend mocks, and backend enums must match the values defined here

## Shared enums

### `dogPolicyStatus`
- `allowed`
- `restricted`
- `not_allowed`
- `unknown`

### `verificationSourceType`
- `official_website`
- `direct_contact`
- `user_report`
- `onsite_signage`
- `third_party_listing`
- `other`

### `policyTrustLevel`
- `verified`
- `inferred`
- `needs_verification`

Derived UI trust qualifier for dog-policy messaging:
- `verified` = backed by a concrete source such as official website, signage, direct contact, third-party listing, or an approved user report
- `inferred` = heuristic / fallback inference only; should not be presented like confirmed policy
- `needs_verification` = no strong provenance yet

### `reportStatus`
- `pending`
- `approved`
- `rejected`

## MVP auth stance

- Public read endpoints are unauthenticated
- `POST /reports` requires an authenticated user identity
- Admin moderation endpoints require `admin` or `moderator` role
- Full end-user account features (for example favorites) remain out of MVP
