# PawMap Architecture

## 1. Recommended stack

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend API: FastAPI
- Database: PostgreSQL
- Geospatial extension: PostGIS later if needed
- Auth: Supabase Auth or Clerk
- Hosting: Vercel (frontend), Railway/Render (API), managed Postgres

## 2. System overview

```text
[Web App]
   |
   v
[API]
   |-- Place search provider integration
   |-- Pet rules service
   |-- User/auth service
   |-- Moderation service
   |
   v
[PostgreSQL]
```

## 3. Core domains

- Places
- Pet rules
- Verification metadata
- User reports
- Favorites
- Admin moderation

## 4. Initial service boundaries

For MVP, keep a modular monolith:

- `apps/web`
- `apps/api`
- shared docs and contracts in repo

Do not split into microservices yet.

## 5. Data model outline

### places
- id
- external_provider_id
- name
- address
- lat
- lng
- category
- website
- cached_at

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
- confidence_score
- verification_source_type
- verification_source_url
- verified_at

### user_reports
- id
- place_id
- user_id
- proposed_changes
- evidence_url
- status
- created_at

## 6. API surface

- `GET /places/search`
- `GET /places/{id}`
- `GET /places/{id}/pet-rules`
- `GET /places/nearby`
- `POST /reports`
- `POST /favorites/{placeId}`
- `DELETE /favorites/{placeId}`
- `GET /admin/reports`
- `POST /admin/reports/{id}/approve`
- `POST /admin/reports/{id}/reject`

## 7. Key technical decisions

- Start with web, not native app
- Use external provider for place discovery, internal DB for dog-rule truth
- Store evidence and verification timestamps on every rule record
- Use moderation to protect trust and data quality

## 8. Key risks

- Data reliability
- Third-party API cost growth
- Duplicate place identity across sources
- Moderation bottlenecks

## 9. Near-term roadmap

1. Bootstrap repo and governance
2. Finalize PRD and wireframes
3. Define DB schema and API contract
4. Scaffold web and API apps
5. Implement first end-to-end search and place details flow
