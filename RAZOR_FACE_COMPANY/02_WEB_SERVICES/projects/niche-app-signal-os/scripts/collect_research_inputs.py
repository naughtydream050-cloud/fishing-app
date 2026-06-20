from __future__ import annotations

from common import DATA_DIR, cli_parser, department_output, ensure_dirs, load_research_items, read_json, sample_research_items, save_stage


def run(sample: bool = False) -> dict:
    ensure_dirs()
    runtime = DATA_DIR / "research_sources.runtime.json"
    items = sample_research_items() if sample else (read_json(runtime, None) if runtime.exists() else load_research_items())
    normalized = []
    for item in items:
        normalized.append(
            {
                "source_platform": item.get("source_platform", "manual"),
                "source_url": item.get("source_url", ""),
                "original_text": item.get("original_text", ""),
                "image_path": item.get("image_path", ""),
                "impressions": item.get("impressions", 0),
                "likes": item.get("likes", 0),
                "replies": item.get("replies", 0),
                "reposts": item.get("reposts", 0),
                "saves_or_bookmarks_if_available": item.get("saves_or_bookmarks_if_available"),
                "niche_category": item.get("niche_category", "生活の小さい面倒解決"),
                "target_user": item.get("target_user", "unclear"),
                "pain_point": item.get("pain_point", ""),
                "app_idea": item.get("app_idea", ""),
                "wording_pattern": item.get("wording_pattern", ""),
                "visual_pattern": item.get("visual_pattern", ""),
                "why_it_worked_hypothesis": item.get("why_it_worked_hypothesis", ""),
            }
        )
    payload = department_output(
        "Research Department",
        f"{len(normalized)}件の手動/JSONリサーチ入力を正規化しました。",
        scores={"items": len(normalized)},
        risks=[],
        next_action="viral pattern analysis",
        input_sources=sorted({i["source_platform"] for i in normalized}),
        extra={"items": normalized},
    )
    save_stage("research_inputs.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Collect manual research inputs").parse_args()
    run(sample=args.sample)
