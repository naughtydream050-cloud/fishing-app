from __future__ import annotations

from collections import Counter

from common import cli_parser, department_output, load_latest, save_stage


def run(sample: bool = False) -> dict:
    research = load_latest("research_inputs.json", {"items": []})
    items = research.get("items", [])
    categories = Counter(i.get("niche_category", "unknown") for i in items)
    wording = Counter(i.get("wording_pattern", "") for i in items if i.get("wording_pattern"))
    visual = Counter(i.get("visual_pattern", "") for i in items if i.get("visual_pattern"))
    patterns = []
    for item in items:
        engagement = int(item.get("likes") or 0) + int(item.get("replies") or 0) * 2 + int(item.get("reposts") or 0) * 3
        saves = item.get("saves_or_bookmarks_if_available") or 0
        patterns.append(
            {
                "category": item.get("niche_category"),
                "pain_point": item.get("pain_point"),
                "wording_pattern": item.get("wording_pattern"),
                "visual_pattern": item.get("visual_pattern"),
                "engagement_signal": engagement + int(saves) * 2,
                "hypothesis": item.get("why_it_worked_hypothesis"),
            }
        )
    payload = department_output(
        "Viral Pattern Department",
        "反応されやすい悩み、言い回し、画像構造を軽量集計しました。",
        scores={"category_count": len(categories), "pattern_count": len(patterns)},
        next_action="memory update",
        input_sources=["output/reports/research_inputs.json"],
        extra={
            "top_categories": categories.most_common(),
            "top_wording_patterns": wording.most_common(5),
            "top_visual_patterns": visual.most_common(5),
            "patterns": sorted(patterns, key=lambda x: x["engagement_signal"], reverse=True),
        },
    )
    save_stage("viral_patterns.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Analyze viral patterns").parse_args()
    run(sample=args.sample)
