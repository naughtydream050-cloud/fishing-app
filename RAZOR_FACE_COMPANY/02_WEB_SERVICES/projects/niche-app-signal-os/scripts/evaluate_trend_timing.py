from __future__ import annotations

from datetime import date

from common import cli_parser, department_output, load_latest, save_stage


def run(sample: bool = False) -> dict:
    research = load_latest("research_inputs.json", {"items": []})
    weekday = date.today().weekday()
    weekend_bonus = 1 if weekday >= 4 else 0
    timing = []
    for item in research.get("items", []):
        category = item.get("niche_category", "")
        score = 5 + weekend_bonus
        if any(key in category for key in ["ライブ", "遠征", "チケット", "推し"]):
            score += 1
        timing.append({"category": category, "timing_score": min(score, 10), "reason": "週末や予定系カテゴリは会話化しやすい"})
    payload = department_output(
        "Trend Timing Department",
        "日付とカテゴリから投稿タイミングを軽量評価しました。",
        scores={"max_timing_score": max([t["timing_score"] for t in timing], default=0)},
        next_action="niche demand scoring",
        input_sources=["output/reports/research_inputs.json"],
        extra={"timing": timing},
    )
    save_stage("trend_timing.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Evaluate trend timing").parse_args()
    run(sample=args.sample)
