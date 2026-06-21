from __future__ import annotations

from common import OUTPUT_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_json, write_text


def _rejection_reason(gate: dict, tone_check: dict, post: dict) -> str:
    if not post.get("text"):
        return "missing_post_text"
    if not gate.get("approved"):
        reasons = gate.get("block_reasons") or gate.get("risks") or ["quality_risk_gate_not_approved"]
        return "; ".join(str(reason) for reason in reasons)
    if not tone_check.get("passed"):
        return "tone_mismatch"
    return ""


def run(sample: bool = False) -> dict:
    threads_post = load_latest("threads_post.json", {})
    post = threads_post.get("post", {})
    gate = load_latest("quality_risk_gate.json", {})
    tone_profile = load_latest("audience_tone_profile.json", {}).get("audience_tone_profile", {})
    trace = load_latest("market_research_trace.json", {})
    card = load_latest("daily_share_card.json", {})
    tone_check = post.get("tone_check_result") or gate.get("tone_check_result") or {}
    evidence_count = int(trace.get("market_evidence_count") or 0)
    selected_image_path = (card.get("card_paths") or {}).get("png", "")
    approved = (
        bool(post.get("text"))
        and bool(gate.get("approved"))
        and bool(tone_check.get("passed"))
        and evidence_count > 0
        and bool(selected_image_path)
    )
    rejected_reason = "" if approved else _rejection_reason(gate, tone_check, post)
    if not rejected_reason and evidence_count <= 0:
        rejected_reason = "market_evidence_count_zero"
    if not rejected_reason and not selected_image_path:
        rejected_reason = "selected_image_path_missing"

    selected = {
        "date": today_iso(),
        "selected": approved,
        "selected_candidate_id": trace.get("selected_candidate_id", ""),
        "selected_category": trace.get("selected_category", ""),
        "selected_pain_point": trace.get("selected_pain_point", ""),
        "market_research_trace": "output/reports/market_research_trace.json",
        "market_evidence_count": evidence_count,
        "selected_tone": post.get("tone_id") or tone_profile.get("tone_id", ""),
        "target_audience": post.get("target_audience") or tone_profile.get("target_audience", ""),
        "ui_target_audience": tone_profile.get("ui_target_audience", ""),
        "tone_check_result": tone_check,
        "selected_post_text": post.get("text", "") if approved else "",
        "candidate_post_text": post.get("text", ""),
        "selected_image_path": selected_image_path,
        "image_generated_from_candidate": bool(card.get("candidate_id")) and card.get("candidate_id") == trace.get("selected_candidate_id"),
        "rejected_reason_if_any": rejected_reason,
        "source": [
            "output/reports/market_research_trace.json",
            "output/reports/threads_post.json",
            "output/reports/daily_share_card.json",
            "output/reports/quality_risk_gate.json",
            "output/reports/audience_tone_profile.json",
        ],
    }
    write_json(OUTPUT_DIR / "reports" / "selected_post_candidate.json", selected)
    write_text(
        OUTPUT_DIR / "reports" / "selected_post_candidate.md",
        "\n".join(
            [
                f"# Selected Post Candidate - {today_iso()}",
                "",
                f"- selected: {selected['selected']}",
                f"- selected_candidate_id: {selected['selected_candidate_id']}",
                f"- selected_category: {selected['selected_category']}",
                f"- market_evidence_count: {selected['market_evidence_count']}",
                f"- selected_image_path: {selected['selected_image_path']}",
                f"- rejected_reason_if_any: {selected['rejected_reason_if_any']}",
                "",
                "## Selected Post Text",
                selected["selected_post_text"] or selected["candidate_post_text"],
                "",
            ]
        ),
    )

    payload = department_output(
        "Post Candidate Selection Department",
        "Selected only tone-adapted copy approved by the quality risk gate.",
        scores={"selected": approved, "text_length": len(selected["selected_post_text"])},
        risks=[] if approved else [rejected_reason],
        next_action="card image then publishing guard",
        input_sources=selected["source"],
        extra=selected,
    )
    save_stage("post_candidate_selection.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Select the final tone-adapted post candidate").parse_args()
    run(sample=args.sample)
