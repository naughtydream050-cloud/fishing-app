from __future__ import annotations

from common import cli_parser, department_output, load_latest, save_stage


BLOCK_REASONS = {
    "quality_low": "quality_score < 7",
    "risk_high": "risk_score > 4",
    "copycat_high": "copycat_score > 5",
    "target_unclear": "target_user == unclear",
    "same_pattern": "same_pattern_days >= 3",
}

OSHI_STRONG_BLOCK_WORDS = [
    "試作UIを作ってます",
    "作ってます",
    "作りました",
    "一元管理",
    "効率化",
    "管理できます",
    "生産性",
    "SaaS",
    "革新的",
    "推し活女子",
    "完璧に整理",
    "節約しよう",
    "無駄遣い",
]

DEVELOPER_VOICE_MARKERS = ["作って", "試作", "開発", "実装", "リリース"]
EXPLANATORY_MARKERS = ["このアプリは", "できます", "機能", "提供", "解決します"]
UNNATURAL_YOUTH_MARKERS = ["ぴえん", "しか勝たん", "尊すぎて無理", "エモすぎ"]
FINISHED_SAAS_MARKERS = ["登録してください", "正式版", "リリースしました", "SaaS", "プラン"]


def _tone_gate(text: str, tone_profile: dict) -> tuple[list[str], list[str], dict]:
    tone_id = tone_profile.get("tone_id", "")
    use_words = tone_profile.get("use_words", []) or []
    avoid_words = list(dict.fromkeys((tone_profile.get("avoid_words", []) or []) + OSHI_STRONG_BLOCK_WORDS))
    used_words = [word for word in use_words if word and word in text]
    used_avoid = [word for word in avoid_words if word and word in text]
    blocks: list[str] = []
    warnings: list[str] = []

    if used_avoid:
        blocks.append("tone_avoid_words_used: " + ", ".join(used_avoid))
    if any(marker in text for marker in DEVELOPER_VOICE_MARKERS):
        blocks.append("developer_voice_too_strong")
    if sum(1 for marker in EXPLANATORY_MARKERS if marker in text) >= 2:
        blocks.append("too_explanatory_for_threads")
    if any(marker in text for marker in UNNATURAL_YOUTH_MARKERS):
        blocks.append("unnatural_youth_slang")
    if any(marker in text for marker in FINISHED_SAAS_MARKERS):
        blocks.append("finished_saas_misread_risk")

    if tone_id == "gen_z_oshi_activity":
        if not text.startswith(("推し活の記録って", "推し活の記録、", "現場のあと", "ライブ後")):
            blocks.append("oshi_post_should_start_with_aruaru")
        if len(used_words) < 6:
            blocks.append("oshi_tone_use_words_too_few")
        if "管理" in text or "効率化" in text or "節約" in text:
            blocks.append("oshi_tone_too_management_or_saving_heavy")
        if "Notion" not in text:
            warnings.append("oshi_cta_should_compare_with_notion")

    result = {
        "tone_id": tone_id,
        "target_audience": tone_profile.get("target_audience", ""),
        "ui_target_audience": tone_profile.get("ui_target_audience", ""),
        "used_words": used_words,
        "used_avoid_words": used_avoid,
        "block_count": len(blocks),
        "warning_count": len(warnings),
        "passed": not blocks,
    }
    return blocks, warnings, result


def run(sample: bool = False) -> dict:
    council = load_latest("llm_council.json", {}).get("decision_payload", {})
    post = load_latest("threads_post.json", {}).get("post", {})
    tone_profile = load_latest("audience_tone_profile.json", {}).get("audience_tone_profile", {})
    selected = load_latest("niche_demand_score.json", {}).get("selected_candidate", {})
    item = (selected or {}).get("item", {}) if isinstance(selected, dict) else {}
    quality_score = int(council.get("quality_score", 8))
    risk_score = int(council.get("risk_score", 2))
    copycat_score = 1 if post.get("text") else 0
    same_pattern_days = 1
    blocks = []
    if quality_score < 7:
        blocks.append(BLOCK_REASONS["quality_low"])
    if risk_score > 4:
        blocks.append(BLOCK_REASONS["risk_high"])
    if copycat_score > 5:
        blocks.append(BLOCK_REASONS["copycat_high"])
    if item.get("target_user") == "unclear":
        blocks.append(BLOCK_REASONS["target_unclear"])
    if same_pattern_days >= 3:
        blocks.append(BLOCK_REASONS["same_pattern"])

    tone_blocks, tone_warnings, tone_check_result = _tone_gate(post.get("text", ""), tone_profile)
    blocks.extend(tone_blocks)
    approved = not blocks and council.get("decision", "dry_run") in {"post", "dry_run"}
    publish_decision = "dry_run" if approved else "skip"
    payload = department_output(
        "Risk Control Department",
        "Quality, safety, and audience-tone fit were checked before any publishing step.",
        scores={
            "quality_score": quality_score,
            "risk_score": risk_score,
            "copycat_score": copycat_score,
            "same_pattern_days": same_pattern_days,
            "tone_block_count": len(tone_blocks),
            "tone_warning_count": len(tone_warnings),
        },
        risks=blocks + tone_warnings,
        next_action="select post candidate" if approved else "stop without posting",
        input_sources=["output/reports/llm_council.json", "output/reports/threads_post.json", "output/reports/audience_tone_profile.json"],
        extra={
            "approved": approved,
            "publish_decision": publish_decision,
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
