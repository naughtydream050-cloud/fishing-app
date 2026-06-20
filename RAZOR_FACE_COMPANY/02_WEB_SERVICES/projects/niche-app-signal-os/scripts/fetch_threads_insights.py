from __future__ import annotations

from common import cli_parser, department_output, load_latest, save_stage


def run(sample: bool = False) -> dict:
    publishing = load_latest("publishing.json", {})
    status = publishing.get("status")
    insights = {
        "views": None,
        "likes": None,
        "replies": None,
        "reposts": None,
        "quotes": None,
        "shares": None,
        "profile_visits": None,
        "follows": None,
        "clicks": None,
    }
    payload = department_output(
        "Analytics Department",
        "DRY_RUNでは投稿IDがないため、Insightsはnullで保存して継続しました。",
        scores={"insight_fields": len(insights)},
        risks=[] if status == "dry_run_saved" else ["no_live_thread_id"],
        next_action="learning analysis",
        input_sources=["output/reports/publishing.json"],
        extra={"insights": insights, "source_status": status},
    )
    save_stage("threads_insights.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Fetch Threads insights").parse_args()
    run(sample=args.sample)
