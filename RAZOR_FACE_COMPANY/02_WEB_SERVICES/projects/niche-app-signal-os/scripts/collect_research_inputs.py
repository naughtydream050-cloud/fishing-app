from __future__ import annotations

import hashlib

from common import DATA_DIR, MEMORY_DIR, cli_parser, department_output, ensure_dirs, load_latest, read_json, save_stage, today_iso, write_text


REQUIRED_FIELDS = [
    "candidate_id",
    "category",
    "pain_point",
    "target_user",
    "current_workaround",
    "evidence_texts",
    "source_type",
    "why_niche",
    "why_now",
    "existing_alternatives",
    "expected_ui_metaphor",
]


def _source_hash(urls: list[str]) -> str:
    joined = "\n".join(sorted(set(urls)))
    return hashlib.sha256(joined.encode("utf-8")).hexdigest() if joined else ""


def _items_from_manual_file() -> list[dict]:
    raw = read_json(DATA_DIR / "market_research_inputs.json", {"items": []})
    items = raw.get("items", raw) if isinstance(raw, dict) else raw
    return list(items or [])


def _items_from_extraction() -> list[dict]:
    extracted = load_latest("extracted_market_needs.json", {})
    items = extracted.get("items", []) if isinstance(extracted, dict) else []
    return list(items or [])


def _normalize(item: dict, *, fallback_reason: str = "") -> dict:
    evidence_texts = item.get("evidence_texts") or []
    if isinstance(evidence_texts, str):
        evidence_texts = [evidence_texts]
    existing_alternatives = item.get("existing_alternatives") or []
    if isinstance(existing_alternatives, str):
        existing_alternatives = [existing_alternatives]
    source_urls = item.get("source_urls") or []
    if isinstance(source_urls, str):
        source_urls = [source_urls]
    source_types = item.get("source_types") or []
    if isinstance(source_types, str):
        source_types = [source_types]

    source_urls = [str(url).strip() for url in source_urls if str(url).strip()]
    source_types = [str(kind).strip() for kind in source_types if str(kind).strip()]
    clean_evidence = [str(text).strip() for text in evidence_texts if str(text).strip()]
    evidence_count = int(item.get("evidence_count") or len(clean_evidence))
    freshness = str(item.get("research_freshness") or ("fresh" if source_urls and evidence_count > 0 else "fallback_with_reason")).strip()
    if fallback_reason:
        freshness = "fallback_with_reason"
    if not source_urls or evidence_count <= 0:
        freshness = "stale_blocked" if not fallback_reason else "fallback_with_reason"

    missing = [field for field in REQUIRED_FIELDS if not item.get(field)]
    return {
        "candidate_id": str(item.get("candidate_id", "")).strip(),
        "category": str(item.get("category", "")).strip(),
        "pain_point": str(item.get("pain_point", "")).strip(),
        "target_user": str(item.get("target_user", "unclear")).strip() or "unclear",
        "current_workaround": str(item.get("current_workaround", "")).strip(),
        "evidence_texts": clean_evidence,
        "source_type": str(item.get("source_type", "manual")).strip(),
        "source_urls": source_urls,
        "source_types": sorted(set(source_types or [str(item.get("source_type", "manual")).strip()])),
        "evidence_count": evidence_count,
        "research_freshness": freshness,
        "fallback_reason": str(item.get("fallback_reason") or fallback_reason).strip(),
        "source_urls_hash": item.get("source_urls_hash") or _source_hash(source_urls),
        "why_niche": str(item.get("why_niche", "")).strip(),
        "why_now": str(item.get("why_now", "")).strip(),
        "existing_alternatives": [str(text).strip() for text in existing_alternatives if str(text).strip()],
        "expected_ui_metaphor": str(item.get("expected_ui_metaphor", "")).strip(),
        "missing_fields": missing,
    }


def run(sample: bool = False) -> dict:
    ensure_dirs()
    extracted = [_normalize(item) for item in _items_from_extraction()]
    usable_extracted = [
        item
        for item in extracted
        if item["candidate_id"] and item["evidence_count"] > 0 and item["source_urls"] and item["research_freshness"] != "stale_blocked"
    ]
    fallback_reason = ""
    if usable_extracted:
        normalized = usable_extracted
        input_mode = "public_market_research"
    else:
        fallback_reason = "No usable fresh public market needs; using manual seed inputs only as explicit fallback."
        normalized = [_normalize(item, fallback_reason=fallback_reason) for item in _items_from_manual_file()]
        input_mode = "manual_fallback"

    usable = [
        item
        for item in normalized
        if item["evidence_texts"]
        and item["candidate_id"]
        and item["target_user"] != "unclear"
        and item["pain_point"]
        and item["current_workaround"]
        and item["expected_ui_metaphor"]
    ]
    excluded = [item for item in normalized if item not in usable]

    memory_path = MEMORY_DIR / "research" / f"{today_iso()}.md"
    write_text(
        memory_path,
        "\n".join(
            [
                f"# Research Inputs - {today_iso()}",
                "",
                f"- input_mode: {input_mode}",
                f"- usable_candidates: {len(usable)}",
                f"- excluded_candidates: {len(excluded)}",
                f"- fallback_reason: {fallback_reason}",
                "",
                "## Candidates",
                *[
                    f"- {item['candidate_id']}: evidence={item['evidence_count']} urls={len(item['source_urls'])} freshness={item['research_freshness']} pain={item['pain_point']}"
                    for item in usable
                ],
                "",
            ]
        ),
    )

    risks = []
    if not usable:
        risks.append("no_market_research_inputs_with_evidence")
    if input_mode == "manual_fallback":
        risks.append("public_research_fallback_used")

    payload = department_output(
        "Research Department",
        "Loaded daily market research inputs from public extraction first, with explicit manual fallback only when needed.",
        scores={"items": len(normalized), "usable_candidates": len(usable), "excluded_candidates": len(excluded)},
        risks=risks,
        next_action="score niche demand" if usable else "stop before posting",
        input_sources=["output/reports/extracted_market_needs.json", "data/market_research_inputs.json"],
        extra={
            "input_mode": input_mode,
            "fallback_reason": fallback_reason,
            "items": usable,
            "excluded_items": excluded,
            "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent)),
        },
    )
    save_stage("research_inputs.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Collect market research inputs").parse_args()
    run(sample=args.sample)
