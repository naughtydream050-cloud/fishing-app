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
    public_research = load_latest("public_market_research.json", {})
    extracted = load_latest("extracted_market_needs.json", {})
    research = load_latest("research_inputs.json", {})
    viral = load_latest("viral_patterns.json", {})
    timing = load_latest("trend_timing.json", {})
    scored = load_latest("niche_demand_score.json", {})
    candidate = _selected_candidate()
    market_sources = candidate.get("market_sources", []) if candidate else []
    source_urls = candidate.get("source_urls", []) if candidate else []
    source_types = candidate.get("source_types", []) if candidate else []
    evidence_count = int(candidate.get("market_evidence_count") or len(market_sources))
    freshness = candidate.get("research_freshness", "stale_blocked") if candidate else "stale_blocked"
    fallback_reason = candidate.get("fallback_reason", "") if candidate else "selected_candidate_missing"
    posting_trace_ready = bool(candidate) and evidence_count > 0 and bool(source_urls) and freshness != "stale_blocked"
    trace = {
        "date": today_iso(),
        "selected_candidate_id": candidate.get("candidate_id", ""),
        "selected_category": candidate.get("category", ""),
        "selected_pain_point": candidate.get("pain_point", ""),
        "selected_pain_point_hash": candidate.get("pain_point_hash", ""),
        "market_sources_used": market_sources,
        "market_evidence_count": evidence_count,
        "source_evidence_count": evidence_count,
        "source_urls": source_urls,
        "source_types": source_types,
        "source_urls_hash": candidate.get("source_urls_hash", ""),
        "research_freshness": freshness,
        "fallback_reason": fallback_reason,
        "why_selected_today": "Selected from current public-source-backed scored research inputs."
        if posting_trace_ready
        else "Selected trace is not posting-ready because candidate/evidence/source URLs/freshness are incomplete.",
        "stages": {
            "fetch_public_market_sources": {
                "present": bool(public_research),
                "signal_count": len(public_research.get("signals", [])) if isinstance(public_research, dict) else 0,
                "research_freshness": public_research.get("research_freshness", "") if isinstance(public_research, dict) else "",
            },
            "extract_market_needs": {
                "present": bool(extracted),
                "candidate_count": len(extracted.get("items", [])) if isinstance(extracted, dict) else 0,
            },
            "collect_research_inputs": {
                "present": bool(research),
                "item_count": len(research.get("items", [])) if isinstance(research, dict) else 0,
                "input_mode": research.get("input_mode", "") if isinstance(research, dict) else "",
            },
            "analyze_viral_patterns": {"present": bool(viral)},
            "evaluate_trend_timing": {"present": bool(timing)},
            "score_niche_demand": {
                "present": bool(scored),
                "candidate_count": len(scored.get("scored_candidates", [])) if isinstance(scored, dict) else 0,
            },
        },
        "posting_trace_ready": posting_trace_ready,
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
                f"- source_urls: {len(source_urls)}",
                f"- source_types: {', '.join(source_types)}",
                f"- research_freshness: {freshness}",
                f"- fallback_reason: {fallback_reason}",
                f"- source_urls_hash: {trace['source_urls_hash']}",
                f"- posting_trace_ready: {posting_trace_ready}",
                f"- why_selected_today: {trace['why_selected_today']}",
                "",
                "## Sources",
                *[f"- {source.get('source_type', '')}: {source.get('source_url', '')} / {source.get('evidence_text', '')[:140]}" for source in market_sources],
                "",
            ]
        ),
    )
    payload = department_output(
        "Market Research Trace Department",
        "Traced the selected candidate back to current public market evidence, source URLs, freshness, and fallback state.",
        scores={"market_evidence_count": evidence_count, "source_url_count": len(source_urls)},
        risks=[] if trace["posting_trace_ready"] else ["market_research_trace_missing_or_empty"],
        next_action="audience strategy",
        input_sources=[
            "output/reports/public_market_research.json",
            "output/reports/extracted_market_needs.json",
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
