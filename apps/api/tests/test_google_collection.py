from __future__ import annotations

import json
from pathlib import Path

from app.db import collect_google_places, load_google_seed_file
from app.google_collection import FixtureGooglePlacesCollector, collect_google_launch_snapshot
from app.google_ingestion import normalize_google_places_payload


FIXTURE_ROOT = Path(__file__).resolve().parents[1] / "data/google/collection-fixtures"


def test_fixture_google_collector_reads_launch_category_payloads() -> None:
    collector = FixtureGooglePlacesCollector(FIXTURE_ROOT)
    snapshot = collect_google_launch_snapshot("melbourne-fitzroy", collector)

    assert snapshot["geographySlug"] == "melbourne-fitzroy"
    assert snapshot["summary"] == {
        "queryCount": 3,
        "rawPlaceCount": 5,
        "uniquePlaceCount": 4,
    }
    assert [query["query_key"] for query in snapshot["queries"]] == ["cafe", "restaurant", "park"]
    assert {place["id"] for place in snapshot["places"]} == {
        "ChIJ-fitzy-cafe",
        "ChIJ-pawsome-diner",
        "ChIJ-courtyard-bistro",
        "ChIJ-fitzroy-gardens",
    }


def test_collect_google_places_writes_reusable_snapshot_file(tmp_path: Path) -> None:
    out_file = tmp_path / "melbourne-fitzroy-collected.json"

    summary = collect_google_places(
        geography_slug="melbourne-fitzroy",
        out_file=out_file,
        fixture_dir=FIXTURE_ROOT,
    )

    assert summary["mode"] == "fixture"
    assert summary["outFile"] == str(out_file)
    written = json.loads(out_file.read_text())
    assert written["summary"]["uniquePlaceCount"] == 4

    loaded_places = load_google_seed_file(out_file)
    canonical_records = normalize_google_places_payload(loaded_places)
    assert len(canonical_records) == 4
    assert canonical_records[0].placeId
