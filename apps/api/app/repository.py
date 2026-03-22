from __future__ import annotations

from copy import deepcopy
from functools import lru_cache
from math import acos, cos, radians, sin
from typing import Protocol
from uuid import uuid4

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:  # pragma: no cover - optional until dependencies are installed
    psycopg = None
    dict_row = None

from .config import get_settings
from .google_ingestion import CanonicalPlaceUpsert, GoogleIngestResult
from .models import (
    AdminReportRecord,
    DogPolicyStatus,
    PetRules,
    PlaceDetail,
    PlaceSummary,
    RejectReportRequest,
    ReportCreateRequest,
    ReportResponse,
    ReportStatus,
    ResolveGooglePlaceResponse,
    VerificationSourceType,
    serialize_report_payload,
    utcnow,
)


class Repository(Protocol):
    def search_places(
        self,
        query: str,
        limit: int,
        lat: float | None = None,
        lng: float | None = None,
        radius_meters: int | None = None,
    ) -> list[PlaceSummary]: ...

    def nearby_places(
        self,
        lat: float,
        lng: float,
        radius_meters: int,
        limit: int,
        dog_policy_status: DogPolicyStatus | None,
    ) -> list[PlaceSummary]: ...

    def resolve_google_place(self, google_place_id: str) -> ResolveGooglePlaceResponse | None: ...

    def get_place(self, place_id: str) -> PlaceDetail | None: ...

    def upsert_google_places(self, places: list[CanonicalPlaceUpsert]) -> GoogleIngestResult: ...

    def create_report(self, payload: ReportCreateRequest, reporter_user_id: str) -> ReportResponse: ...

    def list_reports(self, status: ReportStatus | None, limit: int) -> list[AdminReportRecord]: ...

    def approve_report(self, report_id: str, reviewer_user_id: str) -> AdminReportRecord | None: ...

    def reject_report(self, report_id: str, reviewer_user_id: str, payload: RejectReportRequest) -> AdminReportRecord | None: ...


