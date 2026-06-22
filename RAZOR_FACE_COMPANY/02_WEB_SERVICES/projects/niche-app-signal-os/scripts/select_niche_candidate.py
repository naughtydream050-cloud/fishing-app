from __future__ import annotations

import hashlib

from common import DATA_DIR, MEMORY_DIR, OUTPUT_DIR, cli_parser, department_output, load_latest, read_json, save_stage, today_iso, write_json, write_text


def _hash_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest() if value else ""


def _previous_posted() -> dict:
    history = read_json(DATA_DIR / "post_history.json", {"entries": []})
    entries = history.get("entries", []) if isinstance(history, dict) else []
    posted = [entry for entry in entries if isinstance(entry, dict) and entry.get("status") == "posted"]
    return posted[-1] if posted else {}


def _tone_id(item: dict) -> str:
    blob = " ".join([item.get("candidate_id", ""), item.get("category", ""), item.get("target_user", ""), item.get("pain_point", "")])
    if any(word in blob for word in ["推し", "ライブ", "グッズ", "現場", "遠征"]):
        return "gen_z_oshi_activity"
    if "学生" in blob or "授業" in blob:
        return "student_casual"
    return "default_light_problem"


def _candidate_from_score(entry: dict) -> dict:
    item = entry.get("item", {}) if isinstance(entry, dict) else {}
    evidence_texts = item.get("evidence_texts") or []
    source_urls = item.get("source_urls") or []
    source_types = item.get("source_types") or []
    source_urls_hash = item.get("source_urls_hash", "")
    pain_point = item.get("pain_point", "")
    return {
        "candidate_id": item.get("candidate_id", ""),
        "category": item.get("category", ""),
        "pain_point": pain_point,
        "pain_point_hash": _hash_text(pain_point),
        "target_user": item.get("target_user", ""),
        "current_workaround": item.get("current_workaround", ""),
        "why_niche": item.get("why_niche", ""),
        "why_now": item.get("why_now", ""),
        "existing_alternatives": item.get("existing_alternatives", []),
        "likely_target_users": [item.get("target_user", "")],
        "ui_metaphor": item.get("expected_ui_metaphor", ""),
        "expected_ui_metaphor": item.get("expected_ui_metaphor", ""),
        "tone_id": _tone_id(item),
        "priority_score": entry.get("score", 0),
        "market_sources": [
            {
                "source_type": source_types[index] if index < len(source_types) else item.get("source_type", ""),
                "source_url": source_urls[index] if index < len(source_urls) else "",
                "evidence_text": text,
            }
            for index, text in enumerate(evidence_texts)
        ],
        "market_evidence_count": int(item.get("evidence_count") or len(evidence_texts)),
        "source_urls": source_urls,
        "source_types": source_types,
        "source_urls_hash": source_urls_hash,
        "research_freshness": item.get("research_freshness", "stale_blocked"),
        "fallback_reason": item.get("fallback_reason", ""),
    }


def _is_previous_duplicate(candidate: dict, previous: dict) -> bool:
    if not previous:
        return False
    return any(
        [
            previous.get("candidate_id") and previous.get("candidate_id") == candidate.get("candidate_id"),
            previous.get("pain_point_hash") and previous.get("pain_point_hash") == candidate.get("pain_point_hash"),
            previous.get("source_urls_hash") and previous.get("source_urls_hash") == candidate.get("source_urls_hash"),
        ]
    )


def run(sample: bool = False) -> dict:
    scored = load_latest("niche_demand_score.json", {}).get("scored_candidates", [])
    previous = _previous_posted()
    all_candidates = [_candidate_from_score(entry) for entry in scored if entry.get("eligible_for_post")]
    candidates = [candidate for candidate in all_candidates if not _is_previous_duplicate(candidate, previous)]
    candidates.sort(key=lambda row: (row["priority_score"], row["market_evidence_count"]), reverse=True)
    selected = candidates[0] if candidates else None
    duplicate_filtered = len(all_candidates) - len(candidates)
    payload = {
        "date": today_iso(),
        "selected_candidate_id": selected["candidate_id"] if selected else "",
        "candidates": candidates[:3],
        "selection_reason": "Highest scored market-backed candidate; previous candidate, pain point, and source URL hash avoided."
        if selected
        else "No eligible candidate after evidence and duplicate checks.",
        "previous_candidate_id": previous.get("candidate_id", ""),
        "previous_pain_point_hash": previous.get("pain_point_hash", ""),
        "previous_source_urls_hash": previous.get("source_urls_hash", ""),
        "duplicate_filtered_count": duplicate_filtered,
        "dry_run": True,
        "market_evidence_required": True,
    }
    write_json(OUTPUT_DIR / "reports" / "daily_niche_ui_candidates.json", payload)
    write_text(
        OUTPUT_DIR / "reports" / "daily_niche_ui_candidates.md",
        "\n".join(
            [
                f"# Daily Niche UI Candidates - {today_iso()}",
                "",
                f"Selected: {payload['selected_candidate_id'] or 'none'}",
                f"Previous: {payload['previous_candidate_id'] or 'none'}",
                f"Duplicate filtered: {duplicate_filtered}",
                "",
                "## Candidates",
                *[
                    "\n".join(
                        [
                            f"### {candidate['candidate_id']}",
                            f"- category: {candidate['category']}",
                            f"- pain_point: {candidate['pain_point']}",
                            f"- target: {candidate['target_user']}",
                            f"- ui_metaphor: {candidate['ui_metaphor']}",
                            f"- evidence_count: {candidate['market_evidence_count']}",
                            f"- source_urls: {len(candidate['source_urls'])}",
                            f"- research_freshness: {candidate['research_freshness']}",
                            f"- score: {candidate['priority_score']}",
                        ]
                    )
                    for candidate in payload["candidates"]
                ],
                "",
            ]
        ),
    )
    memory_path = MEMORY_DIR / "market_needs" / f"{today_iso()}.md"
    write_text(
        memory_path,
        "\n".join(
            [
                f"# Market Need Department - {today_iso()}",
                "",
                f"- selected_candidate_id: {payload['selected_candidate_id'] or 'none'}",
                f"- candidate_count: {len(candidates)}",
                f"- duplicate_filtered_count: {duplicate_filtered}",
                f"- evidence_required: true",
                "",
                "## Selected Candidate",
                f"- category: {selected.get('category', '') if selected else ''}",
                f"- pain_point: {selected.get('pain_point', '') if selected else ''}",
                f"- market_evidence_count: {selected.get('market_evidence_count', 0) if selected else 0}",
                f"- source_urls_hash: {selected.get('source_urls_hash', '') if selected else ''}",
            ]
        ),
    )
    report = department_output(
        "Market Need Department",
        "Selected daily niche demand candidates only from scored market inputs with evidence and source URLs.",
        scores={"candidate_count": len(candidates), "selected_priority_score": selected.get("priority_score", 0) if selected else 0},
        risks=[] if selected else ["no_market_evidence_candidate"],
        next_action="market research trace",
        input_sources=["output/reports/research_inputs.json", "output/reports/niche_demand_score.json", "data/post_history.json"],
        extra={"daily_niche_ui_candidates": payload, "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent))},
    )
    save_stage("market_need.json", report)
    return report


if __name__ == "__main__":
    args = cli_parser("Select daily niche market need candidates").parse_args()
    run(sample=args.sample)
