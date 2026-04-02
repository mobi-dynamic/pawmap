from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from hashlib import sha1
from html.parser import HTMLParser
from typing import Any
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from uuid import UUID, uuid5

from .models import PolicyTrustLevel

PAWMAP_SOURCE_NAMESPACE = UUID("9d9b4f8c-7c9c-4d9a-8e8b-4fb6ab55f3c1")


@dataclass(frozen=True)
class WebSourceFact:
    fact_type: str
    value: Any
    evidence: str


@dataclass(frozen=True)
class WebSourceRecord:
    sourceId: str
    sourceUrl: str
    sourceTitle: str | None
    sourceType: str
    retrievedAt: str
    jurisdiction: str | None
    trust: PolicyTrustLevel
    rawText: str
    facts: list[WebSourceFact]
    pawMapRecord: dict[str, Any]


class _PageTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._parts: list[str] = []
        self._title_parts: list[str] = []
        self._in_title = False
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs):
        if tag in {"script", "style", "noscript", "svg", "iframe"}:
            self._skip_depth += 1
        elif tag == "title":
            self._in_title = True
        elif tag in {"p", "br", "div", "li", "section", "article", "h1", "h2", "h3", "h4", "h5", "h6"}:
            self._parts.append("\n")

    def handle_endtag(self, tag: str):
        if tag in {"script", "style", "noscript", "svg", "iframe"} and self._skip_depth:
            self._skip_depth -= 1
        elif tag == "title":
            self._in_title = False

    def handle_data(self, data: str):
        if self._skip_depth:
            return
        text = data.strip()
        if not text:
            return
        if self._in_title:
            self._title_parts.append(text)
        else:
            self._parts.append(text)

    @property
    def text(self) -> str:
        combined = " ".join(self._parts)
        return re.sub(r"\n{3,}", "\n\n", combined)

    @property
    def title(self) -> str | None:
        title = " ".join(self._title_parts).strip()
        return title or None


def fetch_page(url: str, timeout: int = 20) -> tuple[str, str | None]:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-AU,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Upgrade-Insecure-Requests": "1",
    }
    request = Request(url, headers=headers)
    with urlopen(request, timeout=timeout) as response:
        html = response.read().decode("utf-8", errors="ignore")

    parser = _PageTextExtractor()
    parser.feed(html)
    return parser.text, parser.title


def extract_web_source_record(url: str, *, raw_text: str | None = None, title: str | None = None) -> WebSourceRecord:
    if raw_text is None or title is None:
        fetched_text, fetched_title = fetch_page(url)
        text = raw_text if raw_text is not None else fetched_text
        title = title if title is not None else fetched_title
    else:
        text = raw_text
    facts = extract_facts(text)
    jurisdiction = infer_jurisdiction(text, title, url)
    trust = infer_trust(url, facts)

    source_id = str(uuid5(PAWMAP_SOURCE_NAMESPACE, url))
    pawmap_record = build_pawmap_record(url=url, title=title, text=text, facts=facts, jurisdiction=jurisdiction, trust=trust)

    return WebSourceRecord(
        sourceId=source_id,
        sourceUrl=url,
        sourceTitle=title,
        sourceType=detect_source_type(url),
        retrievedAt=datetime.now(timezone.utc).isoformat(),
        jurisdiction=jurisdiction,
        trust=trust,
        rawText=text,
        facts=facts,
        pawMapRecord=pawmap_record,
    )


def detect_source_type(url: str) -> str:
    hostname = urlparse(url).hostname or ""
    if hostname.endswith(".gov.au"):
        return "municipal_webpage"
    return "webpage"


def infer_trust(url: str, facts: list[WebSourceFact]) -> PolicyTrustLevel:
    if urlparse(url).hostname and urlparse(url).hostname.endswith(".gov.au"):
        return PolicyTrustLevel.VERIFIED
    if any(f.fact_type in {"off_leash_policy", "registration_requirement"} for f in facts):
        return PolicyTrustLevel.INFERRED
    return PolicyTrustLevel.NEEDS_VERIFICATION


def infer_jurisdiction(text: str, title: str | None, url: str) -> str | None:
    haystack = f"{title or ''}\n{text}\n{url}".lower()
    candidates = [
        "Kingston City Council",
        "City of Kingston",
    ]
    for candidate in candidates:
        if candidate.lower() in haystack:
            return candidate
    return None


