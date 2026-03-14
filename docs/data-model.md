# PawMap MVP Data Model

This document refines the architecture outline into an MVP-ready relational schema.

## Design goals

- Keep the first version simple and reviewable
- Preserve a canonical internal place record even if external provider IDs change
- Standardize provider references on Google Places for MVP
- Store the currently published dog-rule truth separately from user-submitted changes
- Make moderation explicit instead of burying it in ad hoc fields
- Keep report submission authenticated-only, while full user account features remain deferred

## Core entities

### `places`

Canonical place records used by the product.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Internal stable identifier |
| `name` | text | Display name |
| `formatted_address` | text | Human-readable address |
| `lat` | numeric(9,6) | Latitude |
| `lng` | numeric(9,6) | Longitude |
| `category` | text null | Cafe, park, pub, shop, etc. |
| `website_url` | text null | Venue website |
| `phone` | text null | Optional contact data |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Default now |

### `place_provider_refs`

Maps a canonical place to Google Places.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `place_id` | UUID FK -> `places.id` | |
| `provider` | text | MVP fixed to `google_places` |
| `provider_place_id` | text | Google Place ID |
| `provider_url` | text null | Google Maps deep link if available |
| `last_synced_at` | timestamptz null | |
| `created_at` | timestamptz | Default now |

Constraint: unique (`provider`, `provider_place_id`)

### `pet_rules`

Current published rule state for a place.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `place_id` | UUID FK -> `places.id` unique | One current published rule record per place in MVP |
| `dog_policy_status` | text | `allowed`, `restricted`, `not_allowed`, `unknown` |
| `indoor_allowed` | boolean null | |
| `outdoor_allowed` | boolean null | |
| `leash_required` | boolean null | |
| `size_restriction` | text null | Free text for MVP |
| `breed_restriction` | text null | Free text for MVP |
| `service_dog_only` | boolean null | |
| `notes` | text null | Human-readable nuance |
| `confidence_score` | integer | 0-100 |
| `verification_source_type` | text | `official_website`, `direct_contact`, `user_report`, `onsite_signage`, `third_party_listing`, `other` |
| `verification_source_url` | text null | |
| `verified_at` | timestamptz null | When evidence was last checked |
| `published_at` | timestamptz | When this rule state became live |
| `updated_at` | timestamptz | Default now |

Constraint: `confidence_score` between 0 and 100

### `user_reports`

Authenticated user-submitted proposed changes awaiting moderation or preserved as audit history.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `place_id` | UUID FK -> `places.id` | |
| `reporter_user_id` | UUID | Required because reports are auth-only in MVP |
| `status` | text | `pending`, `approved`, `rejected` |
| `proposed_dog_policy_status` | text null | |
| `proposed_indoor_allowed` | boolean null | |
| `proposed_outdoor_allowed` | boolean null | |
| `proposed_leash_required` | boolean null | |
| `proposed_size_restriction` | text null | |
| `proposed_breed_restriction` | text null | |
| `proposed_service_dog_only` | boolean null | |
| `proposed_notes` | text null | |
| `evidence_url` | text null | Optional link provided by reporter |
| `reporter_comment` | text null | Free text explanation |
| `reviewed_by_user_id` | UUID null | Moderator |
| `review_notes` | text null | Rejection reason or moderation note |
| `created_at` | timestamptz | Default now |
| `reviewed_at` | timestamptz null | |

## Relationships

```text
places 1---* place_provider_refs
places 1---1 pet_rules
places 1---* user_reports
```

## Why this shape

### Canonical place IDs first

The MVP should not expose third-party place IDs as the primary product identifier. Provider records can change, and PawMap will likely need to merge duplicates later.

### Google-first provider assumptions

Using a single provider family in MVP keeps lookup, cache semantics, and frontend map rendering consistent. It also makes provider-cache-miss handling explicit.

### Published truth vs proposed changes

The current published rule state lives in `pet_rules`. Proposed edits live in `user_reports`. That keeps read paths simple while preserving moderation history.

### Nullable structured fields

Many venues will have incomplete evidence. Nullable booleans are better than forced false values that imply certainty.

## Deferred until later

These are intentionally out of the first schema pass:

- favorites / saved places
- full audit/version history of every published rule change
- multiple evidence attachments per report
- place deduplication/merge workflow
- geospatial indexing with PostGIS
- opening hours and broader place metadata sync
- role/permission tables beyond provider auth defaults

## Recommended next implementation step

Create the first SQL migration and API schemas directly from this document and the OpenAPI contract.
