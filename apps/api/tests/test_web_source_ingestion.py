from __future__ import annotations

from app.models import PolicyTrustLevel
from app.web_source_ingestion import build_pawmap_record, extract_facts, extract_web_source_record


def test_extract_facts_finds_off_leash_and_registration_and_hours() -> None:
    text = """
    Kingston City Council says dogs must be registered.
    Off-leash areas are available between 6:00 am and 9:00 pm.
    """.strip()

    facts = extract_facts(text)

    assert [fact.fact_type for fact in facts] == ["off_leash_policy", "registration_requirement", "hours"]
    assert facts[0].value == "mentioned"
    assert facts[1].value is True
    assert facts[2].value == "6:00 am"


def test_build_pawmap_record_uses_verified_trust_for_gov_source() -> None:
    record = build_pawmap_record(
        url="https://www.kingston.vic.gov.au/services/pets/dog-ownership",
        title="Dog ownership",
        text="Dogs must be registered. Off-leash areas are listed here.",
        facts=extract_facts("Dogs must be registered. Off-leash areas are listed here."),
        jurisdiction="Kingston City Council",
        trust=PolicyTrustLevel.VERIFIED,
    )

    assert record["source"]["trust"] == "verified"
    assert record["jurisdiction"] == "Kingston City Council"
    assert record["policy"]["offLeash"] == "mentioned"


def test_extract_web_source_record_builds_a_pawmap_payload() -> None:
    result = extract_web_source_record(
        "https://www.kingston.vic.gov.au/services/pets/dog-ownership",
        raw_text="Kingston City Council dogs must be registered. Off-leash area available.",
        title="Dog ownership",
    )

    assert result.sourceType == "municipal_webpage"
    assert result.trust == "verified"
    assert result.jurisdiction == "Kingston City Council"
    assert result.pawMapRecord["source"]["url"].startswith("https://www.kingston.vic.gov.au")
