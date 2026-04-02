from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Protocol
from urllib import error, request

from .env import load_local_env

load_local_env()

GOOGLE_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
_GOOGLE_FIELD_MASK = ",".join(
    [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.primaryType",
        "places.websiteUri",
        "places.googleMapsUri",
    ]
)


@dataclass(frozen=True)
class GeographyCircle:
    lat: float
    lng: float
    radius_meters: int


@dataclass(frozen=True)
class GoogleCollectionQuery:
    key: str
    text_query: str
    page_size: int = 10


@dataclass(frozen=True)
class LaunchGeographyPlan:
    slug: str
    name: str
    circle: GeographyCircle
    queries: tuple[GoogleCollectionQuery, ...]


@dataclass(frozen=True)
class GoogleCollectionBatch:
    query_key: str
    text_query: str
    count: int
    place_ids: list[str]


class GooglePlacesCollector(Protocol):
    def search_text(self, plan: LaunchGeographyPlan, query: GoogleCollectionQuery) -> list[dict[str, Any]]: ...


class FixtureGooglePlacesCollector:
    def __init__(self, fixture_dir: Path) -> None:
        self._fixture_dir = fixture_dir

    def search_text(self, plan: LaunchGeographyPlan, query: GoogleCollectionQuery) -> list[dict[str, Any]]:
        fixture_path = self._fixture_dir / plan.slug / f"{query.key}.json"
        if not fixture_path.exists():
            raise FileNotFoundError(f"Missing Google fixture for {plan.slug}/{query.key}: {fixture_path}")

        payload = json.loads(fixture_path.read_text())
        if isinstance(payload, list):
            return payload
        if isinstance(payload, dict) and isinstance(payload.get("places"), list):
            return payload["places"]
        raise ValueError(f"Unsupported Google collection fixture format: {fixture_path}")


class LiveGooglePlacesCollector:
    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    def search_text(self, plan: LaunchGeographyPlan, query: GoogleCollectionQuery) -> list[dict[str, Any]]:
        payload = {
            "textQuery": query.text_query,
            "pageSize": query.page_size,
            "locationBias": {
                "circle": {
                    "center": {"latitude": plan.circle.lat, "longitude": plan.circle.lng},
                    "radius": float(plan.circle.radius_meters),
                }
            },
        }
        req = request.Request(
            GOOGLE_TEXT_SEARCH_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": self._api_key,
                "X-Goog-FieldMask": _GOOGLE_FIELD_MASK,
            },
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=20) as response:
                body = json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:  # pragma: no cover - exercised only with live API access
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Google Places text search failed ({exc.code}): {detail}") from exc
        except error.URLError as exc:  # pragma: no cover - exercised only with live API access
            raise RuntimeError(f"Google Places text search failed: {exc.reason}") from exc

        places = body.get("places")
        if not isinstance(places, list):
            raise RuntimeError("Google Places text search response did not include a 'places' list")
        return places


