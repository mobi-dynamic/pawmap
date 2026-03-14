from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.responses import JSONResponse

from .models import (
    AdminReportsResponse,
    ApiErrorResponse,
    DogPolicyStatus,
    HealthResponse,
    ModerationActionResponse,
    PetRules,
    PlaceDetail,
    PlaceSearchResponse,
    RejectReportRequest,
    ReportCreateRequest,
    ReportResponse,
    ReportStatus,
    ResolveGooglePlaceResponse,
    utcnow,
)
from .repository import Repository, get_repository

app = FastAPI(
    title="PawMap API",
    version="0.1.0",
    description="MVP backend scaffold aligned to the confirmed PawMap product decisions.",
)


RepoDep = Annotated[Repository, Depends(get_repository)]


def _parse_authenticated_user_id(x_user_id: str | None) -> str:
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_REQUIRED", "message": "Authentication is required for this endpoint."},
        )
    try:
        return str(UUID(x_user_id))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_AUTH_SUBJECT", "message": "Authenticated user id must be a valid UUID."},
        ) from exc


def require_user_id(x_user_id: Annotated[str | None, Header(alias="X-User-Id")] = None) -> str:
    return _parse_authenticated_user_id(x_user_id)


def require_admin(
    x_user_id: Annotated[str | None, Header(alias="X-User-Id")] = None,
    x_role: Annotated[str | None, Header(alias="X-Role")] = None,
) -> str:
    user_id = _parse_authenticated_user_id(x_user_id)
    if x_role not in {"admin", "moderator"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ADMIN_REQUIRED", "message": "Moderator or admin role is required."},
        )
    return user_id


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and {"code", "message"}.issubset(detail.keys()):
        return JSONResponse(status_code=exc.status_code, content={"error": detail}, headers=exc.headers)
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": "HTTP_ERROR", "message": str(detail)}})


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(timestamp=utcnow())


@app.get("/places/search", response_model=PlaceSearchResponse)
def search_places(
    q: Annotated[str, Query(min_length=2)],
    repository: RepoDep,
    lat: float | None = None,
    lng: float | None = None,
    radiusMeters: Annotated[int, Query(gt=0, le=20000)] = 5000,
    limit: Annotated[int, Query(gt=0, le=50)] = 20,
) -> PlaceSearchResponse:
    del lat, lng, radiusMeters
    return PlaceSearchResponse(items=repository.search_places(query=q, limit=limit))


@app.get("/places/nearby", response_model=PlaceSearchResponse)
def nearby_places(
    lat: float,
    lng: float,
    repository: RepoDep,
    radiusMeters: Annotated[int, Query(gt=0, le=20000)] = 2000,
    limit: Annotated[int, Query(gt=0, le=100)] = 50,
    dogPolicyStatus: DogPolicyStatus | None = None,
) -> PlaceSearchResponse:
    return PlaceSearchResponse(
        items=repository.nearby_places(
            lat=lat,
            lng=lng,
            radius_meters=radiusMeters,
            limit=limit,
            dog_policy_status=dogPolicyStatus,
        )
    )


@app.get(
    "/places/resolve/google/{googlePlaceId}",
    response_model=ResolveGooglePlaceResponse,
    responses={404: {"model": ApiErrorResponse}},
)
def resolve_google_place(googlePlaceId: str, repository: RepoDep) -> ResolveGooglePlaceResponse:
    resolved = repository.resolve_google_place(googlePlaceId)
    if resolved is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PLACE_CACHE_MISS", "message": "Google place is not cached in PawMap yet."},
        )
    return resolved


@app.get("/places/{placeId}", response_model=PlaceDetail, responses={404: {"model": ApiErrorResponse}})
def get_place(placeId: str, repository: RepoDep) -> PlaceDetail:
    place = repository.get_place(placeId)
    if place is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PLACE_NOT_FOUND", "message": "Place was not found."},
        )
    return place


@app.get("/places/{placeId}/pet-rules", response_model=PetRules, responses={404: {"model": ApiErrorResponse}})
def get_pet_rules(placeId: str, repository: RepoDep) -> PetRules:
    place = repository.get_place(placeId)
    if place is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PLACE_NOT_FOUND", "message": "Place was not found."},
        )
    return place.petRules


@app.post(
    "/reports",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    responses={401: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
)
def create_report(
    payload: ReportCreateRequest,
    user_id: Annotated[str, Depends(require_user_id)],
    repository: RepoDep,
) -> ReportResponse:
    if repository.get_place(payload.placeId) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PLACE_NOT_FOUND", "message": "Place was not found."},
        )
    return repository.create_report(payload, reporter_user_id=user_id)


@app.get(
    "/admin/reports",
    response_model=AdminReportsResponse,
    responses={401: {"model": ApiErrorResponse}, 403: {"model": ApiErrorResponse}},
)
def list_reports(
    admin_user_id: Annotated[str, Depends(require_admin)],
    repository: RepoDep,
    status_filter: Annotated[ReportStatus | None, Query(alias="status")] = None,
    limit: Annotated[int, Query(gt=0, le=100)] = 20,
    cursor: str | None = None,
) -> AdminReportsResponse:
    del admin_user_id, cursor
    return AdminReportsResponse(items=repository.list_reports(status=status_filter, limit=limit))


@app.post(
    "/admin/reports/{reportId}/approve",
    response_model=ModerationActionResponse,
    responses={401: {"model": ApiErrorResponse}, 403: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
)
def approve_report(
    reportId: str,
    admin_user_id: Annotated[str, Depends(require_admin)],
    repository: RepoDep,
) -> ModerationActionResponse:
    report = repository.approve_report(reportId, reviewer_user_id=admin_user_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "REPORT_NOT_FOUND", "message": "Report was not found."},
        )
    return ModerationActionResponse(
        id=report.id,
        status=report.status,
        reviewedAt=report.reviewedAt or utcnow(),
        reviewedByUserId=report.reviewedByUserId or admin_user_id,
    )


@app.post(
    "/admin/reports/{reportId}/reject",
    response_model=ModerationActionResponse,
    responses={401: {"model": ApiErrorResponse}, 403: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
)
def reject_report(
    reportId: str,
    payload: RejectReportRequest,
    admin_user_id: Annotated[str, Depends(require_admin)],
    repository: RepoDep,
) -> ModerationActionResponse:
    report = repository.reject_report(reportId, reviewer_user_id=admin_user_id, payload=payload)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "REPORT_NOT_FOUND", "message": "Report was not found."},
        )
    return ModerationActionResponse(
        id=report.id,
        status=report.status,
        reviewedAt=report.reviewedAt or utcnow(),
        reviewedByUserId=report.reviewedByUserId or admin_user_id,
    )
