from __future__ import annotations

from common import OUTPUT_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_json, write_text


def _selected_candidate() -> dict:
    pack = load_latest("daily_niche_ui_candidates.json", {})
    selected_id = pack.get("selected_candidate_id", "")
    for candidate in pack.get("candidates", []):
        if candidate.get("candidate_id") == selected_id:
            return candidate
    return {}


def run(sample: bool = False) -> dict:
    research = load_latest("research_inputs.json", {})
    viral = load_latest("viral_patterns.json", {})
    timing = load_latest("trend_timing.json", {})
    scored = load_latest("niche_demand_score.json", {})
    candidate = _selected_candidate()
    market_sources = candidate.get("market_sources", []) if candidate else []
    evidence_count = int(candidate.get("market_evidence_count") or len(market_sources))
    trace = {
        "date": today_iso(),
        "selected_candidate_id": candidate.get("candidate_id", ""),
        "selected_category": candidate.get("category", ""),
        "selected_pain_point": candidate.get("pain_point", ""),
        "market_sources_used": market_sources,
        "market_evidence_count": evidence_count,
        "source_evidence_count": evidence_count,
        "why_selected_today": "Selected from current scored research inputs." if evidence_count else "No market evidence available.",
        "stages": {
            "collect_research_inputs": {
                "present": bool(research),
                "item_count": len(research.get("items", [])) if isinstance(research, dict) else 0,
            },
            "analyze_viral_patterns": {"present": bool(viral)},
            "evaluate_trend_timing": {"present": bool(timing)},
            "score_niche_demand": {
                "present": bool(scored),
                "candidate_count": len(scored.get("scored_candidates", [])) if isinstance(scored, dict) else 0,
            },
        },
        "posting_trace_ready": bool(candidate) and evidence_count > 0,
    }
    write_json(OUTPUT_DIR / "reports" / "market_research_trace.json", trace)
    write_text(
        OUTPUT_DIR / "reports" / "market_research_trace.md",
        "\n".join(
            [
                f"# Market Research Trace - {today_iso()}",
                "",
                f"- selected_candidate_id: {trace['selected_candidate_id']}",
                f"- selected_category: {trace['selected_category']}",
                f"- selected_pain_point: {trace['selected_pain_point']}",
                f"- market_evidence_count: {trace['market_evidence_count']}",
                f"- why_selected_today: {trace['why_selected_today']}",
                "",
                "## Sources",
                *[f"- {source.get('source_platform', '')}: {source.get('source_key', '')[:180]}" for source in market_sources],
                "",
            ]
        ),
    )
    payload = department_output(
        "Market Research Trace Department",
        "Traced the selected candidate back to current market/research evidence.",
        scores={"market_evidence_count": evidence_count},
        risks=[] if trace["posting_trace_ready"] else ["market_research_trace_missing_or_empty"],
        next_action="audience strategy",
        input_sources=[
            "output/reports/research_inputs.json",
            "output/reports/viral_patterns.json",
            "output/reports/trend_timing.json",
            "output/reports/niche_demand_score.json",
            "output/reports/daily_niche_ui_candidates.json",
        ],
        extra={"market_research_trace": trace},
    )
    save_stage("market_research_trace_stage.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Build market research trace for selected post candidate").parse_args()
    run(sample=args.sample)
