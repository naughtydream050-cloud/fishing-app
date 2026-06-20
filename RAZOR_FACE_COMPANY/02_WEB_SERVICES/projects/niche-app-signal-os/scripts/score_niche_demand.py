from __future__ import annotations

from common import cli_parser, department_output, load_latest, save_stage


def run(sample: bool = False) -> dict:
    research = load_latest("research_inputs.json", {"items": []})
    timing = {i["category"]: i["timing_score"] for i in load_latest("trend_timing.json", {"timing": []}).get("timing", [])}
    scored = []
    for item in research.get("items", []):
        engagement = int(item.get("likes") or 0) + int(item.get("replies") or 0) * 2 + int(item.get("reposts") or 0) * 3
        saves = int(item.get("saves_or_bookmarks_if_available") or 0)
        clarity = 0 if item.get("target_user") == "unclear" else 2
        score = min(10, 3 + engagement // 8 + saves // 3 + clarity + timing.get(item.get("niche_category"), 5) // 3)
        scored.append({"score": score, "item": item})
    scored.sort(key=lambda x: x["score"], reverse=True)
    selected = scored[0] if scored else None
    payload = department_output(
        "Planning Department",
        "Niche App Signal Scoreで今日の候補を選びました。",
        scores={"selected_score": selected["score"] if selected else 0, "candidate_count": len(scored)},
        risks=[] if selected and selected["score"] >= 7 else ["score_below_post_threshold"],
        next_action="llm council",
        input_sources=["output/reports/research_inputs.json", "output/reports/trend_timing.json"],
        extra={"scored_candidates": scored, "selected_candidate": selected},
    )
    save_stage("niche_demand_score.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Score niche demand").parse_args()
    run(sample=args.sample)
