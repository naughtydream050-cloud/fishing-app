from __future__ import annotations

from common import OUTPUT_DIR, cli_parser, department_output, load_latest, save_stage, write_text


PAIN_WORDS = ["面倒", "忘れ", "散らば", "探す", "見返", "不安", "困る", "戻る", "行き来"]
WORKAROUND_WORDS = ["写真", "メモ", "LINE", "カレンダー", "明細", "履歴", "Notion", "スプレッドシート", "ポータル"]
UI_WORDS = ["スマホ", "UI", "ボード", "ログ", "カード", "チェック", "棚", "画面"]


def _contains_any(text: str, words: list[str]) -> bool:
    return any(word in text for word in words)


def _score_item(item: dict) -> dict:
    evidence_count = int(item.get("evidence_count") or len(item.get("evidence_texts") or []))
    source_urls = item.get("source_urls") or []
    source_types = item.get("source_types") or []
    pain_text = item.get("pain_point", "")
    workaround = item.get("current_workaround", "")
    alternatives = item.get("existing_alternatives") or []
    target_user = item.get("target_user", "unclear")
    ui_metaphor = item.get("expected_ui_metaphor", "")
    freshness = item.get("research_freshness", "stale_blocked")

    pain_strength = min(10, 3 + min(4, evidence_count) + (2 if len(pain_text) >= 24 else 0) + (1 if _contains_any(pain_text, PAIN_WORDS) else 0))
    niche_specificity = min(10, 3 + (2 if target_user != "unclear" else 0) + (2 if item.get("why_niche") else 0) + (2 if len(alternatives) >= 2 else 0))
    workaround_pain = min(10, 2 + (3 if workaround else 0) + min(3, len(alternatives)) + (2 if _contains_any(workaround, WORKAROUND_WORDS) else 0))
    ui_imagination_score = min(10, 3 + (4 if ui_metaphor else 0) + (2 if _contains_any(ui_metaphor, UI_WORDS) else 0))
    postability_score = min(10, 2 + (2 if evidence_count >= 2 else 0) + (2 if pain_text else 0) + (2 if item.get("why_now") else 0) + (2 if ui_metaphor else 0))
    freshness_bonus = 1 if freshness == "fresh" else 0
    score = round(
        (pain_strength * 0.25)
        + (niche_specificity * 0.2)
        + (workaround_pain * 0.2)
        + (ui_imagination_score * 0.2)
        + (postability_score * 0.15)
        + freshness_bonus,
        2,
    )

    missing = []
    if evidence_count < 1:
        missing.append("evidence_count_zero")
    if not source_urls:
        missing.append("source_urls_empty")
    if target_user == "unclear":
        missing.append("target_user_unclear")
    if not pain_text:
        missing.append("pain_point_missing")
    if not workaround:
        missing.append("current_workaround_missing")
    if not ui_metaphor:
        missing.append("expected_ui_metaphor_missing")
    if freshness == "stale_blocked":
        missing.append("research_freshness_stale_blocked")

    eligible = not missing
    return {
        "candidate_id": item.get("candidate_id", ""),
        "category": item.get("category", ""),
        "score": score,
        "eligible_for_post": eligible,
        "evidence_count": evidence_count,
        "source_urls": source_urls,
        "source_types": source_types,
        "research_freshness": freshness,
        "fallback_reason": item.get("fallback_reason", ""),
        "source_urls_hash": item.get("source_urls_hash", ""),
        "pain_strength": pain_strength,
        "niche_specificity": niche_specificity,
        "workaround_pain": workaround_pain,
        "ui_imagination_score": ui_imagination_score,
        "postability_score": postability_score,
        "item": item,
        "rejected_reason_if_any": None if eligible else ";".join(missing),
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
                    f"- {row['candidate_id']}: score={row['score']} evidence={row['evidence_count']} urls={len(row['source_urls'])} freshness={row['research_freshness']} eligible={row['eligible_for_post']} reject={row['rejected_reason_if_any'] or ''}"
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
