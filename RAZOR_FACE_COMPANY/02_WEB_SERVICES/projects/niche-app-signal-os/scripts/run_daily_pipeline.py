from __future__ import annotations

import argparse
import traceback

from common import REPORTS_DIR, ensure_dirs, save_stage, today_iso, write_json

import collect_research_inputs
import analyze_viral_patterns
import update_memory_box
import evaluate_trend_timing
import score_niche_demand
import select_niche_candidate
import build_market_research_trace
import audience_strategy
import audience_tone_adapter
import run_llm_council
import design_intelligence
import generate_threads_post
import generate_card_image
import generate_share_card
import quality_risk_gate
import select_post_candidate
import post_source_audit
import post_to_threads
import fetch_threads_insights
import analyze_learning
import update_reaction_memory


STAGES = [
    ("collect_research_inputs", collect_research_inputs.run),
    ("analyze_viral_patterns", analyze_viral_patterns.run),
    ("update_memory_box", update_memory_box.run),
    ("evaluate_trend_timing", evaluate_trend_timing.run),
    ("score_niche_demand", score_niche_demand.run),
    ("select_niche_candidate", select_niche_candidate.run),
    ("build_market_research_trace", build_market_research_trace.run),
    ("audience_strategy", audience_strategy.run),
    ("design_intelligence", design_intelligence.run),
    ("audience_tone_adapter", audience_tone_adapter.run),
    ("run_llm_council", run_llm_council.run),
    ("generate_threads_post", generate_threads_post.run),
    ("generate_share_card", generate_share_card.run),
    ("generate_card_image", generate_card_image.run),
    ("quality_risk_gate", quality_risk_gate.run),
    ("select_post_candidate", select_post_candidate.run),
    ("post_source_audit", post_source_audit.run),
    ("post_to_threads", post_to_threads.run),
    ("fetch_threads_insights", fetch_threads_insights.run),
    ("update_reaction_memory", update_reaction_memory.run),
    ("analyze_learning", analyze_learning.run),
]


def run(dry_run: bool = True, sample: bool = False) -> dict:
    ensure_dirs()
    results = []
    failed = None
    for name, fn in STAGES:
        try:
            if name == "post_to_threads":
                result = fn(dry_run=dry_run, sample=sample)
            else:
                result = fn(sample=sample)
            results.append({"stage": name, "status": "ok", "summary": result.get("summary", "")})
            if name == "quality_risk_gate" and not result.get("approved"):
                results.append({"stage": "publish_guard", "status": "stopped", "summary": "risk gate blocked live posting"})
        except Exception as exc:
            failed = {"stage": name, "error": str(exc), "traceback": traceback.format_exc(limit=5)}
            results.append({"stage": name, "status": "failed", "summary": str(exc)})
            break
    context = {
        "project": "niche-app-signal-os",
        "date": today_iso(),
        "dry_run": dry_run,
        "sample": sample,
        "status": "failed" if failed else "ok",
        "failed": failed,
        "stages": results,
        "artifacts": [
            "output/thread_posts/",
            "output/card_images/",
            "output/reports/",
            "memory/research/",
            "memory/audience/",
            "memory/audience_tone/",
            "memory/design_strategy/",
            "memory/reaction/",
            "memory/council/",
            "memory/reports/",
        ],
    }
    save_stage("daily_pipeline.json", context)
    write_json(REPORTS_DIR / "latest" / "context-pack.json", context)
    if failed:
        raise SystemExit(1)
    return context


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Niche App Signal OS daily pipeline")
    parser.add_argument("--dry-run", action="store_true", default=False)
    parser.add_argument("--live-post", action="store_true", default=False)
    parser.add_argument("--sample", action="store_true", default=False)
    args = parser.parse_args()
    run(dry_run=not args.live_post, sample=args.sample)