def extract_facts(text: str) -> list[WebSourceFact]:
    facts: list[WebSourceFact] = []
    lowered = text.lower()

    if "off leash" in lowered or "off-leash" in lowered:
        facts.append(WebSourceFact("off_leash_policy", "mentioned", find_evidence(text, ["off leash", "off-leash"])))

    if "dogs must stay on a leash" in lowered or "on a leash" in lowered:
        facts.append(WebSourceFact("leash_requirement", True, find_evidence(text, ["on a leash", "stay on a leash"])))

    if "canals and waterways are not off leash areas" in lowered:
        facts.append(
            WebSourceFact(
                "off_leash_scope_exclusion",
                "canals_and_waterways",
                find_evidence(text, ["canals and waterways are not off leash areas"]),
            )
        )

    if "clean up after your dog" in lowered or "plastic bag" in lowered:
        facts.append(WebSourceFact("cleanup_requirement", True, find_evidence(text, ["clean up after your dog", "plastic bag"])))

    if "season" in lowered and ("summer regulations" in lowered or "winter regulations" in lowered):
        facts.append(
            WebSourceFact(
                "seasonal_foreshore_rules",
                {
                    "summer": "1 November until 31 March",
                    "winter": "1 April until 31 October",
                },
                find_evidence(text, ["summer regulations", "winter regulations", "regulations change depending on the season"]),
            )
        )

    if "no dog zone" in lowered:
        facts.append(WebSourceFact("no_dog_zone", "Mordialloc foreshore reserve zone", find_evidence(text, ["no dog zone", "mordialloc creek", "bay street"])))

    if "dog exercise equipment" in lowered:
        facts.append(
            WebSourceFact(
                "dog_exercise_area",
                [
                    "Bicentennial Park, Chelsea",
                    "Kevin Hayes Reserve, Mordialloc",
                    "Kingston Heath, Cheltenham",
                    "Bald Hill Park, Clayton South",
                ],
                find_evidence(text, ["dog exercise equipment", "Bicentennial Park", "Kevin Hayes Reserve", "Kingston Heath", "Bald Hill Park"]),
            )
        )

    if "bike tracks and footpaths" in lowered:
        facts.append(WebSourceFact("tracks_rule", True, find_evidence(text, ["bike tracks and footpaths"])))

    if "registration" in lowered or "registered" in lowered:
        facts.append(WebSourceFact("registration_requirement", True, find_evidence(text, ["registration", "registered"])))

    hours = first_match(text, [r"\b\d{1,2}:\d{2}\s?(am|pm)\b", r"\b\d{1,2}\s?(am|pm)\b"])
    if hours:
        facts.append(WebSourceFact("hours", hours, find_evidence(text, [hours])))

    return facts


def build_pawmap_record(
    *,
    url: str,
    title: str | None,
    text: str,
    facts: list[WebSourceFact],
    jurisdiction: str | None,
    trust: PolicyTrustLevel,
) -> dict[str, Any]:
    off_leash = "unknown"
    if any(f.fact_type == "off_leash_policy" for f in facts):
        off_leash = "mentioned"

    slug = re.sub(r"[^a-zA-Z0-9]+", "-", (title or url)).strip("-").lower()[:80] or "source"
    record = {
        "placeId": f"source:{slug}:{sha1(url.encode('utf-8')).hexdigest()[:8]}",
        "name": title or "Web source",
        "jurisdiction": jurisdiction,
        "policy": {
            "offLeash": off_leash,
            "hours": first_fact_value(facts, "hours"),
            "restrictions": [],
        },
        "source": {
            "url": url,
            "trust": trust.value,
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
        },
    }
    if text:
        record["source"]["snippet"] = text[:500]
    return record


def first_fact_value(facts: list[WebSourceFact], fact_type: str):
    for fact in facts:
        if fact.fact_type == fact_type:
            return fact.value
    return None


def find_evidence(text: str, needles: list[str], window: int = 140) -> str:
    lowered = text.lower()
    for needle in needles:
        idx = lowered.find(needle.lower())
        if idx != -1:
            start = max(0, idx - window // 2)
            end = min(len(text), idx + len(needle) + window // 2)
            return text[start:end].replace("\n", " ").strip()
    return ""


def first_match(text: str, patterns: list[str]) -> str | None:
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return match.group(0)
    return None
