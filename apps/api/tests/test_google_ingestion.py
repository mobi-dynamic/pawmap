from __future__ import annotations

import json
from pathlib import Path

from app.db import load_google_seed_file
from app.google_ingestion import normalize_google_places_payload
from app.repository import InMemoryRepository


def test_normalize_google_places_payload_produces_deterministic_canonical_records() -> None:
    payload = [
        {
            "id": "ChIJ-fitzy-cafe",
            "displayName": {"text": "Fitzy Cafe"},
            "formattedAddress": "77 Brunswick St, Fitzroy VIC 3065",
            "location": {"latitude": -37.7981234, "longitude": 144.9789876},
            "primaryType": "cafe",
            "websiteUri": "https://fitzy.example.com",
            "googleMapsUri": "https://maps.google.com/?cid=fitzy",
        },
        {
            "id": "ChIJ-fitzy-cafe",
            "displayName": {"text": "Fitzy Cafe Renamed"},
            "formattedAddress": "77 Brunswick St, Fitzroy VIC 3065",
            "location": {"latitude": -37.7981234, "longitude": 144.9789876},
            "primaryType": "cafe",
        },
    ]

    records = normalize_google_places_payload(payload)

    assert len(records) == 1
    assert records[0].googlePlaceId == "ChIJ-fitzy-cafe"
    assert records[0].placeId == "fc7d8b27-3ea2-5398-b20f-f7022a8368f4"
    assert records[0].name == "Fitzy Cafe Renamed"
    assert records[0].lat == -37.798123
    assert records[0].lng == 144.978988
    assert records[0].category == "cafe"


def test_inmemory_repository_upserts_google_places_with_unknown_pet_rules() -> None:
    repository = InMemoryRepository()
    records = normalize_google_places_payload(
        [
            {
                "id": "ChIJ-fitzroy-gardens",
                "displayName": {"text": "Fitzroy Gardens Dog Corner"},
                "formattedAddress": "230 Wellington Parade, East Melbourne VIC 3002",
                "location": {"latitude": -37.8136, "longitude": 144.9834},
                "primaryType": "park",
            }
        ]
    )

    result = repository.upsert_google_places(records)

    assert result.total == 1
    assert result.inserted == 1
    assert result.updated == 0
    place = repository.get_place(result.place_ids[0])
    assert place is not None
    assert place.googlePlaceId == "ChIJ-fitzroy-gardens"
    assert place.dogPolicyStatus == "unknown"
    assert place.petRules.verificationSourceType is None


def test_load_google_seed_file_reads_google_places_array() -> None:
    seed_file = Path("data/google/melbourne-fitzroy-sample.json")

    loaded = load_google_seed_file(seed_file)

    assert json.loads(seed_file.read_text())["places"][0]["id"] == loaded[0]["id"]
    assert len(loaded) == 2
