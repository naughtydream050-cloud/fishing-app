from __future__ import annotations

import re

from common import DATA_DIR, cli_parser, department_output, load_latest, read_json, save_stage


GLOBAL_BLOCK_WORDS = ["SaaS", "生産性", "革新的", "完全自動化", "業務効率"]
OSHI_BLOCK_WORDS = ["推し活女子", "完璧に整理", "効率化", "管理しよう", "節約しよう", "無駄遣い"]
DEVELOPER_MARKERS = ["作りました", "作ってます", "試作UIを作ってます", "リリースしました"]
SALESY_IMAGE_MARKERS = ["DRY RUN", "Threads案", "これ欲しい？", "専用で欲しくない？"]


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


def _fingerprint(text: str) -> set[str]:
    normalized = re.sub(r"\s+", "", text)
    return {normalized[i : i + 3] for i in range(max(0, len(normalized) - 2))}


def _similarity(a: str, b: str) -> float:
    left = _fingerprint(a)
    right = _fingerprint(b)
    if not left or not right:
        return 0.0
    return len(left & right) / len(left | right)


def _recent_post_texts(limit: int = 8) -> list[str]:
    raw = read_json(DATA_DIR / "post_log.json", [])
    if not isinstance(raw, list):
        return []
    texts = [entry.get("post_text", "") for entry in raw if isinstance(entry, dict) and entry.get("post_text")]
    return texts[-limit:]


def run(sample: bool = False) -> dict:
    post = load_latest("threads_post.json", {}).get("post", {})
    tone_profile = load_latest("audience_tone_profile.json", {}).get("audience_tone_profile", {})
    selected = load_latest("niche_demand_score.json", {}).get("selected_candidate", {})
    trace = load_latest("market_research_trace.json", {})
    card = load_latest("daily_share_card.json", {})
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
    max_recent_similarity = max([_similarity(post.get("text", ""), recent) for recent in _recent_post_texts()] or [0.0])
    if max_recent_similarity >= 0.58:
        blocks.append(f"post_copy_too_similar_to_recent:{max_recent_similarity:.2f}")
    if card.get("composition") != "mobile-app-screen-only":
        blocks.append("share_card_not_mobile_app_screen_only")
    ratio = card.get("phone_ratio") or {}
    phone_width = int(ratio.get("width") or 0)
    phone_height = int(ratio.get("height") or 0)
    if not phone_width or not phone_height or phone_height / max(phone_width, 1) < 1.65:
        blocks.append("share_card_phone_ratio_not_vertical_enough")
    if not card.get("sales_copy_removed"):
        blocks.append("share_card_sales_copy_not_removed")
    html_path = (card.get("card_paths") or {}).get("html", "")
    if html_path:
        from common import OUTPUT_DIR

        html_file = OUTPUT_DIR.parent / html_path
        html_text = html_file.read_text(encoding="utf-8") if html_file.exists() else ""
        used_sales_markers = [marker for marker in SALESY_IMAGE_MARKERS if marker in html_text]
        if used_sales_markers:
            blocks.append("share_card_contains_sales_markers:" + ",".join(used_sales_markers))
    approved = not blocks
    payload = department_output(
        "Risk Control Department",
        "Checked market evidence, candidate consistency, and audience tone before post selection.",
        scores={"tone_block_count": len(tone_blocks), "tone_warning_count": len(tone_warnings), "max_recent_similarity": round(max_recent_similarity, 3)},
        risks=blocks + tone_warnings,
        next_action="select post candidate" if approved else "stop without posting",
        input_sources=["output/reports/market_research_trace.json", "output/reports/niche_demand_score.json", "output/reports/threads_post.json", "output/reports/audience_tone_profile.json"],
        extra={
            "approved": approved,
            "publish_decision": "dry_run" if approved else "skip",
            "block_reasons": blocks,
            "tone_warnings": tone_warnings,
            "tone_check_result": tone_check_result,
            "share_card_check": {
                "composition": card.get("composition", ""),
                "sales_copy_removed": bool(card.get("sales_copy_removed")),
                "phone_ratio": ratio,
            },
        },
    )
    save_stage("quality_risk_gate.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Run quality and risk gate").parse_args()
    run(sample=args.sample)