class InMemoryRepository:
    def __init__(self) -> None:
        self._places = self._seed_places()
        self._reports: list[dict] = []
        self._report_counter = 1

    def _seed_places(self) -> dict[str, PlaceDetail]:
        places = [
            PlaceDetail(
                id="plc_puppy_cafe",
                googlePlaceId="ChIJ-puppy-cafe",
                name="Puppy Cafe",
                formattedAddress="123 Smith St, Fitzroy VIC",
                lat=-37.798,
                lng=144.978,
                category="cafe",
                dogPolicyStatus=DogPolicyStatus.RESTRICTED,
                confidenceScore=82,
                verifiedAt="2026-03-10T09:00:00Z",
                websiteUrl="https://example.com",
                petRules=PetRules(
                    dogPolicyStatus=DogPolicyStatus.RESTRICTED,
                    indoorAllowed=False,
                    outdoorAllowed=True,
                    leashRequired=True,
                    sizeRestriction="Small dogs preferred",
                    breedRestriction=None,
                    serviceDogOnly=False,
                    notes="Dogs allowed in courtyard only.",
                    confidenceScore=82,
                    verificationSourceType=VerificationSourceType.OFFICIAL_WEBSITE,
                    verificationSourceUrl="https://example.com/policy",
                    verifiedAt="2026-03-10T09:00:00Z",
                ),
            ),
            PlaceDetail(
                id="plc_royal-bark",
                googlePlaceId="ChIJ-royal-bark",
                name="Royal Bark Cafe",
                formattedAddress="12 Napier St, Fitzroy VIC",
                lat=-37.7988,
                lng=144.9794,
                category="cafe",
                dogPolicyStatus=DogPolicyStatus.RESTRICTED,
                confidenceScore=92,
                verifiedAt="2026-03-12T09:00:00Z",
                websiteUrl="https://example.com/royal-bark",
                petRules=PetRules(
                    dogPolicyStatus=DogPolicyStatus.RESTRICTED,
                    indoorAllowed=False,
                    outdoorAllowed=True,
                    leashRequired=True,
                    sizeRestriction=None,
                    breedRestriction=None,
                    serviceDogOnly=False,
                    notes="Dogs are welcome in the courtyard. Staff may pause access during busy brunch periods.",
                    confidenceScore=92,
                    verificationSourceType=VerificationSourceType.OFFICIAL_WEBSITE,
                    verificationSourceUrl="https://example.com/royal-bark/policy",
                    verifiedAt="2026-03-12T09:00:00Z",
                ),
            ),
            PlaceDetail(
                id="plc_pawsome-park",
                googlePlaceId="ChIJ-pawsome-park",
                name="Pawsome Park",
                formattedAddress="88 River Walk, Richmond VIC",
                lat=-37.8232,
                lng=144.9971,
                category="park",
                dogPolicyStatus=DogPolicyStatus.ALLOWED,
                confidenceScore=84,
                verifiedAt="2026-03-14T09:00:00Z",
                websiteUrl="https://example.com/pawsome-park",
                petRules=PetRules(
                    dogPolicyStatus=DogPolicyStatus.ALLOWED,
                    indoorAllowed=None,
                    outdoorAllowed=True,
                    leashRequired=False,
                    sizeRestriction=None,
                    breedRestriction=None,
                    serviceDogOnly=False,
                    notes="Off-leash allowed inside the signed exercise area. Leash required on shared paths.",
                    confidenceScore=84,
                    verificationSourceType=VerificationSourceType.ONSITE_SIGNAGE,
                    verificationSourceUrl=None,
                    verifiedAt="2026-03-14T09:00:00Z",
                ),
            ),
            PlaceDetail(
                id="plc_market-hall",
                googlePlaceId="ChIJ-market-hall",
                name="Market Hall Grocer",
                formattedAddress="40 Smith St, Collingwood VIC",
                lat=-37.8021,
                lng=144.9833,
                category="retail",
                dogPolicyStatus=DogPolicyStatus.UNKNOWN,
                confidenceScore=None,
                verifiedAt=None,
                websiteUrl=None,
                petRules=PetRules(
                    dogPolicyStatus=DogPolicyStatus.UNKNOWN,
                    indoorAllowed=None,
                    outdoorAllowed=None,
                    leashRequired=None,
                    sizeRestriction=None,
                    breedRestriction=None,
                    serviceDogOnly=None,
                    notes="We need a stronger source before showing a dog policy.",
                    confidenceScore=None,
                    verificationSourceType=None,
                    verificationSourceUrl=None,
                    verifiedAt=None,
                ),
            ),
        ]
        return {place.id: place for place in places}

    def search_places(
        self,
        query: str,
        limit: int,
        lat: float | None = None,
        lng: float | None = None,
        radius_meters: int | None = None,
    ) -> list[PlaceSummary]:
        lowered = query.strip().lower()
        items = [
            self._to_summary(place)
            for place in self._places.values()
            if self._matches_search(place, lowered)
        ]
        if lat is not None and lng is not None and radius_meters is not None:
            items = [
                item
                for item in items
                if self._distance_meters(lat, lng, item.lat, item.lng) <= radius_meters
            ]
            items.sort(key=lambda item: (self._distance_meters(lat, lng, item.lat, item.lng), item.name.lower()))
        else:
            items.sort(key=self._search_sort_key)
        return items[:limit]

    def nearby_places(
        self,
        lat: float,
        lng: float,
        radius_meters: int,
        limit: int,
        dog_policy_status: DogPolicyStatus | None,
    ) -> list[PlaceSummary]:
        del lat, lng, radius_meters
        items = [self._to_summary(place) for place in self._places.values()]
        if dog_policy_status is not None:
            items = [item for item in items if item.dogPolicyStatus == dog_policy_status]
        return items[:limit]

    def resolve_google_place(self, google_place_id: str) -> ResolveGooglePlaceResponse | None:
        for place in self._places.values():
            if place.googlePlaceId == google_place_id:
                return ResolveGooglePlaceResponse(placeId=place.id, googlePlaceId=google_place_id)
        return None

    def get_place(self, place_id: str) -> PlaceDetail | None:
        place = self._places.get(place_id)
        return deepcopy(place) if place else None

    def upsert_google_places(self, places: list[CanonicalPlaceUpsert]) -> GoogleIngestResult:
        inserted = 0
        updated = 0
        place_ids: list[str] = []
        for record in places:
            existing = next((place for place in self._places.values() if place.googlePlaceId == record.googlePlaceId), None)
            if existing is None:
                detail = PlaceDetail(
                    id=record.placeId,
                    googlePlaceId=record.googlePlaceId,
                    name=record.name,
                    formattedAddress=record.formattedAddress,
                    lat=record.lat,
                    lng=record.lng,
                    category=record.category,
                    dogPolicyStatus=DogPolicyStatus.UNKNOWN,
                    confidenceScore=None,
                    verifiedAt=None,
                    websiteUrl=record.websiteUrl,
                    petRules=PetRules(
                        dogPolicyStatus=DogPolicyStatus.UNKNOWN,
                        indoorAllowed=None,
                        outdoorAllowed=None,
                        leashRequired=None,
                        sizeRestriction=None,
                        breedRestriction=None,
                        serviceDogOnly=None,
                        notes=None,
                        confidenceScore=None,
                        verificationSourceType=None,
                        verificationSourceUrl=None,
                        verifiedAt=None,
                    ),
                )
                self._places[detail.id] = detail
                place_ids.append(detail.id)
                inserted += 1
                continue

            existing.name = record.name
            existing.formattedAddress = record.formattedAddress
            existing.lat = record.lat
            existing.lng = record.lng
            existing.category = record.category
            existing.websiteUrl = record.websiteUrl
            place_ids.append(existing.id)
            updated += 1

        return GoogleIngestResult(total=len(places), inserted=inserted, updated=updated, place_ids=place_ids)

    def create_report(self, payload: ReportCreateRequest, reporter_user_id: str) -> ReportResponse:
        report_id = f"rpt_{self._report_counter:04d}"
        self._report_counter += 1
        record = serialize_report_payload(payload, report_id=report_id, reporter_user_id=reporter_user_id)
        self._reports.append(record)
        return ReportResponse.model_validate(record)

    def list_reports(self, status: ReportStatus | None, limit: int) -> list[AdminReportRecord]:
        records: list[dict] = self._reports
        if status is not None:
            records = [record for record in records if record["status"] == status]
        sliced = list(records)[:limit]
        return [AdminReportRecord.model_validate(record) for record in sliced]

    def approve_report(self, report_id: str, reviewer_user_id: str) -> AdminReportRecord | None:
        record = self._find_report(report_id)
        if record is None:
            return None
        reviewed_at = utcnow()
        record["status"] = ReportStatus.APPROVED
        record["reviewedAt"] = reviewed_at
        record["reviewedByUserId"] = reviewer_user_id

        place = self._places.get(record["placeId"])
        if place is not None:
            updates = {
                "dogPolicyStatus": record.get("proposedDogPolicyStatus", place.petRules.dogPolicyStatus),
                "indoorAllowed": record.get("proposedIndoorAllowed", place.petRules.indoorAllowed),
                "outdoorAllowed": record.get("proposedOutdoorAllowed", place.petRules.outdoorAllowed),
                "leashRequired": record.get("proposedLeashRequired", place.petRules.leashRequired),
                "sizeRestriction": record.get("proposedSizeRestriction", place.petRules.sizeRestriction),
                "breedRestriction": record.get("proposedBreedRestriction", place.petRules.breedRestriction),
                "serviceDogOnly": record.get("proposedServiceDogOnly", place.petRules.serviceDogOnly),
                "notes": record.get("proposedNotes", place.petRules.notes),
                "confidenceScore": place.petRules.confidenceScore,
                "verificationSourceType": VerificationSourceType.USER_REPORT,
                "verificationSourceUrl": record.get("evidenceUrl", place.petRules.verificationSourceUrl),
                "verifiedAt": reviewed_at,
            }
            place.petRules = PetRules(**updates)
            place.dogPolicyStatus = place.petRules.dogPolicyStatus
            place.confidenceScore = place.petRules.confidenceScore
            place.verifiedAt = place.petRules.verifiedAt
        return AdminReportRecord.model_validate(record)

    def reject_report(self, report_id: str, reviewer_user_id: str, payload: RejectReportRequest) -> AdminReportRecord | None:
        record = self._find_report(report_id)
        if record is None:
            return None
        record["status"] = ReportStatus.REJECTED
        record["reviewNotes"] = payload.reviewNotes
        record["reviewedAt"] = utcnow()
        record["reviewedByUserId"] = reviewer_user_id
        return AdminReportRecord.model_validate(record)

    def _find_report(self, report_id: str) -> dict | None:
        for record in self._reports:
            if record["id"] == report_id:
                return record
        return None

    @staticmethod
    def _matches_search(place: PlaceDetail, lowered_query: str) -> bool:
        if not lowered_query:
            return True
        haystacks = [
            place.name,
            place.formattedAddress,
            place.category or "",
            place.petRules.notes or "",
        ]
        return any(lowered_query in value.lower() for value in haystacks)

    @staticmethod
    def _search_sort_key(item: PlaceSummary) -> tuple[int, int, str]:
        priority = {
            DogPolicyStatus.RESTRICTED: 0,
            DogPolicyStatus.ALLOWED: 1,
            DogPolicyStatus.NOT_ALLOWED: 2,
            DogPolicyStatus.UNKNOWN: 3,
        }
        verified_at_sort = int(item.verifiedAt.timestamp()) if item.verifiedAt is not None else 0
        return (priority[item.dogPolicyStatus], -verified_at_sort, item.name.lower())

    @staticmethod
    def _to_summary(place: PlaceDetail) -> PlaceSummary:
        return PlaceSummary(
            id=place.id,
            googlePlaceId=place.googlePlaceId,
            name=place.name,
            formattedAddress=place.formattedAddress,
            lat=place.lat,
            lng=place.lng,
            category=place.category,
            dogPolicyStatus=place.dogPolicyStatus,
            confidenceScore=place.confidenceScore,
            verifiedAt=place.verifiedAt,
        )

    @staticmethod
    def _distance_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        cosine = (
            cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1))
            + sin(radians(lat1)) * sin(radians(lat2))
        )
        bounded = max(-1.0, min(1.0, cosine))
        return 6371000 * acos(bounded)


