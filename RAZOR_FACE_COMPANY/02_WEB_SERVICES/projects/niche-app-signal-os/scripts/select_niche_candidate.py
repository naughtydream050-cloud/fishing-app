from __future__ import annotations

from common import MEMORY_DIR, OUTPUT_DIR, cli_parser, department_output, load_latest, read_json, save_stage, today_iso, write_json, write_text


FALLBACK_NEEDS = [
    {
        "candidate_id": "oshi-activity-management",
        "category": "推し活管理",
        "pain_point": "現場ごとの座席、セトリ、遠征費、グッズ、思い出がスクショや写真フォルダに散らばる",
        "current_workaround": "Notion、スマホメモ、写真フォルダ、家計簿アプリ、支払い履歴",
        "why_niche": "推し活の熱量と記録欲は強いが、家計簿や汎用メモでは温度感が合いにくい",
        "why_now": "ライブ遠征、グッズ購入、SNS共有が増え、あとで見返す記録の需要が高い",
        "likely_target_users": ["Z世代寄りの推し活層", "ライブ遠征するファン", "グッズ購入が多いファン"],
        "ui_metaphor": "現場ログボード",
        "tone_id": "gen_z_oshi_activity",
        "priority_score": 10,
    },
    {
        "candidate_id": "receipt-life-organizer",
        "category": "レシート生活整理",
        "pain_point": "レシートや購入メモが財布、写真、家計簿アプリに分散してあとで見返せない",
        "current_workaround": "写真フォルダ、家計簿アプリ、紙のレシート保管",
        "why_niche": "家計管理ほど重くなく、生活ログとして残したい層がいる",
        "why_now": "サブスク、ポイント、キャッシュレス決済で支出の記録場所が増えている",
        "likely_target_users": ["一人暮らし社会人", "学生", "生活費をざっくり把握したい人"],
        "ui_metaphor": "生活レシートログ",
        "tone_id": "default_light_problem",
        "priority_score": 7,
    },
    {
        "candidate_id": "student-deadline-check",
        "category": "学生の提出物忘れ防止",
        "pain_point": "課題、提出物、持ち物、締切がLINE、プリント、LMSに散らばって忘れる",
        "current_workaround": "カレンダー、LINEメモ、学校アプリ、手帳",
        "why_niche": "学校ごとの連絡手段が混在していて、学生本人の実感が強い",
        "why_now": "紙とオンライン課題が混在し、締切管理の負担が増えている",
        "likely_target_users": ["高校生", "大学生", "保護者"],
        "ui_metaphor": "提出物チェックリスト",
        "tone_id": "default_light_problem",
        "priority_score": 6,
    },
]


def _from_scored_candidates() -> list[dict]:
    scored = load_latest("niche_demand_score.json", {}).get("scored_candidates", [])
    candidates: list[dict] = []
    for entry in scored[:3]:
        item = entry.get("item", {}) if isinstance(entry, dict) else {}
        category = item.get("niche_category") or item.get("category") or ""
        pain = item.get("pain_point") or ""
        app_idea = item.get("app_idea") or ""
        text = " ".join([category, pain, app_idea])
        is_oshi = any(token in text for token in ["推し", "推し活", "ライブ", "現場", "グッズ", "遠征", "セトリ", "座席"])
        candidate_id = "oshi-activity-management" if is_oshi else (category or "small-niche-need").lower().replace(" ", "-")
        candidates.append(
            {
                "candidate_id": candidate_id,
                "category": category or ("推し活管理" if is_oshi else "小さい不便の記録アプリ"),
                "pain_point": pain or "あとで見返したい情報が散らばる",
                "current_workaround": "Notion、スマホメモ、スクショ、写真フォルダ",
                "why_niche": "専用アプリ化されにくいが、当事者には毎回地味に面倒な困りごと",
                "why_now": "スマホ内の情報量が増え、あとで探すコストが上がっている",
                "likely_target_users": ["Z世代寄りの推し活層"] if is_oshi else [item.get("target_user") or "小さな不便を感じるユーザー"],
                "ui_metaphor": "現場ログボード" if is_oshi else "スマホメモ風ログ",
                "tone_id": "gen_z_oshi_activity" if is_oshi else "default_light_problem",
                "priority_score": int(entry.get("score") or 6),
            }
        )
    return candidates


def run(sample: bool = False) -> dict:
    candidates = _from_scored_candidates() or FALLBACK_NEEDS
    candidates = sorted(candidates, key=lambda item: int(item.get("priority_score", 0)), reverse=True)[:3]
    selected = candidates[0]
    payload = {
        "date": today_iso(),
        "selected_candidate_id": selected["candidate_id"],
        "candidates": candidates,
        "selection_reason": "Highest priority niche need from market/research signals, with a clear target audience and UI metaphor.",
        "dry_run": True,
    }
    write_json(OUTPUT_DIR / "reports" / "daily_niche_ui_candidates.json", payload)
    write_text(
        OUTPUT_DIR / "reports" / "daily_niche_ui_candidates.md",
        "\n".join(
            [
                f"# Daily Niche UI Candidates - {today_iso()}",
                "",
                f"Selected: {selected['candidate_id']} / {selected['category']}",
                "",
                "## Candidates",
                *[
                    "\n".join(
                        [
                            f"### {candidate['candidate_id']}",
                            f"- category: {candidate['category']}",
                            f"- pain_point: {candidate['pain_point']}",
                            f"- target: {', '.join(candidate['likely_target_users'])}",
                            f"- ui_metaphor: {candidate['ui_metaphor']}",
                            f"- score: {candidate['priority_score']}",
                        ]
                    )
                    for candidate in candidates
                ],
                "",
            ]
        ),
    )
    memory_path = MEMORY_DIR / "market_needs" / f"{today_iso()}.md"
    write_text(
        memory_path,
        "\n".join(
            [
                f"# Market Need Department - {today_iso()}",
                "",
                f"- selected_candidate_id: {selected['candidate_id']}",
                f"- category: {selected['category']}",
                f"- pain_point: {selected['pain_point']}",
                f"- current_workaround: {selected['current_workaround']}",
                f"- why_niche: {selected['why_niche']}",
                f"- why_now: {selected['why_now']}",
                f"- likely_target_users: {', '.join(selected['likely_target_users'])}",
                f"- ui_metaphor: {selected['ui_metaphor']}",
            ]
        ),
    )
    report = department_output(
        "Market Need Department",
        "Selected daily niche demand candidates for Threads UI-card generation.",
        scores={"candidate_count": len(candidates), "selected_priority_score": selected["priority_score"]},
        risks=[],
        next_action="audience strategy",
        input_sources=["output/reports/niche_demand_score.json", "memory/reaction/"],
        extra={"daily_niche_ui_candidates": payload, "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent))},
    )
    save_stage("market_need.json", report)
    return report


if __name__ == "__main__":
    args = cli_parser("Select daily niche market need candidates").parse_args()
    run(sample=args.sample)
