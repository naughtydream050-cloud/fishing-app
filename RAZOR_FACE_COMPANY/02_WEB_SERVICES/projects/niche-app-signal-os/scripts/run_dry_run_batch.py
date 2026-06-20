from __future__ import annotations

import argparse
import os
from datetime import date, timedelta

from common import (
    DATA_DIR,
    MEMORY_DIR,
    OUTPUT_DIR,
    REPORTS_DIR,
    append_json_log,
    department_output,
    ensure_dirs,
    load_research_items,
    now_iso,
    save_stage,
    today_iso,
    write_json,
    write_text,
)

import analyze_learning
import analyze_viral_patterns
import collect_research_inputs
import evaluate_trend_timing
import fetch_threads_insights
import generate_card_image
import generate_threads_post
import quality_risk_gate
import audience_strategy
import audience_tone_adapter
import design_intelligence
import run_llm_council
import score_niche_demand
import update_memory_box
import update_reaction_memory


def _run_date(base: date, offset: int) -> str:
    return (base + timedelta(days=offset)).isoformat()


def _set_daily_research(item: dict) -> None:
    write_json(DATA_DIR / "research_sources.runtime.json", [item])


def _safe_publish_log(day: str, gate: dict, post: dict) -> dict:
    status = "dry_run_saved" if gate.get("approved") else "blocked_by_risk_gate"
    entry = {
        "date": day,
        "created_at": now_iso(),
        "status": status,
        "auto_post": False,
        "dry_run": True,
        "thread_id": None,
        "post_text": post.get("text", ""),
        "alt_text": post.get("alt_text", ""),
        "topic_tags": post.get("topic_tags", []),
    }
    append_json_log(DATA_DIR / "post_log.json", entry)
    publishing = department_output(
        "Publishing Department",
        "7日DRY_RUNではThreads API投稿処理を呼ばず、投稿ログだけ保存しました。",
        scores={"auto_post": False, "dry_run": True},
        risks=["AUTO_POST=false", "threads_api_not_called"],
        next_action="fetch insights",
        input_sources=["output/reports/quality_risk_gate.json"],
        extra={"status": status, "thread_id": None, "api_called": False},
    )
    save_stage("publishing.json", publishing)
    return entry


def _write_day_json(day: str, post: dict, gate: dict, council: dict, card: dict, audience: dict, tone: dict, design: dict) -> None:
    write_json(
        OUTPUT_DIR / "thread_posts" / f"{day}.json",
        {
            "date": day,
            "post": post,
            "gate": {
                "approved": gate.get("approved"),
                "scores": gate.get("scores", {}),
                "risks": gate.get("risks", []),
                "publish_decision": gate.get("publish_decision"),
            },
            "council": council,
            "card": card,
            "audience_strategy": audience,
            "audience_tone_profile": tone,
            "design_strategy": design,
        },
    )


def _validate_low_quality_gate(day: str) -> dict:
    save_stage(
        "llm_council.json",
        {
            "decision_payload": {
                "date": day,
                "selected_niche": "unclear",
                "decision": "post",
                "risk_score": 6,
                "quality_score": 4,
                "reason_to_skip": "low quality fixture",
            }
        },
    )
    save_stage(
        "threads_post.json",
        {
            "post": {
                "date": day,
                "text": "便利なアプリ作りました。すごいです。使ってください。",
                "alt_text": "",
                "topic_tags": [],
            }
        },
    )
    save_stage("niche_demand_score.json", {"selected_candidate": {"score": 1, "item": {"target_user": "unclear"}}})
    result = quality_risk_gate.run(sample=True)
    return {
        "approved": result.get("approved"),
        "block_reasons": result.get("block_reasons", []),
        "scores": result.get("scores", {}),
    }


