from __future__ import annotations

from common import cli_parser, department_output, load_latest, save_stage


GLOBAL_BLOCK_WORDS = ["SaaS", "生産性", "革新的", "完全自動化", "業務効率"]
OSHI_BLOCK_WORDS = ["推し活女子", "完璧に整理", "効率化", "管理しよう", "節約しよう", "無駄遣い"]
DEVELOPER_MARKERS = ["作りました", "作ってます", "試作UIを作ってます", "リリースしました"]


def _tone_gate(text: str, tone_profile: dict) -> tuple[list[str], list[str], dict]:
    avoid_words = list(dict.fromkeys((tone_profile.get("avoid_words") or []) + GLOBAL_BLOCK_WORDS))
    if tone_profile.get("tone_id") == "gen_z_oshi_activity":
        avoid_words.extend(OSHI_BLOCK_WORDS)
    used_avoid = [word for word in avoid_words if word and word in text]
    used_words = [word for word in tone_profile.get("use_words", []) if word and word in text]
    blocks = []
    warnings = []
    if used_avoid:
        blocks.append("tone_avoid_words_used: " + ", ".join(used_avoid))
    if any(marker in text for marker in DEVELOPER_MARKERS):
        blocks.append("developer_voice_too_strong")
    if "できます" in text and "これ" not in text:
        warnings.append("copy_may_sound_like_app_description")
    if tone_profile.get("tone_id") == "gen_z_oshi_activity" and not any(word in text for word in ["現場", "遠征", "チケット", "身分証", "持ち物"]):
        blocks.append("oshi_or_event_tone_missing_context_words")
    return blocks, warnings, {
        "passed": not blocks,
        "tone_id": tone_profile.get("tone_id", ""),
        "target_audience": tone_profile.get("target_audience", ""),
        "used_words": used_words,
        "used_avoid_words": used_avoid,
        "block_count": len(blocks),
        "warning_count": len(warnings),
    }


def run(sample: bool = False) -> dict:
    post = load_latest("threads_post.json", {}).get("post", {})
    tone_profile = load_latest("audience_tone_profile.json", {}).get("audience_tone_profile", {})
    selected = load_latest("niche_demand_score.json", {}).get("selected_candidate", {})
    trace = load_latest("market_research_trace.json", {})
    item = (selected or {}).get("item", {}) if isinstance(selected, dict) else {}
    selected_candidate_id = trace.get("selected_candidate_id") or selected.get("candidate_id", "")
    market_evidence_count = int(trace.get("market_evidence_count") or selected.get("evidence_count", 0) or 0)
    blocks = []
    if item.get("target_user") == "unclear":
        blocks.append("target_user_unclear")
    if market_evidence_count < 1:
        blocks.append("market_evidence_count_zero")
    if post.get("candidate_id") and post.get("candidate_id") != selected_candidate_id:
        blocks.append("post_candidate_mismatch")
    tone_blocks, tone_warnings, tone_check_result = _tone_gate(post.get("text", ""), tone_profile)
    blocks.extend(tone_blocks)
    approved = not blocks
    payload = department_output(
        "Risk Control Department",
        "Checked market evidence, candidate consistency, and audience tone before post selection.",
        scores={"tone_block_count": len(tone_blocks), "tone_warning_count": len(tone_warnings)},
        risks=blocks + tone_warnings,
        next_action="select post candidate" if approved else "stop without posting",
        input_sources=["output/reports/market_research_trace.json", "output/reports/niche_demand_score.json", "output/reports/threads_post.json", "output/reports/audience_tone_profile.json"],
        extra={
            "approved": approved,
            "publish_decision": "dry_run" if approved else "skip",
            "block_reasons": blocks,
            "tone_warnings": tone_warnings,
            "tone_check_result": tone_check_result,
        },
    )
    save_stage("quality_risk_gate.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Run quality and risk gate").parse_args()
    run(sample=args.sample)