_LAUNCH_GEOGRAPHIES: dict[str, LaunchGeographyPlan] = {
    "melbourne-fitzroy": LaunchGeographyPlan(
        slug="melbourne-fitzroy",
        name="Melbourne Fitzroy launch slice",
        circle=GeographyCircle(lat=-37.7989, lng=144.9784, radius_meters=1800),
        queries=(
            GoogleCollectionQuery(key="cafe", text_query="dog friendly cafe in Fitzroy Melbourne", page_size=10),
            GoogleCollectionQuery(key="restaurant", text_query="restaurant with outdoor seating in Fitzroy Melbourne", page_size=10),
            GoogleCollectionQuery(key="park", text_query="dog park in Fitzroy Melbourne", page_size=10),
        ),
    ),
    "melbourne-cheltenham": LaunchGeographyPlan(
        slug="melbourne-cheltenham",
        name="Melbourne Cheltenham launch slice",
        circle=GeographyCircle(lat=-37.9695, lng=145.0544, radius_meters=2200),
        queries=(
            GoogleCollectionQuery(key="cafe", text_query="dog friendly cafe in Cheltenham Melbourne", page_size=10),
            GoogleCollectionQuery(key="restaurant", text_query="restaurant with outdoor seating in Cheltenham Melbourne", page_size=10),
            GoogleCollectionQuery(key="park", text_query="dog park in Cheltenham Melbourne", page_size=10),
        ),
    ),
    "melbourne-mentone": LaunchGeographyPlan(
        slug="melbourne-mentone",
        name="Melbourne Mentone launch slice",
        circle=GeographyCircle(lat=-37.9826, lng=145.0677, radius_meters=2200),
        queries=(
            GoogleCollectionQuery(key="cafe", text_query="dog friendly cafe in Mentone Melbourne", page_size=10),
            GoogleCollectionQuery(key="restaurant", text_query="restaurant with outdoor seating in Mentone Melbourne", page_size=10),
            GoogleCollectionQuery(key="park", text_query="dog park in Mentone Melbourne", page_size=10),
        ),
    ),
    "melbourne-parkdale": LaunchGeographyPlan(
        slug="melbourne-parkdale",
        name="Melbourne Parkdale launch slice",
        circle=GeographyCircle(lat=-37.9915, lng=145.0816, radius_meters=2200),
        queries=(
            GoogleCollectionQuery(key="cafe", text_query="dog friendly cafe in Parkdale Melbourne", page_size=10),
            GoogleCollectionQuery(key="restaurant", text_query="restaurant with outdoor seating in Parkdale Melbourne", page_size=10),
            GoogleCollectionQuery(key="park", text_query="dog park in Parkdale Melbourne", page_size=10),
        ),
    ),
    "melbourne-highett": LaunchGeographyPlan(
        slug="melbourne-highett",
        name="Melbourne Highett launch slice",
        circle=GeographyCircle(lat=-37.9472, lng=145.0352, radius_meters=2200),
        queries=(
            GoogleCollectionQuery(key="cafe", text_query="dog friendly cafe in Highett Melbourne", page_size=10),
            GoogleCollectionQuery(key="restaurant", text_query="restaurant with outdoor seating in Highett Melbourne", page_size=10),
            GoogleCollectionQuery(key="park", text_query="dog park in Highett Melbourne", page_size=10),
        ),
    ),
    "melbourne-sandringham": LaunchGeographyPlan(
        slug="melbourne-sandringham",
        name="Melbourne Sandringham launch slice",
        circle=GeographyCircle(lat=-37.9528, lng=145.0108, radius_meters=2200),
        queries=(
            GoogleCollectionQuery(key="cafe", text_query="dog friendly cafe in Sandringham Melbourne", page_size=10),
            GoogleCollectionQuery(key="restaurant", text_query="restaurant with outdoor seating in Sandringham Melbourne", page_size=10),
            GoogleCollectionQuery(key="park", text_query="dog park in Sandringham Melbourne", page_size=10),
        ),
    ),
    "melbourne-beaumaris": LaunchGeographyPlan(
        slug="melbourne-beaumaris",
        name="Melbourne Beaumaris launch slice",
        circle=GeographyCircle(lat=-37.9869, lng=145.0357, radius_meters=2200),
        queries=(
            GoogleCollectionQuery(key="cafe", text_query="dog friendly cafe in Beaumaris Melbourne", page_size=10),
            GoogleCollectionQuery(key="restaurant", text_query="restaurant with outdoor seating in Beaumaris Melbourne", page_size=10),
            GoogleCollectionQuery(key="park", text_query="dog park in Beaumaris Melbourne", page_size=10),
        ),
    ),
}


def get_launch_geography_plan(geography_slug: str) -> LaunchGeographyPlan:
    try:
        return _LAUNCH_GEOGRAPHIES[geography_slug]
    except KeyError as exc:
        raise ValueError(f"Unsupported launch geography slug: {geography_slug}") from exc


def default_collection_output_path(geography_slug: str) -> Path:
    return Path("data/google/collections") / f"{geography_slug}.json"


def collect_google_launch_snapshot(
    geography_slug: str,
    collector: GooglePlacesCollector,
) -> dict[str, Any]:
    plan = get_launch_geography_plan(geography_slug)
    deduped_places: dict[str, dict[str, Any]] = {}
    batches: list[GoogleCollectionBatch] = []

    for query in plan.queries:
        places = collector.search_text(plan, query)
        place_ids: list[str] = []
        for place in places:
            place_id = str(place.get("id") or place.get("name") or "").removeprefix("places/")
            if not place_id:
                continue
            normalized = dict(place)
            normalized["id"] = place_id
            deduped_places[place_id] = normalized
            place_ids.append(place_id)
        batches.append(
            GoogleCollectionBatch(
                query_key=query.key,
                text_query=query.text_query,
                count=len(place_ids),
                place_ids=place_ids,
            )
        )

    return {
        "geographySlug": plan.slug,
        "geographyName": plan.name,
        "collectionMode": "google_text_search",
        "circle": asdict(plan.circle),
        "queries": [asdict(batch) for batch in batches],
        "places": list(deduped_places.values()),
        "summary": {
            "queryCount": len(plan.queries),
            "rawPlaceCount": sum(batch.count for batch in batches),
            "uniquePlaceCount": len(deduped_places),
        },
    }


def write_google_collection_snapshot(path: Path, snapshot: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(snapshot, indent=2) + "\n")


def build_google_places_collector(*, fixture_dir: Path | None = None) -> tuple[str, GooglePlacesCollector]:
    if fixture_dir is not None:
        return "fixture", FixtureGooglePlacesCollector(fixture_dir)

    api_key = os.getenv("GOOGLE_PLACES_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY")
    if api_key:
        return "live", LiveGooglePlacesCollector(api_key)

    raise RuntimeError(
        "Google collection requires either --fixture-dir or GOOGLE_PLACES_API_KEY / GOOGLE_MAPS_API_KEY"
    )
