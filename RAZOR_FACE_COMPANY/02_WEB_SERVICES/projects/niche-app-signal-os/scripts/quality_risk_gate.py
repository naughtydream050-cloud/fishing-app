from __future__ import annotations

from common import cli_parser, department_output, load_latest, save_stage


BLOCK_REASONS = {
    "quality_low": "quality_score < 7",
    "risk_high": "risk_score > 4",
    "copycat_high": "copycat_score > 5",
    "target_unclear": "target_user == unclear",
    "same_pattern": "same_pattern_days >= 3",
}


def _tone_warnings(text: str, tone_profile: dict) -> list[str]:
    warnings = []
    tone_id = tone_profile.get("tone_id", "")
    avoid_words = [word for word in tone_profile.get("avoid_words", []) if word]
    used_avoid = [word for word in avoid_words if word in text]
    if used_avoid:
        warnings.append(f"tone_avoid_words_used: {', '.join(used_avoid)}")

    explanatory_markers = ["このアプリは", "本サービス", "提供します", "解決します", "機能です"]
    if sum(1 for marker in explanatory_markers if marker in text) >= 2:
        warnings.append("too_explanatory_for_threads")

    unnatural_youth_markers = ["ぴえん", "卍", "草すぎ", "尊すぎて無理み"]
    if any(marker in text for marker in unnatural_youth_markers):
        warnings.append("unnatural_youth_slang")

    management_markers = ["管理", "節約", "効率化", "生産性", "無駄遣い", "課金しすぎ"]
    if tone_id == "gen_z_oshi_activity" and sum(1 for marker in management_markers if marker in text) >= 2:
        warnings.append("oshi_tone_too_management_or_saving_heavy")

    finished_product_markers = ["リリースしました", "正式版", "SaaS", "登録してください", "今すぐ使えます"]
    if any(marker in text for marker in finished_product_markers):
        warnings.append("finished_saas_misread_risk")

    if tone_id == "gen_z_oshi_activity" and not text.startswith(("現場", "ライブ", "推し活")):
        warnings.append("oshi_post_should_start_with_aruaru_or_scene")

    return warnings


def run(sample: bool = False) -> dict:
    council = load_latest("llm_council.json", {}).get("decision_payload", {})
    post = load_latest("threads_post.json", {}).get("post", {})
    tone_profile = load_latest("audience_tone_profile.json", {}).get("audience_tone_profile", {})
    selected = load_latest("niche_demand_score.json", {}).get("selected_candidate", {})
    item = (selected or {}).get("item", {})
    quality_score = int(council.get("quality_score", 0))
    risk_score = int(council.get("risk_score", 9))
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
    tone_warnings = _tone_warnings(post.get("text", ""), tone_profile)
    approved = not blocks and council.get("decision") in {"post", "dry_run"}
    publish_decision = "dry_run" if approved else "skip"
    payload = department_output(
        "Risk Control Department",
        "品質、類似、対象明確性、自動投稿リスクを評価しました。",
        scores={
            "quality_score": quality_score,
            "risk_score": risk_score,
            "copycat_score": copycat_score,
            "same_pattern_days": same_pattern_days,
            "tone_warning_count": len(tone_warnings),
        },
        risks=blocks + tone_warnings,
        next_action="publish dry-run" if approved else "stop without posting",
        input_sources=["output/reports/llm_council.json", "output/reports/threads_post.json", "output/reports/audience_tone_profile.json"],
        extra={"approved": approved, "publish_decision": publish_decision, "block_reasons": blocks, "tone_warnings": tone_warnings},
    )
    save_stage("quality_risk_gate.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Run quality and risk gate").parse_args()
    run(sample=args.sample)
