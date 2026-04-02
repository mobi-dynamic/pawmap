from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from textwrap import dedent

import psycopg

from .env import load_local_env
from .google_collection import (
    build_google_places_collector,
    collect_google_launch_snapshot,
    default_collection_output_path,
    write_google_collection_snapshot,
)
from .google_ingestion import build_geography_seed_manifest, normalize_google_places_payload
from .repository import PostgresRepository

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"

DEV_PLACE_ID = "11111111-1111-1111-1111-111111111111"
DEV_REPORTER_ID = "22222222-2222-2222-2222-222222222222"
DEV_REVIEWER_ID = "33333333-3333-3333-3333-333333333333"
DEV_GOOGLE_PLACE_ID = "ChIJ-puppy-cafe"

load_local_env()


def require_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL is required for DB bootstrap commands.")
    return database_url


def migration_files() -> list[Path]:
    return sorted(MIGRATIONS_DIR.glob("*.sql"))


def apply_migrations(database_url: str) -> list[str]:
    applied: list[str] = []
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                create table if not exists schema_migrations (
                  filename text primary key,
                  applied_at timestamptz not null default now()
                )
                """
            )
            cur.execute("select filename from schema_migrations")
            already_applied = {row[0] for row in cur.fetchall()}

            for path in migration_files():
                if path.name in already_applied:
                    continue
                cur.execute(path.read_text())
                cur.execute("insert into schema_migrations (filename) values (%s)", (path.name,))
                applied.append(path.name)
        conn.commit()
    return applied


def seed_dev_data(database_url: str) -> None:
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                dedent(
                    """
                    insert into places (
                      id, name, formatted_address, lat, lng, category, website_url
                    ) values (
                      %(id)s, %(name)s, %(formatted_address)s, %(lat)s, %(lng)s, %(category)s, %(website_url)s
                    )
                    on conflict (id) do update set
                      name = excluded.name,
                      formatted_address = excluded.formatted_address,
                      lat = excluded.lat,
                      lng = excluded.lng,
                      category = excluded.category,
                      website_url = excluded.website_url,
                      updated_at = now()
                    """
                ),
                {
                    "id": DEV_PLACE_ID,
                    "name": "Puppy Cafe",
                    "formatted_address": "123 Smith St, Fitzroy VIC",
                    "lat": -37.798,
                    "lng": 144.978,
                    "category": "cafe",
                    "website_url": "https://example.com",
                },
            )
            cur.execute(
                dedent(
                    """
                    insert into place_provider_refs (
                      place_id, provider, provider_place_id, provider_url, last_synced_at
                    ) values (
                      %(place_id)s, 'google_places', %(provider_place_id)s, %(provider_url)s, now()
                    )
                    on conflict (provider, provider_place_id) do update set
                      place_id = excluded.place_id,
                      provider_url = excluded.provider_url,
                      last_synced_at = excluded.last_synced_at
                    """
                ),
                {
                    "place_id": DEV_PLACE_ID,
                    "provider_place_id": DEV_GOOGLE_PLACE_ID,
                    "provider_url": "https://maps.google.com/?cid=pawmap-dev-sample",
                },
            )
            cur.execute(
                dedent(
                    """
                    insert into pet_rules (
                      place_id,
                      dog_policy_status,
                      indoor_allowed,
                      outdoor_allowed,
                      leash_required,
                      size_restriction,
                      breed_restriction,
                      service_dog_only,
                      notes,
                      confidence_score,
                      verification_source_type,
                      verification_source_url,
                      verified_at
                    ) values (
                      %(place_id)s,
                      %(dog_policy_status)s,
                      %(indoor_allowed)s,
                      %(outdoor_allowed)s,
                      %(leash_required)s,
                      %(size_restriction)s,
                      %(breed_restriction)s,
                      %(service_dog_only)s,
                      %(notes)s,
                      %(confidence_score)s,
                      %(verification_source_type)s,
                      %(verification_source_url)s,
                      %(verified_at)s
                    )
                    on conflict (place_id) do update set
                      dog_policy_status = excluded.dog_policy_status,
                      indoor_allowed = excluded.indoor_allowed,
                      outdoor_allowed = excluded.outdoor_allowed,
                      leash_required = excluded.leash_required,
                      size_restriction = excluded.size_restriction,
                      breed_restriction = excluded.breed_restriction,
                      service_dog_only = excluded.service_dog_only,
                      notes = excluded.notes,
                      confidence_score = excluded.confidence_score,
                      verification_source_type = excluded.verification_source_type,
                      verification_source_url = excluded.verification_source_url,
                      verified_at = excluded.verified_at,
                      updated_at = now()
                    """
                ),
                {
                    "place_id": DEV_PLACE_ID,
                    "dog_policy_status": "restricted",
                    "indoor_allowed": False,
                    "outdoor_allowed": True,
                    "leash_required": True,
                    "size_restriction": "Small dogs preferred",
                    "breed_restriction": None,
                    "service_dog_only": False,
                    "notes": "Dogs allowed in courtyard only.",
                    "confidence_score": 82,
                    "verification_source_type": "official_website",
                    "verification_source_url": "https://example.com/policy",
                    "verified_at": "2026-03-10T09:00:00Z",
                },
            )
        conn.commit()


def load_google_seed_file(path: Path) -> list[dict]:
    payload = json.loads(path.read_text())
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict) and isinstance(payload.get("places"), list):
        return payload["places"]
    raise SystemExit(f"Unsupported Google seed file format: {path}")


def ingest_google_seed_file(database_url: str, seed_file: Path, geography_slug: str) -> dict[str, object]:
    repository = PostgresRepository(database_url)
    records = normalize_google_places_payload(load_google_seed_file(seed_file))
    result = repository.upsert_google_places(records)
    manifest = build_geography_seed_manifest(slug=geography_slug, source_file=str(seed_file), records=records)
    return {
        "seedFile": str(seed_file),
        "geographySlug": geography_slug,
        "ingest": {
            "total": result.total,
            "inserted": result.inserted,
            "updated": result.updated,
            "placeIds": result.place_ids,
        },
        "manifest": manifest,
    }


def collect_google_places(
    *,
    geography_slug: str,
    out_file: Path | None = None,
    fixture_dir: Path | None = None,
) -> dict[str, object]:
    mode, collector = build_google_places_collector(fixture_dir=fixture_dir)
    snapshot = collect_google_launch_snapshot(geography_slug, collector)
    output_path = out_file or default_collection_output_path(geography_slug)
    write_google_collection_snapshot(output_path, snapshot)
    return {
        "mode": mode,
        "geographySlug": geography_slug,
        "outFile": str(output_path),
        "summary": snapshot["summary"],
        "queries": snapshot["queries"],
    }


def collect_and_ingest_google_places(
    database_url: str,
    *,
    geography_slug: str,
    out_file: Path | None = None,
    fixture_dir: Path | None = None,
) -> dict[str, object]:
    collected = collect_google_places(geography_slug=geography_slug, out_file=out_file, fixture_dir=fixture_dir)
    ingest_summary = ingest_google_seed_file(database_url, Path(str(collected["outFile"])), geography_slug)
    return {
        **collected,
        "ingest": ingest_summary["ingest"],
        "manifest": ingest_summary["manifest"],
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="PawMap local database helpers")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("migrate", help="Apply SQL migrations from migrations/")
    subparsers.add_parser("seed", help="Seed a small local-dev dataset")

    bootstrap = subparsers.add_parser("bootstrap", help="Apply migrations, then seed dev data")
    bootstrap.add_argument("--skip-seed", action="store_true", help="Only apply migrations")

    ingest = subparsers.add_parser("ingest-google", help="Normalize a Google places JSON file and upsert canonical places")
    ingest.add_argument("seed_file", type=Path, help="Path to a JSON file containing Google place payloads")
    ingest.add_argument("--geography-slug", required=True, help="Stable metro/area slug for task tracking, e.g. melbourne-fitzroy")

    collect = subparsers.add_parser(
        "collect-google",
        help="Collect Google Places candidates for a launch geography and optionally feed them into canonical ingest",
    )
    collect.add_argument("--geography-slug", required=True, help="Stable metro/area slug for collection, e.g. melbourne-fitzroy")
    collect.add_argument("--out-file", type=Path, help="Where to write the collected Google payload snapshot")
    collect.add_argument(
        "--fixture-dir",
        type=Path,
        help="Optional fixture root for deterministic collection tests, e.g. data/google/collection-fixtures",
    )
    collect.add_argument("--ingest", action="store_true", help="Immediately feed the collected snapshot into canonical upsert")

    return parser


def main() -> None:
    args = build_parser().parse_args()

    if args.command == "collect-google":
        if args.ingest:
            database_url = require_database_url()
            summary = collect_and_ingest_google_places(
                database_url,
                geography_slug=args.geography_slug,
                out_file=args.out_file,
                fixture_dir=args.fixture_dir,
            )
        else:
            summary = collect_google_places(
                geography_slug=args.geography_slug,
                out_file=args.out_file,
                fixture_dir=args.fixture_dir,
            )
        print(json.dumps(summary, indent=2))
        return

    database_url = require_database_url()

    if args.command == "migrate":
        applied = apply_migrations(database_url)
        print(f"Applied migrations: {', '.join(applied) if applied else 'none'}")
        return

    if args.command == "seed":
        seed_dev_data(database_url)
        print(f"Seeded local dev data for place {DEV_PLACE_ID} ({DEV_GOOGLE_PLACE_ID})")
        return

    if args.command == "bootstrap":
        applied = apply_migrations(database_url)
        print(f"Applied migrations: {', '.join(applied) if applied else 'none'}")
        if not args.skip_seed:
            seed_dev_data(database_url)
            print(f"Seeded local dev data for place {DEV_PLACE_ID} ({DEV_GOOGLE_PLACE_ID})")
        return

    if args.command == "ingest-google":
        summary = ingest_google_seed_file(database_url, args.seed_file, args.geography_slug)
        print(json.dumps(summary, indent=2))
        return

    raise SystemExit(f"Unknown command: {args.command}")


if __name__ == "__main__":
    main()
