from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha1
from typing import Any
from uuid import UUID, uuid5

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

GOOGLE_PROVIDER = "google_places"
PAWMAP_PLACE_NAMESPACE = UUID("b7b8af10-7e1f-4b9d-84de-6d4b7c8a5f01")

_GOOGLE_CATEGORY_MAP = {
    "cafe": "cafe",
    "restaurant": "restaurant",
    "park": "park",
    "bar": "bar",
    "pub": "bar",
    "store": "retail",
    "shopping_mall": "retail",
    "pet_store": "retail",
}


class GooglePlaceCandidate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    googlePlaceId: str = Field(min_length=1)
    displayName: str = Field(min_length=1)
    formattedAddress: str = Field(min_length=1)
    lat: float
    lng: float
    primaryType: str | None = None
    websiteUri: HttpUrl | None = None
    googleMapsUri: HttpUrl | None = None

    @field_validator("googlePlaceId", mode="before")
    @classmethod
    def _coerce_google_place_id(cls, value: Any) -> str:
        if isinstance(value, str):
            return value
        if isinstance(value, dict):
            if place_id := value.get("id"):
                return str(place_id)
            if name := value.get("name"):
                return str(name).removeprefix("places/")
        raise ValueError("googlePlaceId is required")

    @field_validator("displayName", mode="before")
    @classmethod
    def _coerce_display_name(cls, value: Any) -> str:
        if isinstance(value, str):
            return value
        if isinstance(value, dict):
            text = value.get("text")
            if text:
                return str(text)
        raise ValueError("displayName is required")

    @field_validator("lat", mode="before")
    @classmethod
    def _coerce_lat(cls, value: Any) -> float:
        if isinstance(value, dict):
            value = value.get("latitude")
        return float(value)

    @field_validator("lng", mode="before")
    @classmethod
    def _coerce_lng(cls, value: Any) -> float:
        if isinstance(value, dict):
            value = value.get("longitude")
        return float(value)

    @classmethod
    def from_google_payload(cls, payload: dict[str, Any]) -> "GooglePlaceCandidate":
        location = payload.get("location") or {}
        return cls.model_validate(
            {
                "googlePlaceId": payload.get("id") or payload.get("name"),
                "displayName": payload.get("displayName") or payload.get("display_name"),
                "formattedAddress": payload.get("formattedAddress") or payload.get("formatted_address"),
                "lat": location.get("latitude", payload.get("lat")),
                "lng": location.get("longitude", payload.get("lng")),
                "primaryType": payload.get("primaryType") or payload.get("primary_type"),
                "websiteUri": payload.get("websiteUri") or payload.get("website_url"),
                "googleMapsUri": payload.get("googleMapsUri") or payload.get("google_maps_uri"),
            }
        )

    def to_canonical_upsert(self) -> "CanonicalPlaceUpsert":
        return CanonicalPlaceUpsert(
            placeId=str(uuid5(PAWMAP_PLACE_NAMESPACE, f"google_places:{self.googlePlaceId}")),
            googlePlaceId=self.googlePlaceId,
            name=self.displayName,
            formattedAddress=self.formattedAddress,
            lat=round(self.lat, 6),
            lng=round(self.lng, 6),
            category=normalize_google_primary_type(self.primaryType),
            websiteUrl=str(self.websiteUri) if self.websiteUri else None,
            providerUrl=str(self.googleMapsUri) if self.googleMapsUri else None,
        )


class CanonicalPlaceUpsert(BaseModel):
    placeId: str
    googlePlaceId: str
    name: str
    formattedAddress: str
    lat: float
    lng: float
    category: str | None = None
    websiteUrl: str | None = None
    providerUrl: str | None = None


@dataclass(frozen=True)
class GoogleIngestResult:
    total: int
    inserted: int
    updated: int
    place_ids: list[str]


def normalize_google_primary_type(primary_type: str | None) -> str | None:
    if not primary_type:
        return None
    lowered = primary_type.strip().lower()
    return _GOOGLE_CATEGORY_MAP.get(lowered, lowered.replace("_", "-"))


def normalize_google_places_payload(payload: list[dict[str, Any]]) -> list[CanonicalPlaceUpsert]:
    seen: dict[str, CanonicalPlaceUpsert] = {}
    for item in payload:
        candidate = GooglePlaceCandidate.from_google_payload(item)
        seen[candidate.googlePlaceId] = candidate.to_canonical_upsert()
    return list(seen.values())


def build_geography_seed_manifest(*, slug: str, source_file: str, records: list[CanonicalPlaceUpsert]) -> dict[str, Any]:
    fingerprint_source = "|".join(sorted(record.googlePlaceId for record in records))
    return {
        "slug": slug,
        "provider": GOOGLE_PROVIDER,
        "sourceFile": source_file,
        "count": len(records),
        "fingerprint": sha1(fingerprint_source.encode("utf-8")).hexdigest(),
        "placeIds": [record.placeId for record in records],
    }
