from __future__ import annotations

import argparse
from collections import defaultdict
from pathlib import Path
from typing import Any

from common import DATA_DIR, OUTPUT_DIR, REPORTS_DIR, PROJECT_ROOT, read_json, save_stage, today_iso, write_json, write_text


def _score_output(item: dict[str, Any]) -> int:
    quality = int(item.get("quality_score") or 0)
    risk = int(item.get("risk_score") or 0)
    return max(0, quality * 2 - risk)


def _load_post_text(path_text: str) -> str:
    path = PROJECT_ROOT / path_text
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8").strip()


def _category_rollup(daily_outputs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in daily_outputs:
        grouped[item.get("category", "unknown")].append(item)
    rollup = []
    for category, rows in grouped.items():
        avg_quality = round(sum(int(r.get("quality_score") or 0) for r in rows) / max(1, len(rows)), 2)
        avg_risk = round(sum(int(r.get("risk_score") or 0) for r in rows) / max(1, len(rows)), 2)
        rollup.append(
            {
                "category": category,
                "days": len(rows),
                "avg_quality": avg_quality,
                "avg_risk": avg_risk,
                "review_score": sum(_score_output(r) for r in rows),
                "sample_pain": rows[0].get("pain_point", ""),
                "sample_target_user": rows[0].get("target_user", ""),
            }
        )
    return sorted(rollup, key=lambda x: (x["review_score"], x["days"]), reverse=True)


def _select_shortlists(rollup: list[dict[str, Any]], build_candidates: list[dict[str, Any]], note_candidates: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    score_by_category = {row["category"]: row["review_score"] for row in rollup}
    web = sorted(
        build_candidates,
        key=lambda item: (score_by_category.get(item.get("category"), 0), int(item.get("signal_score") or 0)),
        reverse=True,
    )[:3]
    note = sorted(
        note_candidates,
        key=lambda item: (score_by_category.get(item.get("category"), 0), int(item.get("signal_score") or 0)),
        reverse=True,
    )[:3]
    return web, note


def run() -> dict[str, Any]:
    context = read_json(REPORTS_DIR / "latest" / "context-pack.json", {})
    daily_outputs = context.get("daily_outputs", [])
    if not isinstance(daily_outputs, list) or not daily_outputs:
        raise SystemExit("reports/latest/context-pack.json has no daily_outputs")

    build_candidates = read_json(DATA_DIR / "build_candidates.json", [])
    note_candidates = read_json(DATA_DIR / "note_candidates.json", [])
    post_log = read_json(DATA_DIR / "post_log.json", [])
    rollup = _category_rollup(daily_outputs)
    keep_categories = [row["category"] for row in rollup[:4]]
    reduce_categories = [row["category"] for row in rollup[4:] if row["avg_quality"] < 8 or row["avg_risk"] > 3]
    web_shortlist, note_shortlist = _select_shortlists(rollup, build_candidates, note_candidates)

    first_output = daily_outputs[0]
    sample_post = _load_post_text(first_output.get("md", ""))
    decisions = {
        "date": today_iso(),
        "mode": "dry_run_editorial_review",
        "auto_post": False,
        "dry_run": True,
        "threads_api_called": False,
        "keep_categories": keep_categories,
        "reduce_categories": reduce_categories,
        "web_candidate_focus": web_shortlist[0] if web_shortlist else None,
        "note_candidate_focus": note_shortlist[0] if note_shortlist else None,
        "next_manual_review": [
            "投稿文が宣伝に見えないか確認する",
            "画像カードがスマホで読めるか確認する",
            "Web化候補を1つだけ選び、LP化の前に需要仮説を書く",
            "AUTO_POST=true判断は別相談にする",
        ],
    }
    review = {
        "date": today_iso(),
        "status": "ok",
        "counts": {
            "daily_outputs": len(daily_outputs),
            "post_log_entries": len(post_log) if isinstance(post_log, list) else 0,
            "build_candidates": len(build_candidates) if isinstance(build_candidates, list) else 0,
            "note_candidates": len(note_candidates) if isinstance(note_candidates, list) else 0,
        },
        "category_rollup": rollup,
        "web_shortlist": web_shortlist,
        "note_shortlist": note_shortlist,
        "sample_post": sample_post,
        "decisions": decisions,
        "risks": ["AUTO_POST remains false", "No live engagement yet; all decisions are DRY_RUN hypotheses"],
    }

    write_json(DATA_DIR / "category_decisions.json", decisions)
    write_json(DATA_DIR / "web_candidate_shortlist.json", web_shortlist)
    write_json(DATA_DIR / "note_candidate_shortlist.json", note_shortlist)
    save_stage("editorial_review.json", review)
    write_text(
        OUTPUT_DIR / "reports" / "editorial_review.md",
        "\n".join(
            [
                "# Editorial Review",
                "",
                f"- date: {today_iso()}",
                "- mode: dry_run_editorial_review",
                "- auto_post: false",
                "- threads_api_called: false",
                f"- daily_outputs: {len(daily_outputs)}",
                "",
                "## Keep Categories",
                *[f"- {category}" for category in keep_categories],
                "",
                "## Reduce Categories",
                *([f"- {category}" for category in reduce_categories] or ["- none"]),
                "",
                "## Web Candidate Focus",
                f"- {decisions['web_candidate_focus']}",
                "",
                "## Note Candidate Focus",
                f"- {decisions['note_candidate_focus']}",
                "",
                "## Manual Review Next",
                *[f"- {item}" for item in decisions["next_manual_review"]],
                "",
            ]
        ),
    )
    return review


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Review 7-day DRY_RUN batch and select next candidates")
    parser.parse_args()
    run()
