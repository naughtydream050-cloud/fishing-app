from __future__ import annotations

from common import MEMORY_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_text


def _is_oshi(strategy: dict) -> bool:
    blob = " ".join(str(strategy.get(key, "")) for key in ["target_user_segment", "primary_job", "source_app_idea"])
    return any(token in blob for token in ["推し", "ライブ", "グッズ", "遠征", "参戦", "チケット"])


def _oshi_design() -> dict:
    return {
        "visual_positioning": "かわいく見返せる推し活ログ。管理SaaSではなく、手帳とチケット半券の中間。",
        "ui_metaphor": ["スマホログ", "チケット半券", "手帳", "ステッカー", "感情タグ"],
        "color_direction": ["パステルミント", "ラベンダー", "ピーチ", "淡いスカイブルー", "白いカード"],
        "composition": "大きい悩み見出し + スマホUI + チケット風メモ + CTA",
        "must_show_fields": ["ライブ参戦ログ", "座席", "セトリメモ", "チケット状態", "同行者", "感情タグ", "遠征費合計"],
        "avoid_visuals": ["黒い業務SaaS風", "家計簿アプリ風", "濃い単色", "グラフ中心", "AI生成っぽい抽象背景"],
        "card_cta": "これ欲しい？それともNotionで十分？",
        "design_confidence": 9,
    }


def _generic_design() -> dict:
    return {
        "visual_positioning": "すぐ実装できそうな軽いスマホUI。重いSaaSではなく、日常の小さい面倒を解く試作。",
        "ui_metaphor": ["スマホUI", "チェックリスト", "カード", "メモ"],
        "color_direction": ["白", "淡いグレー", "アクセント1色", "読みやすい余白"],
        "composition": "痛み見出し + 具体フィールド + スマホUI + 質問CTA",
        "must_show_fields": ["対象", "状態", "メモ", "合計", "次の行動"],
        "avoid_visuals": ["抽象イラストのみ", "装飾過多", "実装不能そうな未来UI", "業務ダッシュボード過多"],
        "card_cta": "これ欲しい？それとも今の管理で十分？",
        "design_confidence": 7,
    }


def run(sample: bool = False) -> dict:
    audience = load_latest("audience_strategy.json", {}).get("audience_strategy") or {}
    design = _oshi_design() if _is_oshi(audience) else _generic_design()
    design.update(
        {
            "date": today_iso(),
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
                f"- visual_positioning: {design['visual_positioning']}",
                f"- composition: {design['composition']}",
                f"- card_cta: {design['card_cta']}",
                f"- design_confidence: {design['design_confidence']}",
                "",
                "## UI Metaphor",
                *[f"- {item}" for item in design["ui_metaphor"]],
                "",
                "## Color Direction",
                *[f"- {item}" for item in design["color_direction"]],
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
        "UIカード生成前に、対象ユーザー層へ刺さる見た目・色・構図・避ける表現を定義しました。",
        scores={"design_confidence": design["design_confidence"]},
        risks=[],
        next_action="copywriting and card image",
        input_sources=["output/reports/audience_strategy.json"],
        extra={"design_strategy": design, "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent))},
    )
    save_stage("design_strategy.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Define visual strategy before card generation").parse_args()
    run(sample=args.sample)
