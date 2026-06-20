from __future__ import annotations

from common import DATA_DIR, MEMORY_DIR, cli_parser, department_output, load_latest, read_json, save_stage, today_iso, write_json, write_text


def run(sample: bool = False) -> dict:
    selected = load_latest("niche_demand_score.json", {}).get("selected_candidate", {})
    item = (selected or {}).get("item", {})
    category = item.get("niche_category", "生活の小さい面倒解決")
    score = int((selected or {}).get("score", 0))
    audience = load_latest("audience_strategy.json", {}).get("audience_strategy", {})
    design = load_latest("design_strategy.json", {}).get("design_strategy", {})
    reaction_memory = read_json(DATA_DIR / "reaction_memory.json", {"entries": []})
    reaction_entries = reaction_memory.get("entries", []) if isinstance(reaction_memory, dict) else []
    next_weights = {category: max(1, score)}
    build_candidates = [
        {
            "category": category,
            "idea": item.get("app_idea", ""),
            "reason": item.get("why_it_worked_hypothesis", ""),
            "signal_score": score,
            "audience_segment": audience.get("target_user_segment", ""),
            "design_positioning": design.get("visual_positioning", ""),
            "next_step": "反応が重複したらLPまたは待機リストMVPにする",
        }
    ]
    note_candidates = [
        {
            "category": category,
            "angle": f"なぜ「{item.get('pain_point', '小さい面倒')}」をアプリ化したくなるのか",
            "signal_score": score,
            "audience_segment": audience.get("target_user_segment", ""),
        }
    ]
    write_json(DATA_DIR / "next_week_seed_weights.json", next_weights)
    write_json(DATA_DIR / "build_candidates.json", build_candidates)
    write_json(DATA_DIR / "note_candidates.json", note_candidates)
    weekly = "\n".join(
        [
            "# Weekly Report",
            "",
            f"- updated: {today_iso()}",
            f"- strongest_category: {category}",
            f"- signal_score: {score}",
            "- weak_categories: insufficient data",
            "- commentable_pain: specific scattered information, deadline, or cost tracking",
            "- strong_visual_structure: pain headline + simple mock UI + small benefit",
            "- strong_copy_structure: pain first, then app idea, then soft question",
            "- web_candidates: see data/build_candidates.json",
            "- note_candidates: see data/note_candidates.json",
            f"- audience_segment: {audience.get('target_user_segment', '')}",
            f"- design_positioning: {design.get('visual_positioning', '')}",
            f"- reaction_memory_entries: {len(reaction_entries)}",
            "- increase_next_week: categories with replies/saves",
            "- decrease_next_week: unclear target user or repeated pattern",
            "",
        ]
    )
    write_text(MEMORY_DIR / "reports" / "weekly_report.md", weekly)
    payload = department_output(
        "Executive Department",
        "次週seed weight、Web化候補、note化候補、週次レポートを更新しました。",
        scores={"build_candidates": len(build_candidates), "note_candidates": len(note_candidates)},
        risks=[],
        next_action="review artifacts",
        input_sources=["output/reports/threads_insights.json"],
        extra={
            "next_week_seed_weights": next_weights,
            "build_candidates": build_candidates,
            "note_candidates": note_candidates,
            "weekly_report": "memory/reports/weekly_report.md",
            "audience_strategy": audience,
            "design_strategy": design,
            "reaction_memory_entries": len(reaction_entries),
        },
    )
    save_stage("learning.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Analyze learning").parse_args()
    run(sample=args.sample)
