# PawMap MVP API Contract

This document defines the first reviewable HTTP contract for the modular-monolith MVP.

Shared enum values and example payloads live under `packages/contracts/` and should be treated as the source of truth for docs, frontend mocks, and backend models.

## Principles

- Public read endpoints should be fast and cacheable
- Write endpoints should be narrow and explicit
- Internal IDs are PawMap IDs, not provider IDs
- Moderation stays server-side; user submissions never publish directly
- Google Maps / Google Places is the only provider family in MVP
- Report submission is authenticated-only in MVP
- Provider cache misses should be explicit so the client can render a dedicated error screen

## Resource summary

- `PlaceSummary` — compact search result for map/listing
- `PlaceDetail` — place metadata + current dog rule state
- `UserReportSubmission` — authenticated user-proposed rule update payload
- `ModerationDecision` — admin approve/reject action
- `ApiError` — structured error payload for not-found/auth/validation states

## Endpoints

### `GET /health`

Basic health probe for local/dev hosting.

### `GET /places/search`

Search by free text and optional location bias. Search may use Google Places to find candidates and return only places PawMap can resolve into canonical records for the MVP scaffold.

#### Query params

- `q` (required, string)
- `lat` (optional, number)
- `lng` (optional, number)
- `radiusMeters` (optional, integer, default 5000)
- `limit` (optional, integer, default 20, max 50)

#### Response shape

```json
{
  "items": [
    {
      "id": "plc_123",
      "googlePlaceId": "ChIJ123example",
      "name": "Puppy Cafe",
      "formattedAddress": "123 Smith St, Fitzroy VIC",
      "lat": -37.798,
      "lng": 144.978,
      "category": "cafe",
      "dogPolicyStatus": "restricted",
      "confidenceScore": 82,
      "verifiedAt": "2026-03-10T09:00:00Z"
    }
  ]
}
```

### `GET /places/nearby`

Map viewport or nearby search for already-known places.

#### Query params

- `lat` (required, number)
- `lng` (required, number)
- `radiusMeters` (optional, integer, default 2000, max 20000)
- `limit` (optional, integer, default 50, max 100)
- `dogPolicyStatus` (optional, enum)

### `GET /places/resolve/google/{googlePlaceId}`

Resolve a cached Google place into the canonical PawMap place record.

#### Success response

```json
{
  "placeId": "plc_123",
  "googlePlaceId": "ChIJ123example",
  "status": "resolved"
}
```

#### Cache miss response

- `404 Not Found`

```json
{
  "error": {
    "code": "PLACE_CACHE_MISS",
    "message": "Google place is not cached in PawMap yet."
  }
}
```

The client should render the dedicated provider/cache-miss error screen for this case.

### `GET /places/{placeId}`

Returns canonical place metadata and the current published dog-rule record.

#### Response shape

```json
{
  "id": "plc_123",
  "googlePlaceId": "ChIJ123example",
  "name": "Puppy Cafe",
  "formattedAddress": "123 Smith St, Fitzroy VIC",
  "lat": -37.798,
  "lng": 144.978,
  "category": "cafe",
  "websiteUrl": "https://example.com",
  "petRules": {
    "dogPolicyStatus": "restricted",
    "indoorAllowed": false,
    "outdoorAllowed": true,
    "leashRequired": true,
    "sizeRestriction": "Small dogs preferred",
    "breedRestriction": null,
    "serviceDogOnly": false,
    "notes": "Dogs allowed in courtyard only.",
    "confidenceScore": 82,
    "verificationSourceType": "official_website",
    "verificationSourceUrl": "https://example.com/policy",
    "verifiedAt": "2026-03-10T09:00:00Z"
  }
}
```

### `GET /places/{placeId}/pet-rules`

Returns only the current published dog-rule state for lightweight clients.

### `POST /reports`

Submit an authenticated user-proposed change for a place.

#### Auth

- Requires authenticated user
- Returns `401` when no session/user identity is present

#### Request shape

```json
{
  "placeId": "plc_123",
  "proposedDogPolicyStatus": "allowed",
  "proposedIndoorAllowed": true,
  "proposedOutdoorAllowed": true,
  "proposedLeashRequired": false,
  "proposedSizeRestriction": null,
  "proposedBreedRestriction": null,
  "proposedServiceDogOnly": false,
  "proposedNotes": "Staff said dogs are welcome inside during off-peak hours.",
  "evidenceUrl": "https://instagram.com/...",
  "reporterComment": "Confirmed with venue on 13 March"
}
```

#### Response

- `201 Created` with report ID and moderation status

### `GET /admin/reports`

List pending and recent reports for moderators.

#### Query params

- `status` (optional: `pending` | `approved` | `rejected`)
- `limit` (optional, default 20, max 100)
- `cursor` (optional)

### `POST /admin/reports/{reportId}/approve`

Approve a report and publish the proposed values into `pet_rules`.

#### Behavior

- Update or create the place's `pet_rules` row
- Mark report as `approved`
- Record `reviewed_at` and moderator identity

### `POST /admin/reports/{reportId}/reject`

Reject a report without changing published rules.

#### Request shape

```json
{
  "reviewNotes": "Evidence was outdated and contradicted venue website."
}
```

## Initial validation rules

- `dogPolicyStatus`: `allowed` | `restricted` | `not_allowed` | `unknown`
- `confidenceScore`: integer 0-100
- `q`: minimum 2 characters
- `radiusMeters`: positive integer within endpoint max
- Report submission must include at least one proposed field or note/evidence/comment

## Auth assumptions

- Read endpoints are public in MVP
- Report submission requires authenticated user
- Admin endpoints require moderator/admin role
- Favorites are removed from MVP

## Remaining implementation questions

1. Should `GET /places/search` return Google hits that are not yet cached, or hide them until the ingest/hydration path exists?
2. Which auth provider will issue the user identity consumed by `POST /reports`?
3. Should `GET /places/resolve/google/{googlePlaceId}` eventually trigger async hydration, or remain read-only in v1?