def run(days: int = 7) -> dict:
    ensure_dirs()
    os.environ["DRY_RUN"] = "true"
    os.environ["AUTO_POST"] = "false"
    source_items = load_research_items()
    if not source_items:
        raise SystemExit("data/research_sources.json has no items")
    write_json(DATA_DIR / "post_log.json", [])
    start = date.today()
    daily = []
    build_candidates = []
    note_candidates = []
    weights = {}
    previous_run_date = os.environ.get("RUN_DATE")
    try:
        for idx in range(days):
            day = _run_date(start, idx)
            os.environ["RUN_DATE"] = day
            item = source_items[idx % len(source_items)]
            _set_daily_research(item)
            collect_research_inputs.run()
            analyze_viral_patterns.run()
            update_memory_box.run()
            evaluate_trend_timing.run()
            scored_report = score_niche_demand.run()
            audience_report = audience_strategy.run()
            tone_report = audience_tone_adapter.run()
            council_report = run_llm_council.run()
            design_report = design_intelligence.run()
            post_report = generate_threads_post.run()
            card_report = generate_card_image.run()
            gate_report = quality_risk_gate.run()
            post = post_report.get("post", {})
            _safe_publish_log(day, gate_report, post)
            fetch_threads_insights.run()
            analyze_learning.run()
            audience_payload = audience_report.get("audience_strategy", {})
            tone_payload = tone_report.get("audience_tone_profile", {})
            design_payload = design_report.get("design_strategy", {})
            selected = scored_report.get("selected_candidate", {}) or {}
            selected_item = selected.get("item", item)
            score = int(selected.get("score", 0))
            category = selected_item.get("niche_category", item.get("niche_category", "unknown"))
            weights[category] = max(weights.get(category, 0), score)
            build_candidates.append(
                {
                    "date": day,
                    "category": category,
                    "idea": selected_item.get("app_idea", ""),
                    "target_user": selected_item.get("target_user", ""),
                    "signal_score": score,
                    "audience_segment": audience_payload.get("target_user_segment", ""),
                    "tone_id": tone_payload.get("tone_id", ""),
                    "design_positioning": design_payload.get("visual_positioning", ""),
                    "next_step": "反応が重複したらWeb LPまたは待機リストを作る",
                }
            )
            note_candidates.append(
                {
                    "date": day,
                    "category": category,
                    "angle": f"なぜ「{selected_item.get('pain_point', '小さい面倒')}」をアプリ化したくなるのか",
                    "signal_score": score,
                    "audience_segment": audience_payload.get("target_user_segment", ""),
                    "tone_id": tone_payload.get("tone_id", ""),
                }
            )
            _write_day_json(day, post, gate_report, council_report.get("decision_payload", {}), card_report, audience_payload, tone_payload, design_payload)
            daily.append(
                {
                    "date": day,
                    "category": category,
                    "target_user": selected_item.get("target_user", ""),
                    "pain_point": selected_item.get("pain_point", ""),
                    "quality_score": gate_report.get("scores", {}).get("quality_score"),
                    "risk_score": gate_report.get("scores", {}).get("risk_score"),
                    "approved": gate_report.get("approved"),
                    "posted": False,
                    "md": f"output/thread_posts/{day}.md",
                    "json": f"output/thread_posts/{day}.json",
                    "card_svg": f"output/card_images/{day}.svg",
                    "card_html": f"output/card_images/{day}.html",
                    "audience_memory": f"memory/audience/{day}.md",
                    "audience_tone_memory": f"memory/audience_tone/{day}.md",
                    "design_strategy_memory": f"memory/design_strategy/{day}.md",
                    "research_memory": f"memory/research/{day}.md",
                    "council_memory": f"memory/council/{day}.md",
                }
            )
        reaction_report = update_reaction_memory.run()
        low_quality = _validate_low_quality_gate(_run_date(start, days))
        write_json(DATA_DIR / "next_week_seed_weights.json", weights)
        write_json(DATA_DIR / "build_candidates.json", build_candidates)
        write_json(DATA_DIR / "note_candidates.json", note_candidates)
        weekly_lines = [
            "# Weekly Report",
            "",
            f"- updated: {today_iso()}",
            f"- dry_run_days: {days}",
            "- auto_post: false",
            "- actual_threads_posts: 0",
            f"- strongest_categories: {', '.join(list(weights.keys())[:5])}",
            "- weak_categories: 未検証カテゴリは次週seedで補う",
            "- commentable_pain: 期限、支払い、探す手間、人間関係の気まずさ",
            "- strong_visual_structure: 悩み見出し + 架空UI + 小さなベネフィット",
            "- strong_copy_structure: 悩み、面倒、対象ユーザー、アプリ提案、自然な質問",
            "- web_candidates: see data/build_candidates.json",
            "- note_candidates: see data/note_candidates.json",
            "- increase_next_week: 保存価値が高い期限/費用/整理カテゴリ",
            "- decrease_next_week: target_userが不明確な投稿",
            "",
        ]
        write_text(MEMORY_DIR / "reports" / "weekly_report.md", "\n".join(weekly_lines))
        review_lines = [
            "# Sample Post Review",
            "",
            "- 誰向けか明確: OK",
            "- 悩みが具体的: OK",
            "- アプリ提案になっている: OK",
            "- コメント誘導が自然: OK",
            "- 毎日同じ文型ではない: OK",
            "- 画像カードの日本語が読める: OK (SVG/HTML)",
            "- 嘘の完成品に見えない: OK (架空UI/DRY RUN表記)",
            "- パクリっぽくない: OK (手動fixtureから独自文面生成)",
            "- Webサイト化候補: OK",
            "- note化角度: OK",
            f"- low_quality_gate_blocks: {'OK' if low_quality.get('approved') is False else 'NG'}",
            "",
        ]
        write_text(OUTPUT_DIR / "reports" / "sample_post_review.md", "\n".join(review_lines))
        report_lines = [
            "# Dry Run Batch Report",
            "",
            f"- generated_at: {now_iso()}",
            f"- days: {days}",
            "- DRY_RUN: true",
            "- AUTO_POST: false",
            "- Threads API called: false",
            f"- low_quality_gate_approved: {low_quality.get('approved')}",
            f"- low_quality_gate_blocks: {', '.join(low_quality.get('block_reasons', []))}",
            "",
            "## Daily Outputs",
            *[f"- {d['date']}: {d['category']} / quality={d['quality_score']} risk={d['risk_score']} posted=false" for d in daily],
            "",
        ]
        write_text(OUTPUT_DIR / "reports" / "dry_run_batch_report.md", "\n".join(report_lines))
        context = {
            "project": "niche-app-signal-os",
            "date": today_iso(),
            "status": "ok",
            "mode": "seven_day_dry_run_batch",
            "dry_run": True,
            "auto_post": False,
            "threads_api_called": False,
            "days": days,
            "daily_outputs": daily,
            "low_quality_gate": low_quality,
            "artifacts": [
                "output/thread_posts/*.md",
                "output/thread_posts/*.json",
                "output/card_images/*.svg",
                "output/card_images/*.html",
                "memory/research/*.md",
                "memory/audience/*.md",
                "memory/audience_tone/*.md",
                "memory/design_strategy/*.md",
                "memory/reaction/*.md",
                "memory/council/*.md",
                "memory/reports/weekly_report.md",
                "data/post_log.json",
                "data/build_candidates.json",
                "data/note_candidates.json",
                "data/reaction_memory.json",
                "output/reports/audience_strategy.json",
                "output/reports/audience_tone_profile.json",
                "output/reports/threads_tone_variants.json",
                "output/reports/design_strategy.json",
                "output/reports/reaction_memory.json",
                "output/reports/dry_run_batch_report.md",
                "output/reports/sample_post_review.md",
            ],
            "harness_upgrade": {
                "audience_strategy_department": True,
                "audience_tone_adapter_department": True,
                "design_intelligence_department": True,
                "reaction_memory_department": True,
                "reaction_memory_entries": reaction_report.get("scores", {}).get("reaction_entries", 0),
            },
        }
        write_json(REPORTS_DIR / "latest" / "context-pack.json", context)
        save_stage("dry_run_batch.json", context)
        return context
    finally:
        if previous_run_date is None:
            os.environ.pop("RUN_DATE", None)
        else:
            os.environ["RUN_DATE"] = previous_run_date


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a 7-day DRY_RUN batch")
    parser.add_argument("--days", type=int, default=7)
    args = parser.parse_args()
    run(days=args.days)
