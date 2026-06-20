from __future__ import annotations

from common import MEMORY_DIR, cli_parser, department_output, load_latest, read_json, save_stage, today_iso, write_text


OSHI_MARKERS = ["oshi", "推し", "推し活", "ライブ", "現場", "グッズ", "遠征", "セトリ", "座席"]


def _selected_item() -> dict:
    scored = load_latest("niche_demand_score.json", {}).get("selected_candidate", {})
    return (scored or {}).get("item", {}) if isinstance(scored, dict) else {}


def _selected_market_candidate() -> dict:
    pack = load_latest("daily_niche_ui_candidates.json", {})
    selected_id = pack.get("selected_candidate_id", "")
    for candidate in pack.get("candidates", []):
        if candidate.get("candidate_id") == selected_id:
            return candidate
    return (pack.get("candidates") or [{}])[0]


def _is_oshi(audience: dict, selected_item: dict, market_candidate: dict) -> bool:
    handoff = read_json(MEMORY_DIR.parent / "data" / "web_candidate_handoff.json", {})
    blob = " ".join(
        [
            str(audience),
            str(selected_item),
            str(market_candidate),
            str(handoff),
        ]
    )
    return "oshi-activity-management" in blob or any(marker in blob for marker in OSHI_MARKERS)


def _oshi_design(audience: dict) -> dict:
    return {
        "target_audience_for_copy": "Z世代寄りの推し活層",
        "audience_context": "ライブ参戦後に座席、セトリ、遠征費、グッズ、写真、メモが散らばりがちな推し活ユーザー",
        "visual_positioning": "パステル寄りのスマホUIで、現場ごとの記録をあとで見返せるログボードとして見せる。",
        "ui_metaphor": ["スマホの現場ログ", "チェックリスト", "写真フォルダ", "感情タグ", "遠征費メモ"],
        "color_direction": ["ミント", "ラベンダー", "淡いピンク", "スカイブルー", "白いカード"],
        "composition": "あるある見出し + スマホUI + 現場ログの具体フィールド + 軽い質問CTA",
        "must_show_fields": ["ライブ参戦ログ", "座席", "セトリメモ", "チケット状態", "同行者", "感情タグ", "遠征費合計"],
        "avoid_visuals": ["業務SaaS風", "家計簿アプリ風", "黒一色", "重いダッシュボード", "AI生成風の抽象背景"],
        "card_cta": "これ欲しい？それともNotionで十分？",
        "copy_tone_hint": "説明口調を避け、あるあるから入り、現場・見返す・残す・散らばるを自然に使う。",
        "design_confidence": 9,
    }


def _generic_design(audience: dict) -> dict:
    return {
        "target_audience_for_copy": audience.get("target_user_segment", "小さな不便を感じているユーザー"),
        "audience_context": audience.get("primary_job", "日常の小さな情報をあとで見返したい人"),
        "visual_positioning": "すぐ実装できそうな軽いスマホUIとして、未完成SaaSではなく検証中の道具に見せる。",
        "ui_metaphor": ["スマホUI", "メモ", "チェックリスト", "カード"],
        "color_direction": ["白", "淡いグレー", "読みやすいアクセント色"],
        "composition": "小さな不便のあるある + 具体フィールド + 使うかどうかの質問CTA",
        "must_show_fields": ["対象", "状態", "メモ", "合計", "次の行動"],
        "avoid_visuals": ["抽象イラストのみ", "装飾過多", "業務ダッシュボード風"],
        "card_cta": "これ欲しい？それとも今のやり方で十分？",
        "copy_tone_hint": "対象ユーザーの日常語で、機能説明より悩みの具体例から入る。",
        "design_confidence": 7,
    }


def run(sample: bool = False) -> dict:
    audience = load_latest("audience_strategy.json", {}).get("audience_strategy") or {}
    selected_item = _selected_item()
    market_candidate = _selected_market_candidate()
    design = _oshi_design(audience) if _is_oshi(audience, selected_item, market_candidate) else _generic_design(audience)
    design.update(
        {
            "date": today_iso(),
            "candidate_id": market_candidate.get("candidate_id", ""),
            "category": market_candidate.get("category", ""),
            "pain_point": market_candidate.get("pain_point", ""),
            "ui_metaphor_from_market_need": market_candidate.get("ui_metaphor", ""),
            "target_user_segment": audience.get("target_user_segment", ""),
            "source_primary_job": audience.get("primary_job", ""),
        }
    )

    memory_path = MEMORY_DIR / "design_strategy" / f"{today_iso()}.md"
    write_text(
        memory_path,
        "\n".join(
            [
                f"# Design Intelligence - {today_iso()}",
                "",
                f"- target_audience_for_copy: {design['target_audience_for_copy']}",
                f"- visual_positioning: {design['visual_positioning']}",
                f"- composition: {design['composition']}",
                f"- card_cta: {design['card_cta']}",
                f"- copy_tone_hint: {design['copy_tone_hint']}",
                "",
                "## Must Show Fields",
                *[f"- {item}" for item in design["must_show_fields"]],
                "",
                "## Avoid Visuals",
                *[f"- {item}" for item in design["avoid_visuals"]],
                "",
            ]
        ),
    )
    payload = department_output(
        "Design Intelligence Department",
        "UI/card target audience, visual direction, and copy tone hints were defined before copywriting.",
        scores={"design_confidence": design["design_confidence"]},
        risks=[],
        next_action="audience tone adapter",
        input_sources=["output/reports/daily_niche_ui_candidates.json", "output/reports/audience_strategy.json", "output/reports/niche_demand_score.json"],
        extra={"design_strategy": design, "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent))},
    )
    save_stage("design_strategy.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Define visual strategy before card generation").parse_args()
    run(sample=args.sample)
