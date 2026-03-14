# PawMap Architecture

## 1. MVP architecture decision

PawMap should ship as a **modular monolith in a monorepo**:

- `apps/web` — Next.js + TypeScript + Tailwind
- `apps/api` — FastAPI
- `packages/contracts` — shared API contracts and example payloads
- PostgreSQL — application data and cached place snapshots

Optimize for **speed to first usable MVP**, not flexibility for hypothetical scale.

## 2. Recommended stack

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend API: FastAPI
- Database: PostgreSQL
- Geospatial: plain lat/lng first; add PostGIS only if nearby/map queries become limiting
- Auth: defer end-user auth for initial MVP
- Hosting:
  - Vercel for `apps/web`
  - Railway or Render for `apps/api`
  - managed PostgreSQL for data storage
- Place provider: Google Places for MVP, wrapped behind an API provider adapter

## 3. System overview

```text
[Next.js Web App]
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
- Frontend never calls the place provider directly
- Use internal place IDs as canonical IDs
- Keep implementation modular, but deploy as one web app + one API
- Avoid microservices, background workers, and extra infrastructure in MVP

## 5. Core domains

- Places
- Dog rules
- Verification metadata
- User reports
- Admin moderation

Favorites are deferred until end-user auth exists.

## 6. App boundaries

### `apps/web`
Responsibilities:
- search UI
- map/list results
- place detail page
- report submission form
- optional minimal admin UI later

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
  web/
    app/
    components/
    lib/
    public/

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
- proposed_changes
- evidence_url
- contact_email
- status
- created_at
- reviewed_at
- reviewer_note

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

## 10. Search and identity flow

1. User searches by keyword or map area
2. API queries Google Places
3. API normalizes provider response
4. API upserts place snapshots into `places`
5. API joins any internal dog-rule records
6. API returns a merged app-level response

Canonical identity rules:
- internal `place.id` is the app-level ID
- external identity is stored as `provider + provider_place_id`
- do not use provider IDs as the public domain model

## 11. Deployment baseline

### Web
- Deploy `apps/web` to Vercel
- Required env:
  - `NEXT_PUBLIC_API_BASE_URL`
  - frontend map key if needed

### API
- Deploy `apps/api` to Railway or Render
- Required env:
  - provider API key
  - database URL
  - admin secret
  - allowed origins

### Database
- Managed PostgreSQL
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
- full end-user auth flows
