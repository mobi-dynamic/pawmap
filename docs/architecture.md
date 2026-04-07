# PawMap Architecture

## 1. MVP architecture decision

PawMap should ship as a **mobile-first modular monolith in a monorepo**:

- `apps/mobile` — React Native + Expo (primary user product)
- `apps/api` — FastAPI
- `packages/contracts` — shared API contracts and example payloads
- PostgreSQL — application data and cached place snapshots

Optimize for **speed to first usable mobile MVP**, not flexibility for hypothetical scale.

## 2. Recommended stack

- Primary frontend: React Native + Expo
- Backend API: FastAPI
- Database: PostgreSQL
- Geospatial: plain lat/lng first; add PostGIS only if nearby/map queries become limiting
- Auth: keep full end-user account flows out of MVP, but require authenticated identity for `POST /reports`
- Hosting:
  - Render for `apps/api`
  - Expo/EAS for mobile distribution once the shell is stable
- Place provider: Google Places for MVP, wrapped behind an API provider adapter

## 3. System overview

```text
[React Native + Expo Mobile App]
             |
             v
         [FastAPI API]
   |-- Place provider adapter (Google Places)
   |-- Place normalization and cache
   |-- Dog rules service
   |-- Report submission and moderation
   |
   v
[PostgreSQL]
   |-- places
   |-- pet_rules
   |-- user_reports
   |-- admin_users (optional/minimal)
```

## 4. Architectural principles

- Keep place discovery external; keep dog-policy truth internal
- Clients never call the place provider directly
- Use internal place IDs as canonical IDs
- Keep implementation modular, but deploy as one API with one primary mobile client
- Avoid microservices, background workers, and extra infrastructure in MVP

## 5. Core domains

- Places
- Dog rules
- Verification metadata
- User reports
- Admin moderation

Favorites are deferred from MVP even though report submission requires authenticated identity.

## 6. App boundaries

### `apps/mobile`
Responsibilities:
- search UI
- nearby/map discovery
- place detail
- report submission
- location permission handling
- deep linking and mobile-first navigation

### `apps/api`
Responsibilities:
- provider integration
- place normalization
- search/detail endpoints
- dog-rule storage and retrieval
- moderation workflows
- rate limiting and admin-only protection

## 7. Repo structure

```text
apps/
  mobile/
    app/
    components/
    lib/
    assets/

  api/
    app/
      api/routes/
      core/
      services/
      providers/places/
      db/

packages/
  contracts/
    openapi/
    json-schema/
    examples/

docs/
tasks/
```

## 8. Data model outline

### places
- id
- provider
- provider_place_id
- name
- formatted_address
- lat
- lng
- primary_category
- website_url
- provider_url
- cached_at
- created_at
- updated_at

Unique constraint:
- (`provider`, `provider_place_id`)

### pet_rules
- id
- place_id
- dog_policy_status
- indoor_allowed
- outdoor_allowed
- leash_required
- size_restriction
- breed_restriction
- service_dog_only
- notes
- verification_source_type
- verification_source_url
- verified_at
- created_at
- updated_at

### user_reports
- id
- place_id
- reporter_user_id
- proposed_dog_policy_status
- proposed_indoor_allowed
- proposed_outdoor_allowed
- proposed_leash_required
- proposed_size_restriction
- proposed_breed_restriction
- proposed_service_dog_only
- proposed_notes
- evidence_url
- reporter_comment
- status
- review_notes
- reviewed_by_user_id
- created_at
- reviewed_at

## 9. API priorities

Priority order:
1. `GET /places/search`
2. `GET /places/{id}`
3. `POST /reports`

### Contract rules
- API owns all provider integration and normalization
- Frontend consumes app-level contracts only
- Provider-specific response shapes must not leak into the UI
- Use stable enums for:
  - `dogPolicyStatus`: `allowed | restricted | not_allowed | unknown`
  - `verificationSourceType`: `official_website | direct_contact | user_report | onsite_signage | third_party_listing | other`
  - `reportStatus`: `pending | approved | rejected`

Contract source of truth lives in `packages/contracts/`, with docs and mocks expected to follow those shared values.
- `POST /reports` is auth-required in MVP; read endpoints remain public

## 10. Search and identity flow

1. User searches by keyword or map area
2. API queries Google Places
3. API normalizes provider response
4. API upserts place snapshots into `places`
5. API joins any internal dog-rule records
6. API returns a merged app-level response

Canonical identity rules:
- internal `place.id` is the app-level API ID
- external identity is stored as `provider + provider_place_id`
- do not use provider IDs as the public domain model

## 11. Deployment baseline

### Mobile
- Primary end-user surface is `apps/mobile`
- Distribution path to be defined around Expo/EAS once the shell is in place
- Required env:
  - mobile API base URL

### API
- Deploy `apps/api` to Render
- Required env:
  - `DATABASE_URL`
  - provider API key when live integrations land
  - admin secret when real auth/admin protection lands
  - allowed origins when cross-origin controls are added

### Database
- PostgreSQL
- plain Postgres first
- DB migrations from day one

### Operational minimums
- health endpoint
- structured logs
- staging + production environments
- optional error monitoring later if useful

## 12. Explicit non-goals for MVP

Do not add yet:
- microservices
- GraphQL
- background workers
- Redis unless rate limiting forces it
- Kubernetes
- complex plugin/provider marketplaces
- full end-user auth/account management flows beyond the minimal authenticated identity required for `POST /reports`