class PostgresRepository:
    def __init__(self, dsn: str) -> None:
        if psycopg is None:
            raise RuntimeError("psycopg is required when DATABASE_URL is configured.")
        self._dsn = dsn

    def _connect(self):
        return psycopg.connect(self._dsn, row_factory=dict_row)

    def search_places(
        self,
        query: str,
        limit: int,
        lat: float | None = None,
        lng: float | None = None,
        radius_meters: int | None = None,
    ) -> list[PlaceSummary]:
        params: dict[str, object] = {"query": f"%{query}%", "limit": limit}
        distance_select = ""
        distance_where = ""
        order_by = "pr.verified_at desc nulls last, p.updated_at desc nulls last, p.created_at desc"
        if lat is not None and lng is not None and radius_meters is not None:
            params.update({"lat": lat, "lng": lng, "radius_meters": radius_meters})
            distance_expr = """
              6371000 * acos(
                least(1.0, greatest(-1.0,
                  cos(radians(%(lat)s)) * cos(radians(p.lat::float8)) * cos(radians(p.lng::float8) - radians(%(lng)s)) +
                  sin(radians(%(lat)s)) * sin(radians(p.lat::float8))
                ))
              )
            """
            distance_select = f",\n              ({distance_expr}) as distance_meters"
            distance_where = f"and ({distance_expr}) <= %(radius_meters)s"
            order_by = "distance_meters asc, pr.verified_at desc nulls last, p.updated_at desc nulls last, p.created_at desc"

        sql = f"""
            select
              p.id::text as id,
              p.name,
              p.formatted_address,
              p.lat::float8 as lat,
              p.lng::float8 as lng,
              p.category,
              pr.dog_policy_status,
              pr.confidence_score,
              pr.verified_at,
              ppr.provider_place_id as google_place_id
              {distance_select}
            from places p
            join pet_rules pr on pr.place_id = p.id
            left join place_provider_refs ppr
              on ppr.place_id = p.id and ppr.provider = 'google_places'
            where (
              p.name ilike %(query)s
              or p.formatted_address ilike %(query)s
              or coalesce(p.category, '') ilike %(query)s
              or coalesce(pr.notes, '') ilike %(query)s
            )
            {distance_where}
            order by {order_by}
            limit %(limit)s
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql, params)
            return [self._row_to_summary(row) for row in cur.fetchall()]

    def nearby_places(
        self,
        lat: float,
        lng: float,
        radius_meters: int,
        limit: int,
        dog_policy_status: DogPolicyStatus | None,
    ) -> list[PlaceSummary]:
        filters = ""
        params: dict[str, object] = {
            "lat": lat,
            "lng": lng,
            "radius_meters": radius_meters,
            "limit": limit,
        }
        if dog_policy_status is not None:
            filters = "and pr.dog_policy_status = %(dog_policy_status)s"
            params["dog_policy_status"] = dog_policy_status.value

        sql = f"""
            select
              p.id::text as id,
              p.name,
              p.formatted_address,
              p.lat::float8 as lat,
              p.lng::float8 as lng,
              p.category,
              pr.dog_policy_status,
              pr.confidence_score,
              pr.verified_at,
              ppr.provider_place_id as google_place_id,
              (
                6371000 * acos(
                  least(1.0, greatest(-1.0,
                    cos(radians(%(lat)s)) * cos(radians(p.lat::float8)) * cos(radians(p.lng::float8) - radians(%(lng)s)) +
                    sin(radians(%(lat)s)) * sin(radians(p.lat::float8))
                  ))
                )
              ) as distance_meters
            from places p
            join pet_rules pr on pr.place_id = p.id
            left join place_provider_refs ppr
              on ppr.place_id = p.id and ppr.provider = 'google_places'
            where (
              6371000 * acos(
                least(1.0, greatest(-1.0,
                  cos(radians(%(lat)s)) * cos(radians(p.lat::float8)) * cos(radians(p.lng::float8) - radians(%(lng)s)) +
                  sin(radians(%(lat)s)) * sin(radians(p.lat::float8))
                ))
              )
            ) <= %(radius_meters)s
            {filters}
            order by distance_meters asc
            limit %(limit)s
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql, params)
            return [self._row_to_summary(row) for row in cur.fetchall()]

    def resolve_google_place(self, google_place_id: str) -> ResolveGooglePlaceResponse | None:
        sql = """
            select p.id::text as place_id, ppr.provider_place_id as google_place_id
            from place_provider_refs ppr
            join places p on p.id = ppr.place_id
            where ppr.provider = 'google_places' and ppr.provider_place_id = %(google_place_id)s
            limit 1
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql, {"google_place_id": google_place_id})
            row = cur.fetchone()
            if row is None:
                return None
            return ResolveGooglePlaceResponse(placeId=row["place_id"], googlePlaceId=row["google_place_id"])

    def get_place(self, place_id: str) -> PlaceDetail | None:
        sql = """
            select
              p.id::text as id,
              p.name,
              p.formatted_address,
              p.lat::float8 as lat,
              p.lng::float8 as lng,
              p.category,
              p.website_url,
              pr.dog_policy_status,
              pr.indoor_allowed,
              pr.outdoor_allowed,
              pr.leash_required,
              pr.size_restriction,
              pr.breed_restriction,
              pr.service_dog_only,
              pr.notes,
              pr.confidence_score,
              pr.verification_source_type,
              pr.verification_source_url,
              pr.verified_at,
              ppr.provider_place_id as google_place_id
            from places p
            join pet_rules pr on pr.place_id = p.id
            left join place_provider_refs ppr
              on ppr.place_id = p.id and ppr.provider = 'google_places'
            where p.id::text = %(place_id)s
            limit 1
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql, {"place_id": place_id})
            row = cur.fetchone()
            if row is None:
                return None
            return self._row_to_place_detail(row)

    def upsert_google_places(self, places: list[CanonicalPlaceUpsert]) -> GoogleIngestResult:
        inserted = 0
        updated = 0
        place_ids: list[str] = []
        with self._connect() as conn, conn.cursor() as cur:
            for record in places:
                cur.execute(
                    """
                    select p.id::text as place_id
                    from place_provider_refs ppr
                    join places p on p.id = ppr.place_id
                    where ppr.provider = 'google_places' and ppr.provider_place_id = %(google_place_id)s
                    limit 1
                    """,
                    {"google_place_id": record.googlePlaceId},
                )
                existing = cur.fetchone()
                if existing is None:
                    cur.execute(
                        """
                        insert into places (id, name, formatted_address, lat, lng, category, website_url)
                        values (%(place_id)s, %(name)s, %(formatted_address)s, %(lat)s, %(lng)s, %(category)s, %(website_url)s)
                        """,
                        {
                            "place_id": record.placeId,
                            "name": record.name,
                            "formatted_address": record.formattedAddress,
                            "lat": record.lat,
                            "lng": record.lng,
                            "category": record.category,
                            "website_url": record.websiteUrl,
                        },
                    )
                    cur.execute(
                        """
                        insert into place_provider_refs (place_id, provider, provider_place_id, provider_url, last_synced_at)
                        values (%(place_id)s, 'google_places', %(google_place_id)s, %(provider_url)s, now())
                        """,
                        {
                            "place_id": record.placeId,
                            "google_place_id": record.googlePlaceId,
                            "provider_url": record.providerUrl,
                        },
                    )
                    cur.execute(
                        """
                        insert into pet_rules (
                          place_id, dog_policy_status, confidence_score, verification_source_type, published_at, updated_at
                        ) values (
                          %(place_id)s, 'unknown', 0, 'other', now(), now()
                        )
                        on conflict (place_id) do nothing
                        """,
                        {"place_id": record.placeId},
                    )
                    place_ids.append(record.placeId)
                    inserted += 1
                    continue

                place_id = existing['place_id']
                cur.execute(
                    """
                    update places
                    set name = %(name)s, formatted_address = %(formatted_address)s, lat = %(lat)s, lng = %(lng)s,
                        category = %(category)s, website_url = %(website_url)s, updated_at = now()
                    where id::text = %(place_id)s
                    """,
                    {
                        "place_id": place_id,
                        "name": record.name,
                        "formatted_address": record.formattedAddress,
                        "lat": record.lat,
                        "lng": record.lng,
                        "category": record.category,
                        "website_url": record.websiteUrl,
                    },
                )
                cur.execute(
                    """
                    update place_provider_refs
                    set provider_url = %(provider_url)s, last_synced_at = now()
                    where provider = 'google_places' and provider_place_id = %(google_place_id)s
                    """,
                    {"provider_url": record.providerUrl, "google_place_id": record.googlePlaceId},
                )
                place_ids.append(place_id)
                updated += 1
            conn.commit()
        return GoogleIngestResult(total=len(places), inserted=inserted, updated=updated, place_ids=place_ids)

    def create_report(self, payload: ReportCreateRequest, reporter_user_id: str) -> ReportResponse:
        report_id = str(uuid4())
        sql = """
            insert into user_reports (
              id, place_id, reporter_user_id, status,
              proposed_dog_policy_status, proposed_indoor_allowed, proposed_outdoor_allowed,
              proposed_leash_required, proposed_size_restriction, proposed_breed_restriction,
              proposed_service_dog_only, proposed_notes, evidence_url, reporter_comment
            ) values (
              %(id)s, %(place_id)s, %(reporter_user_id)s, %(status)s,
              %(proposed_dog_policy_status)s, %(proposed_indoor_allowed)s, %(proposed_outdoor_allowed)s,
              %(proposed_leash_required)s, %(proposed_size_restriction)s, %(proposed_breed_restriction)s,
              %(proposed_service_dog_only)s, %(proposed_notes)s, %(evidence_url)s, %(reporter_comment)s
            )
            returning id::text as id, place_id::text as place_id, reporter_user_id::text as reporter_user_id, status, created_at
        """
        params = {
            "id": report_id,
            "place_id": payload.placeId,
            "reporter_user_id": reporter_user_id,
            "status": ReportStatus.PENDING.value,
            "proposed_dog_policy_status": payload.proposedDogPolicyStatus.value if payload.proposedDogPolicyStatus else None,
            "proposed_indoor_allowed": payload.proposedIndoorAllowed,
            "proposed_outdoor_allowed": payload.proposedOutdoorAllowed,
            "proposed_leash_required": payload.proposedLeashRequired,
            "proposed_size_restriction": payload.proposedSizeRestriction,
            "proposed_breed_restriction": payload.proposedBreedRestriction,
            "proposed_service_dog_only": payload.proposedServiceDogOnly,
            "proposed_notes": payload.proposedNotes,
            "evidence_url": str(payload.evidenceUrl) if payload.evidenceUrl else None,
            "reporter_comment": payload.reporterComment,
        }
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql, params)
            row = cur.fetchone()
            conn.commit()
            return ReportResponse.model_validate(self._camel_report_row(row))

    def list_reports(self, status: ReportStatus | None, limit: int) -> list[AdminReportRecord]:
        filters = ""
        params: dict[str, object] = {"limit": limit}
        if status is not None:
            filters = "where ur.status = %(status)s"
            params["status"] = status.value
        sql = f"""
            select
              ur.id::text as id,
              ur.place_id::text as place_id,
              ur.status,
              ur.reporter_user_id::text as reporter_user_id,
              ur.proposed_dog_policy_status,
              ur.proposed_indoor_allowed,
              ur.proposed_outdoor_allowed,
              ur.proposed_leash_required,
              ur.proposed_size_restriction,
              ur.proposed_breed_restriction,
              ur.proposed_service_dog_only,
              ur.proposed_notes,
              ur.evidence_url,
              ur.reporter_comment,
              ur.review_notes,
              ur.reviewed_by_user_id::text as reviewed_by_user_id,
              ur.created_at,
              ur.reviewed_at
            from user_reports ur
            {filters}
            order by ur.created_at desc
            limit %(limit)s
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql, params)
            return [AdminReportRecord.model_validate(self._camel_report_row(row)) for row in cur.fetchall()]

    def approve_report(self, report_id: str, reviewer_user_id: str) -> AdminReportRecord | None:
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                select
                  ur.id::text as id,
                  ur.place_id::text as place_id,
                  ur.status,
                  ur.reporter_user_id::text as reporter_user_id,
                  ur.proposed_dog_policy_status,
                  ur.proposed_indoor_allowed,
                  ur.proposed_outdoor_allowed,
                  ur.proposed_leash_required,
                  ur.proposed_size_restriction,
                  ur.proposed_breed_restriction,
                  ur.proposed_service_dog_only,
                  ur.proposed_notes,
                  ur.evidence_url,
                  ur.reporter_comment,
                  ur.review_notes,
                  ur.reviewed_by_user_id::text as reviewed_by_user_id,
                  ur.created_at,
                  ur.reviewed_at,
                  pr.dog_policy_status as current_dog_policy_status,
                  pr.indoor_allowed as current_indoor_allowed,
                  pr.outdoor_allowed as current_outdoor_allowed,
                  pr.leash_required as current_leash_required,
                  pr.size_restriction as current_size_restriction,
                  pr.breed_restriction as current_breed_restriction,
                  pr.service_dog_only as current_service_dog_only,
                  pr.notes as current_notes,
                  pr.confidence_score as current_confidence_score,
                  pr.verification_source_url as current_verification_source_url
                from user_reports ur
                join pet_rules pr on pr.place_id = ur.place_id
                where ur.id::text = %(report_id)s
                for update
                """,
                {"report_id": report_id},
            )
            row = cur.fetchone()
            if row is None:
                return None

            reviewed_at = utcnow()
            cur.execute(
                """
                update user_reports
                set status = 'approved', reviewed_at = %(reviewed_at)s, reviewed_by_user_id = %(reviewer_user_id)s
                where id::text = %(report_id)s
                """,
                {"reviewed_at": reviewed_at, "reviewer_user_id": reviewer_user_id, "report_id": report_id},
            )
            cur.execute(
                """
                update pet_rules
                set
                  dog_policy_status = %(dog_policy_status)s,
                  indoor_allowed = %(indoor_allowed)s,
                  outdoor_allowed = %(outdoor_allowed)s,
                  leash_required = %(leash_required)s,
                  size_restriction = %(size_restriction)s,
                  breed_restriction = %(breed_restriction)s,
                  service_dog_only = %(service_dog_only)s,
                  notes = %(notes)s,
                  verification_source_type = 'user_report',
                  verification_source_url = %(verification_source_url)s,
                  verified_at = %(reviewed_at)s,
                  updated_at = %(reviewed_at)s
                where place_id::text = %(place_id)s
                """,
                {
                    "place_id": row["place_id"],
                    "dog_policy_status": row["proposed_dog_policy_status"] or row["current_dog_policy_status"],
                    "indoor_allowed": self._coalesce(row["proposed_indoor_allowed"], row["current_indoor_allowed"]),
                    "outdoor_allowed": self._coalesce(row["proposed_outdoor_allowed"], row["current_outdoor_allowed"]),
                    "leash_required": self._coalesce(row["proposed_leash_required"], row["current_leash_required"]),
                    "size_restriction": row["proposed_size_restriction"] or row["current_size_restriction"],
                    "breed_restriction": row["proposed_breed_restriction"] or row["current_breed_restriction"],
                    "service_dog_only": self._coalesce(row["proposed_service_dog_only"], row["current_service_dog_only"]),
                    "notes": row["proposed_notes"] or row["current_notes"],
                    "verification_source_url": row["evidence_url"] or row["current_verification_source_url"],
                    "reviewed_at": reviewed_at,
                },
            )
            conn.commit()
            row["status"] = ReportStatus.APPROVED.value
            row["reviewed_at"] = reviewed_at
            row["reviewed_by_user_id"] = reviewer_user_id
            return AdminReportRecord.model_validate(self._camel_report_row(row))

    def reject_report(self, report_id: str, reviewer_user_id: str, payload: RejectReportRequest) -> AdminReportRecord | None:
        sql = """
            update user_reports
            set status = 'rejected', review_notes = %(review_notes)s, reviewed_at = %(reviewed_at)s, reviewed_by_user_id = %(reviewer_user_id)s
            where id::text = %(report_id)s
            returning
              id::text as id,
              place_id::text as place_id,
              status,
              reporter_user_id::text as reporter_user_id,
              proposed_dog_policy_status,
              proposed_indoor_allowed,
              proposed_outdoor_allowed,
              proposed_leash_required,
              proposed_size_restriction,
              proposed_breed_restriction,
              proposed_service_dog_only,
              proposed_notes,
              evidence_url,
              reporter_comment,
              review_notes,
              reviewed_by_user_id::text as reviewed_by_user_id,
              created_at,
              reviewed_at
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                sql,
                {
                    "review_notes": payload.reviewNotes,
                    "reviewed_at": utcnow(),
                    "reviewer_user_id": reviewer_user_id,
                    "report_id": report_id,
                },
            )
            row = cur.fetchone()
            if row is None:
                return None
            conn.commit()
            return AdminReportRecord.model_validate(self._camel_report_row(row))

    @staticmethod
    def _coalesce(candidate, fallback):
        return fallback if candidate is None else candidate

    @staticmethod
    def _camel_report_row(row: dict) -> dict:
        return {
            "id": row["id"],
            "placeId": row["place_id"],
            "status": row["status"],
            "reporterUserId": row["reporter_user_id"],
            "proposedDogPolicyStatus": row.get("proposed_dog_policy_status"),
            "proposedIndoorAllowed": row.get("proposed_indoor_allowed"),
            "proposedOutdoorAllowed": row.get("proposed_outdoor_allowed"),
            "proposedLeashRequired": row.get("proposed_leash_required"),
            "proposedSizeRestriction": row.get("proposed_size_restriction"),
            "proposedBreedRestriction": row.get("proposed_breed_restriction"),
            "proposedServiceDogOnly": row.get("proposed_service_dog_only"),
            "proposedNotes": row.get("proposed_notes"),
            "evidenceUrl": row.get("evidence_url"),
            "reporterComment": row.get("reporter_comment"),
            "reviewNotes": row.get("review_notes"),
            "reviewedByUserId": row.get("reviewed_by_user_id"),
            "createdAt": row["created_at"],
            "reviewedAt": row.get("reviewed_at"),
        }

    @staticmethod
    def _row_to_summary(row: dict) -> PlaceSummary:
        return PlaceSummary(
            id=row["id"],
            googlePlaceId=row.get("google_place_id") or "",
            name=row["name"],
            formattedAddress=row["formatted_address"],
            lat=row["lat"],
            lng=row["lng"],
            category=row.get("category"),
            dogPolicyStatus=row["dog_policy_status"],
            confidenceScore=row["confidence_score"],
            verifiedAt=row.get("verified_at"),
        )

    @staticmethod
    def _row_to_place_detail(row: dict) -> PlaceDetail:
        pet_rules = PetRules(
            dogPolicyStatus=row["dog_policy_status"],
            indoorAllowed=row.get("indoor_allowed"),
            outdoorAllowed=row.get("outdoor_allowed"),
            leashRequired=row.get("leash_required"),
            sizeRestriction=row.get("size_restriction"),
            breedRestriction=row.get("breed_restriction"),
            serviceDogOnly=row.get("service_dog_only"),
            notes=row.get("notes"),
            confidenceScore=row["confidence_score"],
            verificationSourceType=row["verification_source_type"],
            verificationSourceUrl=row.get("verification_source_url"),
            verifiedAt=row.get("verified_at"),
        )
        return PlaceDetail(
            id=row["id"],
            googlePlaceId=row.get("google_place_id") or "",
            name=row["name"],
            formattedAddress=row["formatted_address"],
            lat=row["lat"],
            lng=row["lng"],
            category=row.get("category"),
            dogPolicyStatus=pet_rules.dogPolicyStatus,
            confidenceScore=pet_rules.confidenceScore,
            verifiedAt=pet_rules.verifiedAt,
            websiteUrl=row.get("website_url"),
            petRules=pet_rules,
        )


@lru_cache
def get_repository() -> Repository:
    settings = get_settings()
    if settings.database_url:
        return PostgresRepository(settings.database_url)
    return InMemoryRepository()
