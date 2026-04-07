from __future__ import annotations

from hashlib import sha1

from app.models import PolicyTrustLevel
import app.web_source_ingestion as web_source_ingestion
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


def test_extract_web_source_record_uses_cached_page_before_network(monkeypatch, tmp_path) -> None:
    url = "https://www.kingston.vic.gov.au/services/pets/dog-ownership"
    cache_dir = tmp_path / "web_sources"
    cache_dir.mkdir()
    cache_path = cache_dir / f"{sha1(url.encode('utf-8')).hexdigest()}.json"
    cache_path.write_text(
        '{"title":"Dog ownership - City of Kingston","text":"Dogs must stay on a leash in all public spaces except for designated off leash areas."}'
    )

    monkeypatch.setattr(web_source_ingestion, "WEB_SOURCE_CACHE_DIR", cache_dir)

    def fail_if_called(*_, **__):
        raise AssertionError("network should not be hit when a cached snapshot exists")

    monkeypatch.setattr(web_source_ingestion, "urlopen", fail_if_called)

    result = extract_web_source_record(url)

    assert result.sourceTitle == "Dog ownership - City of Kingston"
    assert result.trust == "verified"
    assert result.rawText.startswith("Dogs must stay on a leash")


def test_extract_web_source_record_marks_pdf_sources() -> None:
    result = extract_web_source_record(
        "https://www.kingston.vic.gov.au/files/sharedassets/public/v/2/hptrim/compliance-amenity-enquiries-complaints-local-laws-general/kingston-off-leash-areas-2024.pdf",
        raw_text="Kingston off leash areas map",
        title="Kingston off leash areas 2024",
    )

    assert result.sourceType == "municipal_pdf"
