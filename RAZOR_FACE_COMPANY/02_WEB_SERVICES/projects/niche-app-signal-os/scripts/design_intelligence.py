from __future__ import annotations

from common import MEMORY_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_text


FIELD_PRESETS = {
    "live-trip-packing-check": ["チケット", "身分証", "充電器", "双眼鏡", "モバイルバッテリー", "現場メモ"],
    "subscription-overlap-check": ["サービス", "月額", "更新日", "無料期間", "使った日", "見直しメモ"],
    "student-deadline-check": ["授業", "提出物", "締切", "提出先", "持ち物", "明日やる"],
    "goods-stock-log": ["グッズ名", "所持数", "交換予定", "保管場所", "写真", "持ち出し"],
    "receipt-payment-lookback": ["購入日", "お店", "金額", "支払い方法", "レシート", "保証メモ"],
}


def _selected_market_candidate() -> dict:
    pack = load_latest("daily_niche_ui_candidates.json", {})
    selected_id = pack.get("selected_candidate_id", "")
    for candidate in pack.get("candidates", []):
        if candidate.get("candidate_id") == selected_id:
            return candidate
    return {}


def run(sample: bool = False) -> dict:
    audience = load_latest("audience_strategy.json", {}).get("audience_strategy") or {}
    candidate = _selected_market_candidate()
    candidate_id = candidate.get("candidate_id", "")
    fields = FIELD_PRESETS.get(candidate_id) or ["メモ", "状態", "日付", "あとで見返す", "次の行動"]
    design = {
        "date": today_iso(),
        "candidate_id": candidate_id,
        "category": candidate.get("category", ""),
        "pain_point": candidate.get("pain_point", ""),
        "target_audience_for_copy": audience.get("target_user_segment", candidate.get("target_user", "")),
        "audience_context": candidate.get("target_user", ""),
        "visual_positioning": "市場候補の不便が一目で伝わるスマホアプリ画面風カード。完成SaaSではなく、欲しいか聞くDRY_RUN検証の見え方にする。",
        "ui_metaphor_from_market_need": candidate.get("expected_ui_metaphor", ""),
        "ui_metaphor": [candidate.get("expected_ui_metaphor", "スマホログUI")],
        "color_direction": ["パステル", "白ベース", "淡いアクセント", "読みやすい濃色テキスト"],
        "composition": "上部にあるあるコピー、中央に候補専用スマホUI、下部に軽いCTA",
        "must_show_fields": fields,
        "avoid_visuals": ["抽象イラストだけ", "管理画面すぎるUI", "ビジネスSaaS風", "文字過多"],
        "card_cta": "これ欲しい？今のやり方で十分？",
        "copy_tone_hint": audience.get("language_to_use", []),
        "design_confidence": 8 if candidate_id else 0,
    }

    memory_path = MEMORY_DIR / "design_strategy" / f"{today_iso()}.md"
    write_text(
        memory_path,
        "\n".join(
            [
                f"# Design Intelligence - {today_iso()}",
                "",
                f"- candidate_id: {candidate_id}",
                f"- ui_metaphor: {design['ui_metaphor_from_market_need']}",
                f"- composition: {design['composition']}",
                "",
                "## Must Show Fields",
                *[f"- {item}" for item in fields],
                "",
            ]
        ),
    )
    payload = department_output(
        "Design Intelligence Department",
        "Created candidate-specific UI card direction from the selected market need.",
        scores={"design_confidence": design["design_confidence"]},
        risks=[] if candidate_id else ["no_selected_market_candidate"],
        next_action="audience tone adapter",
        input_sources=["output/reports/daily_niche_ui_candidates.json", "output/reports/audience_strategy.json"],
        extra={"design_strategy": design, "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent))},
    )
    save_stage("design_strategy.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Define visual strategy before card generation").parse_args()
    run(sample=args.sample)
