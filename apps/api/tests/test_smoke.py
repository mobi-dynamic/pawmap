from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.repository import InMemoryRepository, get_repository


def make_client() -> tuple[TestClient, InMemoryRepository]:
    repository = InMemoryRepository()
    app.dependency_overrides[get_repository] = lambda: repository
    return TestClient(app), repository


def teardown_function() -> None:
    app.dependency_overrides.clear()


def test_report_submission_requires_authentication() -> None:
    client, _ = make_client()

    response = client.post(
        "/reports",
        json={
            "placeId": "plc_puppy_cafe",
            "proposedDogPolicyStatus": "allowed",
            "reporterComment": "Saw dogs inside.",
        },
    )

    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "AUTH_REQUIRED",
            "message": "Authentication is required for this endpoint.",
        }
    }


def test_report_submission_rejects_non_uuid_authenticated_user() -> None:
    client, _ = make_client()

    response = client.post(
        "/reports",
        headers={"X-User-Id": "user-123"},
        json={
            "placeId": "plc_puppy_cafe",
            "proposedDogPolicyStatus": "allowed",
        },
    )

    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "INVALID_AUTH_SUBJECT",
            "message": "Authenticated user id must be a valid UUID.",
        }
    }


def test_report_submission_and_moderation_flow_updates_place_rules() -> None:
    client, _ = make_client()

    create_response = client.post(
        "/reports",
        headers={"X-User-Id": "6d2d3fba-8f38-4b18-bd43-5a1d85fce112"},
        json={
            "placeId": "plc_puppy_cafe",
            "proposedDogPolicyStatus": "allowed",
            "proposedIndoorAllowed": True,
            "proposedOutdoorAllowed": True,
            "reporterComment": "Venue confirmed dogs are welcome inside.",
        },
    )

    assert create_response.status_code == 201
    report_id = create_response.json()["id"]

    list_response = client.get(
        "/admin/reports",
        headers={"X-User-Id": "33333333-3333-3333-3333-333333333333", "X-Role": "moderator"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["items"][0]["id"] == report_id
    assert list_response.json()["items"][0]["status"] == "submitted"

    approve_response = client.post(
        f"/admin/reports/{report_id}/approve",
        headers={"X-User-Id": "33333333-3333-3333-3333-333333333333", "X-Role": "moderator"},
    )
    assert approve_response.status_code == 200
    assert approve_response.json()["status"] == "approved"

    place_response = client.get("/places/plc_puppy_cafe")
    assert place_response.status_code == 200
    payload = place_response.json()
    assert payload["dogPolicyStatus"] == "allowed"
    assert payload["petRules"]["dogPolicyStatus"] == "allowed"
    assert payload["petRules"]["indoorAllowed"] is True
    assert payload["petRules"]["verificationSourceType"] == "user_report"


def test_google_place_resolve_returns_explicit_cache_miss() -> None:
    client, _ = make_client()

    response = client.get("/places/resolve/google/ChIJ-missing-place")

    assert response.status_code == 404
    assert response.json() == {
        "error": {
            "code": "PLACE_CACHE_MISS",
            "message": "Google place is not cached in PawMap yet.",
        }
    }


def test_google_place_resolve_returns_canonical_place_when_cached() -> None:
    client, _ = make_client()

    response = client.get("/places/resolve/google/ChIJ-puppy-cafe")

    assert response.status_code == 200
    assert response.json() == {
        "placeId": "plc_puppy_cafe",
        "googlePlaceId": "ChIJ-puppy-cafe",
        "status": "resolved",
    }
