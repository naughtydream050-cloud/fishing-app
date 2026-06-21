from __future__ import annotations

from common import MEMORY_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_text


def _selected_market_candidate() -> dict:
    pack = load_latest("daily_niche_ui_candidates.json", {})
    selected_id = pack.get("selected_candidate_id", "")
    for candidate in pack.get("candidates", []):
        if candidate.get("candidate_id") == selected_id:
            return candidate
    return {}


def _tone_id_for(candidate: dict) -> str:
    blob = " ".join([candidate.get("candidate_id", ""), candidate.get("category", ""), candidate.get("target_user", "")])
    if any(word in blob for word in ["ライブ", "推し", "グッズ", "現場", "遠征"]):
        return "gen_z_oshi_activity"
    if "学生" in blob:
        return "student_casual"
    return "default_light_problem"


def _strategy_for(candidate: dict) -> dict:
    alternatives = candidate.get("existing_alternatives") or []
    target = candidate.get("target_user") or "unclear"
    tone_id = _tone_id_for(candidate)
    if tone_id == "gen_z_oshi_activity":
        language_to_use = ["現場", "忘れがち", "メモ", "スクショ", "あとで見返す", "持ち物", "遠征", "これ使う？"]
        language_to_avoid = ["効率化", "管理しよう", "SaaS", "生産性", "完璧に整理", "推し活女子"]
    elif tone_id == "student_casual":
        language_to_use = ["提出物", "締切", "明日いるやつ", "授業ごと", "見落とす", "これ欲しい？"]
        language_to_avoid = ["学習管理システム", "業務効率", "革新的", "完全自動化"]
    else:
        language_to_use = ["あとで見返す", "散らばる", "探す", "メモ", "ログ", "これ欲しい？"]
        language_to_avoid = ["革新的", "SaaS", "生産性", "完全自動化", "業務効率"]
    return {
        "candidate_id": candidate.get("candidate_id", ""),
        "candidate_category": candidate.get("category", ""),
        "target_user_segment": target,
        "tone_id": tone_id,
        "user_motivation": "今のやり方で足りているようで、毎回少し探す・忘れる・見返せない不便を減らしたい",
        "primary_job": candidate.get("pain_point", ""),
        "current_alternatives": alternatives,
        "language_to_use": language_to_use,
        "language_to_avoid": language_to_avoid,
        "comment_hooks": ["これ欲しい？", "今のやり方で十分？", "専用であったら使う？"],
        "segment_confidence": 8 if target != "unclear" else 4,
    }


def run(sample: bool = False) -> dict:
    candidate = _selected_market_candidate()
    strategy = _strategy_for(candidate) if candidate else {
        "candidate_id": "",
        "candidate_category": "",
        "target_user_segment": "unclear",
        "tone_id": "default_light_problem",
        "user_motivation": "",
        "primary_job": "",
        "current_alternatives": [],
        "language_to_use": [],
        "language_to_avoid": [],
        "comment_hooks": [],
        "segment_confidence": 0,
    }
    strategy["date"] = today_iso()

    memory_path = MEMORY_DIR / "audience" / f"{today_iso()}.md"
    write_text(
        memory_path,
        "\n".join(
            [
                f"# Audience Strategy - {today_iso()}",
                "",
                f"- candidate_id: {strategy['candidate_id']}",
                f"- target_user_segment: {strategy['target_user_segment']}",
                f"- tone_id: {strategy['tone_id']}",
                f"- primary_job: {strategy['primary_job']}",
                "",
                "## Language To Use",
                *[f"- {item}" for item in strategy["language_to_use"]],
                "",
            ]
        ),
    )
    payload = department_output(
        "Audience Strategy Department",
        "Defined the target segment and wording for the selected market-backed candidate.",
        scores={"segment_confidence": strategy["segment_confidence"]},
        risks=[] if strategy["candidate_id"] else ["no_selected_market_candidate"],
        next_action="design intelligence",
        input_sources=["output/reports/daily_niche_ui_candidates.json"],
        extra={"audience_strategy": strategy, "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent))},
    )
    save_stage("audience_strategy.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Define audience strategy for the daily niche UI candidate").parse_args()
    run(sample=args.sample)
