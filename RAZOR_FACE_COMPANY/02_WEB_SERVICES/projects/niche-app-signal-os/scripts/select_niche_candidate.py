from __future__ import annotations

from common import DATA_DIR, MEMORY_DIR, OUTPUT_DIR, cli_parser, department_output, load_latest, read_json, save_stage, today_iso, write_json, write_text


def _previous_posted_candidate_id() -> str:
    history = read_json(DATA_DIR / "post_history.json", {"entries": []})
    entries = history.get("entries", []) if isinstance(history, dict) else []
    posted = [entry for entry in entries if isinstance(entry, dict) and entry.get("status") == "posted"]
    return posted[-1].get("candidate_id", "") if posted else ""


def _tone_id(item: dict) -> str:
    blob = " ".join([item.get("candidate_id", ""), item.get("category", ""), item.get("target_user", "")])
    if any(word in blob for word in ["ライブ", "推し", "グッズ", "現場", "遠征"]):
        return "gen_z_oshi_activity"
    if "学生" in blob:
        return "student_casual"
    return "default_light_problem"


def _candidate_from_score(entry: dict) -> dict:
    item = entry.get("item", {}) if isinstance(entry, dict) else {}
    evidence_texts = item.get("evidence_texts") or []
    return {
        "candidate_id": item.get("candidate_id", ""),
        "category": item.get("category", ""),
        "pain_point": item.get("pain_point", ""),
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
                "source_type": item.get("source_type", ""),
                "evidence_text": text,
            }
            for text in evidence_texts
        ],
        "market_evidence_count": len(evidence_texts),
    }


def run(sample: bool = False) -> dict:
    scored = load_latest("niche_demand_score.json", {}).get("scored_candidates", [])
    previous_id = _previous_posted_candidate_id()
    candidates = [
        _candidate_from_score(entry)
        for entry in scored
        if entry.get("eligible_for_post") and entry.get("candidate_id") != previous_id
    ]
    candidates.sort(key=lambda row: (row["priority_score"], row["market_evidence_count"]), reverse=True)
    selected = candidates[0] if candidates else None
    payload = {
        "date": today_iso(),
        "selected_candidate_id": selected["candidate_id"] if selected else "",
        "candidates": candidates[:3],
        "selection_reason": "Highest scored market-backed candidate; previous candidate avoided." if selected else "No eligible candidate after evidence and duplicate checks.",
        "previous_candidate_id": previous_id,
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
                f"Previous: {previous_id or 'none'}",
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
                f"- evidence_required: true",
                "",
                "## Selected Candidate",
                f"- category: {selected.get('category', '') if selected else ''}",
                f"- pain_point: {selected.get('pain_point', '') if selected else ''}",
                f"- market_evidence_count: {selected.get('market_evidence_count', 0) if selected else 0}",
            ]
        ),
    )
    report = department_output(
        "Market Need Department",
        "Selected daily niche demand candidates only from scored market inputs with evidence.",
        scores={"candidate_count": len(candidates), "selected_priority_score": selected.get("priority_score", 0) if selected else 0},
        risks=[] if selected else ["no_market_evidence_candidate"],
        next_action="market research trace",
        input_sources=["output/reports/research_inputs.json", "output/reports/niche_demand_score.json"],
        extra={"daily_niche_ui_candidates": payload, "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent))},
    )
    save_stage("market_need.json", report)
    return report


if __name__ == "__main__":
    args = cli_parser("Select daily niche market need candidates").parse_args()
    run(sample=args.sample)
