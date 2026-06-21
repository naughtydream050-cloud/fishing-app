from __future__ import annotations

from common import OUTPUT_DIR, cli_parser, department_output, load_latest, save_stage, write_text


def _score_item(item: dict) -> dict:
    evidence_count = len(item.get("evidence_texts") or [])
    pain_text = item.get("pain_point", "")
    workaround = item.get("current_workaround", "")
    alternatives = item.get("existing_alternatives") or []
    target_user = item.get("target_user", "unclear")
    ui_metaphor = item.get("expected_ui_metaphor", "")

    pain_strength = min(10, 3 + min(4, evidence_count) + (2 if len(pain_text) >= 24 else 0) + (1 if any(w in pain_text for w in ["毎回", "忘れ", "散らば", "探し", "面倒"]) else 0))
    niche_specificity = min(10, 3 + (2 if target_user != "unclear" else 0) + (2 if item.get("why_niche") else 0) + (2 if len(alternatives) >= 2 else 0))
    workaround_pain = min(10, 2 + (3 if workaround else 0) + min(3, len(alternatives)) + (2 if any(w in workaround for w in ["別々", "行き来", "探", "作り直"]) else 0))
    ui_imagination_score = min(10, 3 + (4 if ui_metaphor else 0) + (2 if any(w in ui_metaphor for w in ["UI", "チェック", "ボード", "ログ", "カード", "棚"]) else 0))
    postability_score = min(10, 2 + (2 if evidence_count >= 2 else 0) + (2 if pain_text else 0) + (2 if item.get("why_now") else 0) + (2 if ui_metaphor else 0))
    score = round((pain_strength * 0.25) + (niche_specificity * 0.2) + (workaround_pain * 0.2) + (ui_imagination_score * 0.2) + (postability_score * 0.15), 2)

    eligible = all(
        [
            evidence_count >= 1,
            target_user != "unclear",
            bool(pain_text),
            bool(workaround),
            bool(ui_metaphor),
        ]
    )
    return {
        "candidate_id": item.get("candidate_id", ""),
        "category": item.get("category", ""),
        "score": score,
        "eligible_for_post": eligible,
        "evidence_count": evidence_count,
        "pain_strength": pain_strength,
        "niche_specificity": niche_specificity,
        "workaround_pain": workaround_pain,
        "ui_imagination_score": ui_imagination_score,
        "postability_score": postability_score,
        "item": item,
        "rejected_reason_if_any": None if eligible else "missing_required_market_fields_or_evidence",
    }


def run(sample: bool = False) -> dict:
    research = load_latest("research_inputs.json", {"items": []})
    scored = [_score_item(item) for item in research.get("items", [])]
    scored.sort(key=lambda row: (row["eligible_for_post"], row["score"], row["evidence_count"]), reverse=True)
    selected = next((row for row in scored if row["eligible_for_post"]), None)

    md_path = OUTPUT_DIR / "reports" / "niche_demand_score.md"
    write_text(
        md_path,
        "\n".join(
            [
                "# Niche Demand Score",
                "",
                f"- candidate_count: {len(scored)}",
                f"- selected_candidate: {selected.get('candidate_id') if selected else 'null'}",
                "",
                "## Scored Candidates",
                *[
                    f"- {row['candidate_id']}: score={row['score']} evidence={row['evidence_count']} eligible={row['eligible_for_post']}"
                    for row in scored
                ],
                "",
            ]
        ),
    )

    payload = department_output(
        "Market Need Department",
        "Scored market-backed niche needs and selected the highest eligible candidate without fixed fallback.",
        scores={"candidate_count": len(scored), "selected_score": selected["score"] if selected else 0},
        risks=[] if selected else ["no_eligible_market_candidate"],
        next_action="select niche candidate" if selected else "stop without posting",
        input_sources=["output/reports/research_inputs.json"],
        extra={"scored_candidates": scored, "selected_candidate": selected, "report_path": "output/reports/niche_demand_score.md"},
    )
    save_stage("niche_demand_score.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Score niche demand").parse_args()
    run(sample=args.sample)
