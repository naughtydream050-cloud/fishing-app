from __future__ import annotations

import os

from common import MEMORY_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_text


def _fallback_council(selected: dict | None) -> dict:
    item = (selected or {}).get("item", {})
    category = item.get("niche_category", "生活の小さい面倒解決")
    pain = item.get("pain_point", "毎日の小さい面倒が散らばる")
    idea = item.get("app_idea", "小さい面倒を1画面で整理するミニアプリ")
    target = item.get("target_user", "スマホで生活管理する人")
    score = int((selected or {}).get("score", 0))
    decision = "post" if score >= 7 else "dry_run"
    return {
        "date": today_iso(),
        "selected_niche": category,
        "council": {
            "trend_scout": f"{category}は具体的な生活場面があり、コメントが返りやすい。",
            "niche_analyst": f"対象は{target}。悩みは「{pain}」。",
            "product_builder": f"MVPは「{idea}」を1画面モックで見せる。",
            "growth_reviewer": "完成品宣伝ではなく「これ欲しい？」寄りで反応を見る。",
            "risk_reviewer": "元投稿の文面や画像は使わず、DRY_RUN素材として保存する。",
        },
        "decision": decision,
        "post_angle": f"{pain}を一言で刺し、{idea}の架空UIを見せる。",
        "image_card": {
            "headline": pain,
            "mock_ui": [category, target, "メモ/期限/費用をまとめる"],
            "footer": "こんなサイトあったら便利？",
        },
        "post_text": "",
        "risk_score": 2,
        "quality_score": max(6, min(9, score)),
        "reason_to_skip": None if decision == "post" else "Niche App Signal Scoreが投稿基準未満のためDRY_RUN",
    }


def run(sample: bool = False) -> dict:
    selected = load_latest("niche_demand_score.json", {}).get("selected_candidate")
    provider = "rules_fallback"
    if os.getenv("GEMINI_API_KEY"):
        provider = "gemini_configured_but_not_called_in_mvp"
    elif os.getenv("GROQ_API_KEY"):
        provider = "groq_configured_but_not_called_in_mvp"
    council = _fallback_council(selected)
    write_text(
        MEMORY_DIR / "council" / f"{today_iso()}.md",
        "\n".join(
            [
                f"# LLM Council - {today_iso()}",
                "",
                f"- provider: {provider}",
                f"- selected_niche: {council['selected_niche']}",
                f"- decision: {council['decision']}",
                f"- risk_score: {council['risk_score']}",
                f"- quality_score: {council['quality_score']}",
                "",
                "## Council",
                *[f"- {k}: {v}" for k, v in council["council"].items()],
                "",
            ]
        ),
    )
    payload = department_output(
        "LLM Council Department",
        "API未設定のため、5役の圧縮会議をルールベースfallbackで生成しました。",
        scores={"quality_score": council["quality_score"], "risk_score": council["risk_score"]},
        risks=[],
        next_action="copywriting",
        input_sources=["output/reports/niche_demand_score.json"],
        extra={"provider": provider, "decision_payload": council},
    )
    save_stage("llm_council.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Run compressed LLM Council").parse_args()
    run(sample=args.sample)
