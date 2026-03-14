from __future__ import annotations

import argparse
import os
from pathlib import Path
from textwrap import dedent

import psycopg

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"

DEV_PLACE_ID = "11111111-1111-1111-1111-111111111111"
DEV_REPORTER_ID = "22222222-2222-2222-2222-222222222222"
DEV_REVIEWER_ID = "33333333-3333-3333-3333-333333333333"
DEV_GOOGLE_PLACE_ID = "ChIJ-puppy-cafe"


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


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="PawMap local database helpers")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("migrate", help="Apply SQL migrations from migrations/")
    subparsers.add_parser("seed", help="Seed a small local-dev dataset")

    bootstrap = subparsers.add_parser("bootstrap", help="Apply migrations, then seed dev data")
    bootstrap.add_argument("--skip-seed", action="store_true", help="Only apply migrations")

    return parser


def main() -> None:
    args = build_parser().parse_args()
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

    raise SystemExit(f"Unknown command: {args.command}")


if __name__ == "__main__":
    main()
