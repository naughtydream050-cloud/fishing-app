from __future__ import annotations

from common import MEMORY_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_text


def _selected_market_candidate() -> dict:
    pack = load_latest("daily_niche_ui_candidates.json", {})
    selected_id = pack.get("selected_candidate_id", "")
    for candidate in pack.get("candidates", []):
        if candidate.get("candidate_id") == selected_id:
            return candidate
    return (pack.get("candidates") or [{}])[0]


def _strategy_for(candidate: dict) -> dict:
    tone_id = candidate.get("tone_id", "default_light_problem")
    if tone_id == "gen_z_oshi_activity":
        return {
            "target_user_segment": "Z世代寄りの推し活層",
            "user_motivation": "現場の記録や出費や思い出を、あとでテンションごと見返したい",
            "primary_job": "現場ごとに座席、セトリ、遠征費、グッズ、感情メモを残す",
            "current_alternatives": ["Notion", "スマホメモ", "スクショ", "写真フォルダ", "支払い履歴"],
            "language_to_use": ["現場", "見返す", "残す", "メモった", "大散乱", "オタクあるある", "Notionで十分？"],
            "language_to_avoid": ["管理", "効率化", "節約", "SaaS", "推し活女子", "作りました"],
            "comment_hooks": ["これ使う？", "Notionで十分？", "みんなのリアルな意見教えてほしい"],
            "segment_confidence": 9,
        }
    target = ", ".join(candidate.get("likely_target_users", [])) or "小さな不便を感じるユーザー"
    return {
        "target_user_segment": target,
        "user_motivation": "小さな不便を軽く残して、あとで探す時間を減らしたい",
        "primary_job": candidate.get("pain_point", "あとで見返したい情報を残す"),
        "current_alternatives": ["スマホメモ", "スクショ", "Notion", "カレンダー"],
        "language_to_use": ["あとで見返す", "散らばる", "メモ", "ログ", "これ欲しい？"],
        "language_to_avoid": ["革新的", "完全自動", "業務効率", "SaaS", "生産性"],
        "comment_hooks": ["これ欲しい？", "今のやり方で十分？"],
        "segment_confidence": 7,
    }


def run(sample: bool = False) -> dict:
    candidate = _selected_market_candidate()
    strategy = _strategy_for(candidate)
    strategy.update(
        {
            "date": today_iso(),
            "candidate_id": candidate.get("candidate_id", ""),
            "candidate_category": candidate.get("category", ""),
            "source_pain_point": candidate.get("pain_point", ""),
            "source_app_idea": candidate.get("ui_metaphor", ""),
            "tone_id": candidate.get("tone_id", "default_light_problem"),
        }
    )

    memory_path = MEMORY_DIR / "audience" / f"{today_iso()}.md"
    write_text(
        memory_path,
        "\n".join(
            [
                f"# Audience Strategy - {today_iso()}",
                "",
                f"- candidate_id: {strategy['candidate_id']}",
                f"- target_user_segment: {strategy['target_user_segment']}",
                f"- user_motivation: {strategy['user_motivation']}",
                f"- primary_job: {strategy['primary_job']}",
                f"- segment_confidence: {strategy['segment_confidence']}",
                "",
                "## Language To Use",
                *[f"- {item}" for item in strategy["language_to_use"]],
                "",
                "## Language To Avoid",
                *[f"- {item}" for item in strategy["language_to_avoid"]],
                "",
                "## Current Alternatives",
                *[f"- {item}" for item in strategy["current_alternatives"]],
                "",
            ]
        ),
    )
    payload = department_output(
        "Audience Strategy Department",
        "Defined who the daily niche UI-card candidate is for, what language should land, and which wording should be avoided.",
        scores={"segment_confidence": strategy["segment_confidence"]},
        risks=[] if strategy["segment_confidence"] >= 7 else ["audience_segment_needs_more_evidence"],
        next_action="design intelligence",
        input_sources=["output/reports/daily_niche_ui_candidates.json"],
        extra={"audience_strategy": strategy, "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent))},
    )
    save_stage("audience_strategy.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Define audience strategy for the daily niche UI candidate").parse_args()
    run(sample=args.sample)
