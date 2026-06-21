from __future__ import annotations

from common import DATA_DIR, MEMORY_DIR, cli_parser, department_output, ensure_dirs, read_json, save_stage, today_iso, write_text


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


def _items_from_file() -> list[dict]:
    raw = read_json(DATA_DIR / "market_research_inputs.json", {"items": []})
    items = raw.get("items", raw) if isinstance(raw, dict) else raw
    return list(items or [])


def _normalize(item: dict) -> dict:
    evidence_texts = item.get("evidence_texts") or []
    if isinstance(evidence_texts, str):
        evidence_texts = [evidence_texts]
    existing_alternatives = item.get("existing_alternatives") or []
    if isinstance(existing_alternatives, str):
        existing_alternatives = [existing_alternatives]
    missing = [field for field in REQUIRED_FIELDS if not item.get(field)]
    return {
        "candidate_id": str(item.get("candidate_id", "")).strip(),
        "category": str(item.get("category", "")).strip(),
        "pain_point": str(item.get("pain_point", "")).strip(),
        "target_user": str(item.get("target_user", "unclear")).strip() or "unclear",
        "current_workaround": str(item.get("current_workaround", "")).strip(),
        "evidence_texts": [str(text).strip() for text in evidence_texts if str(text).strip()],
        "source_type": str(item.get("source_type", "manual")).strip(),
        "why_niche": str(item.get("why_niche", "")).strip(),
        "why_now": str(item.get("why_now", "")).strip(),
        "existing_alternatives": [str(text).strip() for text in existing_alternatives if str(text).strip()],
        "expected_ui_metaphor": str(item.get("expected_ui_metaphor", "")).strip(),
        "missing_fields": missing,
    }


def run(sample: bool = False) -> dict:
    ensure_dirs()
    normalized = [_normalize(item) for item in _items_from_file()]
    usable = [item for item in normalized if item["evidence_texts"] and item["candidate_id"]]
    excluded = [item for item in normalized if item not in usable]

    memory_path = MEMORY_DIR / "research" / f"{today_iso()}.md"
    write_text(
        memory_path,
        "\n".join(
            [
                f"# Research Inputs - {today_iso()}",
                "",
                f"- usable_candidates: {len(usable)}",
                f"- excluded_candidates: {len(excluded)}",
                "",
                "## Candidates",
                *[
                    f"- {item['candidate_id']}: {item['pain_point']} / evidence={len(item['evidence_texts'])}"
                    for item in usable
                ],
                "",
            ]
        ),
    )

    payload = department_output(
        "Research Department",
        "Loaded daily market research inputs from data/market_research_inputs.json and removed candidates without evidence.",
        scores={"items": len(normalized), "usable_candidates": len(usable), "excluded_candidates": len(excluded)},
        risks=[] if usable else ["no_market_research_inputs_with_evidence"],
        next_action="score niche demand",
        input_sources=["data/market_research_inputs.json"],
        extra={"items": usable, "excluded_items": excluded, "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent))},
    )
    save_stage("research_inputs.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Collect market research inputs").parse_args()
    run(sample=args.sample)
