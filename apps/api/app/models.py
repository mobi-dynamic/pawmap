from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator


class DogPolicyStatus(str, Enum):
    ALLOWED = "allowed"
    RESTRICTED = "restricted"
    NOT_ALLOWED = "not_allowed"
    UNKNOWN = "unknown"


class VerificationSourceType(str, Enum):
    OFFICIAL_WEBSITE = "official_website"
    DIRECT_CONTACT = "direct_contact"
    USER_REPORT = "user_report"
    ONSITE_SIGNAGE = "onsite_signage"
    THIRD_PARTY_LISTING = "third_party_listing"
    OTHER = "other"


class ReportStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApiErrorDetail(BaseModel):
    code: str
    message: str


class ApiErrorResponse(BaseModel):
    error: ApiErrorDetail


class PetRules(BaseModel):
    dogPolicyStatus: DogPolicyStatus
    indoorAllowed: bool | None = None
    outdoorAllowed: bool | None = None
    leashRequired: bool | None = None
    sizeRestriction: str | None = None
    breedRestriction: str | None = None
    serviceDogOnly: bool | None = None
    notes: str | None = None
    confidenceScore: int = Field(ge=0, le=100)
    verificationSourceType: VerificationSourceType
    verificationSourceUrl: HttpUrl | None = None
    verifiedAt: datetime | None = None


class PlaceSummary(BaseModel):
    id: str
    googlePlaceId: str
    name: str
    formattedAddress: str
    lat: float
    lng: float
    category: str | None = None
    dogPolicyStatus: DogPolicyStatus
    confidenceScore: int = Field(ge=0, le=100)
    verifiedAt: datetime | None = None


class PlaceDetail(PlaceSummary):
    websiteUrl: HttpUrl | None = None
    petRules: PetRules


class PlaceSearchResponse(BaseModel):
    items: list[PlaceSummary]


class ResolveGooglePlaceResponse(BaseModel):
    placeId: str
    googlePlaceId: str
    status: str = "resolved"


class ReportCreateRequest(BaseModel):
    placeId: str
    proposedDogPolicyStatus: DogPolicyStatus | None = None
    proposedIndoorAllowed: bool | None = None
    proposedOutdoorAllowed: bool | None = None
    proposedLeashRequired: bool | None = None
    proposedSizeRestriction: str | None = None
    proposedBreedRestriction: str | None = None
    proposedServiceDogOnly: bool | None = None
    proposedNotes: str | None = None
    evidenceUrl: HttpUrl | None = None
    reporterComment: str | None = None

    @model_validator(mode="after")
    def ensure_any_proposed_value(self) -> "ReportCreateRequest":
        payload = self.model_dump(exclude={"placeId"}, exclude_none=True)
        if not payload:
            raise ValueError("At least one proposed field, note, evidence URL, or comment is required.")
        return self


class ReportResponse(BaseModel):
    id: str
    placeId: str
    status: ReportStatus
    reporterUserId: str
    createdAt: datetime


class AdminReportRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    placeId: str
    status: ReportStatus
    reporterUserId: str
    proposedDogPolicyStatus: DogPolicyStatus | None = None
    proposedIndoorAllowed: bool | None = None
    proposedOutdoorAllowed: bool | None = None
    proposedLeashRequired: bool | None = None
    proposedSizeRestriction: str | None = None
    proposedBreedRestriction: str | None = None
    proposedServiceDogOnly: bool | None = None
    proposedNotes: str | None = None
    evidenceUrl: HttpUrl | None = None
    reporterComment: str | None = None
    reviewNotes: str | None = None
    reviewedByUserId: str | None = None
    createdAt: datetime
    reviewedAt: datetime | None = None


class AdminReportsResponse(BaseModel):
    items: list[AdminReportRecord]
    nextCursor: str | None = None


class RejectReportRequest(BaseModel):
    reviewNotes: str = Field(min_length=3, max_length=1000)


class ModerationActionResponse(BaseModel):
    id: str
    status: ReportStatus
    reviewedAt: datetime
    reviewedByUserId: str


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "pawmap-api"
    provider: str = "google_places"
    timestamp: datetime

    @field_validator("timestamp", mode="before")
    @classmethod
    def default_timestamp(cls, value: datetime | None) -> datetime:
        return value or datetime.now(timezone.utc)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def serialize_report_payload(payload: ReportCreateRequest, report_id: str, reporter_user_id: str) -> dict[str, Any]:
    data = payload.model_dump(mode="json", exclude_none=True)
    return {
        "id": report_id,
        "placeId": payload.placeId,
        "status": ReportStatus.PENDING,
        "reporterUserId": reporter_user_id,
        "createdAt": utcnow(),
        **data,
    }
