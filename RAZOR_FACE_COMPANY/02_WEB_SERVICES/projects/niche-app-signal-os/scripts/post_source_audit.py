from __future__ import annotations

import hashlib

from common import DATA_DIR, OUTPUT_DIR, cli_parser, department_output, load_latest, read_json, save_stage, today_iso, write_json, write_text


def _hash_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest() if value else ""


def _history_entries() -> list[dict]:
    history = read_json(DATA_DIR / "post_history.json", {"entries": []})
    entries = history.get("entries", []) if isinstance(history, dict) else []
    return [entry for entry in entries if isinstance(entry, dict)]


def _previous_post() -> dict:
    posted = [entry for entry in _history_entries() if entry.get("status") == "posted"]
    return posted[-1] if posted else {}


def run(sample: bool = False) -> dict:
    selected = load_latest("selected_post_candidate.json", {})
    trace = load_latest("market_research_trace.json", {})
    design = load_latest("design_strategy.json", {}).get("design_strategy", {})
    tone = load_latest("audience_tone_profile.json", {}).get("audience_tone_profile", {})
    card = load_latest("daily_share_card.json", {})
    gate = load_latest("quality_risk_gate.json", {})
    previous = _previous_post()

    selected_candidate_id = selected.get("selected_candidate_id") or trace.get("selected_candidate_id", "")
    selected_image_path = selected.get("selected_image_path", "")
    selected_post_text = selected.get("selected_post_text") or selected.get("candidate_post_text", "")
    market_evidence_count = int(trace.get("market_evidence_count") or selected.get("market_evidence_count") or 0)
    fixed_override_used = False
    duplicate_reasons: list[str] = []

    if previous.get("candidate_id") and previous.get("candidate_id") == selected_candidate_id:
        duplicate_reasons.append("same_candidate_id_as_previous_post")
    if previous.get("selected_image_path") and previous.get("selected_image_path") == selected_image_path:
        duplicate_reasons.append("same_image_path_as_previous_post")
    if previous.get("post_text_hash") and previous.get("post_text_hash") == _hash_text(selected_post_text):
        duplicate_reasons.append("same_post_text_as_previous_post")

    image_generated_from_candidate = bool(card.get("candidate_id")) and card.get("candidate_id") == selected_candidate_id
    design_strategy_used = bool(design.get("candidate_id")) and design.get("candidate_id") == selected_candidate_id
    tone_profile_used = bool(tone.get("tone_id"))
    risk_gate_result = bool(gate.get("approved"))

    blocks = []
    if not trace:
        blocks.append("market_research_trace_missing")
    if market_evidence_count <= 0:
        blocks.append("market_evidence_count_zero")
    if not selected_candidate_id:
        blocks.append("selected_candidate_missing")
    if duplicate_reasons:
        blocks.extend(duplicate_reasons)
    if fixed_override_used:
        blocks.append("fixed_override_used")
    if selected_candidate_id == "oshi-activity-management" and market_evidence_count <= 0:
        blocks.append("oshi_fixed_selection_without_market_research")
    if not design_strategy_used:
        blocks.append("design_strategy_not_for_selected_candidate")
    if not image_generated_from_candidate:
        blocks.append("card_image_not_for_selected_candidate")
    if not risk_gate_result:
        blocks.append("risk_gate_not_approved")
    if not selected.get("selected"):
        blocks.append("selected_post_candidate_not_selected")

    audit = {
        "date": today_iso(),
        "selected_candidate_id": selected_candidate_id,
        "selected_category": selected.get("selected_category") or trace.get("selected_category", ""),
        "selected_pain_point": selected.get("selected_pain_point") or trace.get("selected_pain_point", ""),
        "market_sources_used": trace.get("market_sources_used", []),
        "market_evidence_count": market_evidence_count,
        "source_evidence_count": int(trace.get("source_evidence_count") or market_evidence_count),
        "why_selected_today": trace.get("why_selected_today", ""),
        "previous_candidate_id": previous.get("candidate_id", ""),
        "duplicate_check_result": {
            "passed": not duplicate_reasons,
            "reasons": duplicate_reasons,
        },
        "selected_post_text": selected_post_text,
        "selected_post_text_hash": _hash_text(selected_post_text),
        "selected_image_path": selected_image_path,
        "image_generated_from_candidate": image_generated_from_candidate,
        "tone_profile_used": tone.get("tone_id", ""),
        "design_strategy_used": design_strategy_used,
        "risk_gate_result": risk_gate_result,
        "fixed_override_used": fixed_override_used,
        "posting_allowed": not blocks,
        "blocks": blocks,
    }
    write_json(OUTPUT_DIR / "reports" / "post_source_audit.json", audit)
    write_text(
        OUTPUT_DIR / "reports" / "post_source_audit.md",
        "\n".join(
            [
                f"# Post Source Audit - {today_iso()}",
                "",
                f"- selected_candidate_id: {audit['selected_candidate_id']}",
                f"- selected_category: {audit['selected_category']}",
                f"- selected_pain_point: {audit['selected_pain_point']}",
                f"- market_evidence_count: {audit['market_evidence_count']}",
                f"- why_selected_today: {audit['why_selected_today']}",
                f"- previous_candidate_id: {audit['previous_candidate_id']}",
                f"- duplicate_check_result: {audit['duplicate_check_result']}",
                f"- selected_image_path: {audit['selected_image_path']}",
                f"- image_generated_from_candidate: {audit['image_generated_from_candidate']}",
                f"- tone_profile_used: {audit['tone_profile_used']}",
                f"- design_strategy_used: {audit['design_strategy_used']}",
                f"- risk_gate_result: {audit['risk_gate_result']}",
                f"- posting_allowed: {audit['posting_allowed']}",
                "",
                "## Blocks",
                *[f"- {block}" for block in blocks],
                "",
            ]
        ),
    )
    payload = department_output(
        "Post Source Audit Department",
        "Audited that the selected post and image are backed by today's market research and are not duplicated.",
        scores={"market_evidence_count": market_evidence_count, "posting_allowed": audit["posting_allowed"]},
        risks=blocks,
        next_action="post to threads" if audit["posting_allowed"] else "stop before posting",
        input_sources=[
            "output/reports/market_research_trace.json",
            "output/reports/selected_post_candidate.json",
            "output/reports/daily_share_card.json",
            "output/reports/design_strategy.json",
            "output/reports/audience_tone_profile.json",
            "output/reports/quality_risk_gate.json",
            "data/post_history.json",
        ],
        extra={"post_source_audit": audit},
    )
    save_stage("post_source_audit_stage.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Audit selected post source before Threads publishing").parse_args()
    run(sample=args.sample)
