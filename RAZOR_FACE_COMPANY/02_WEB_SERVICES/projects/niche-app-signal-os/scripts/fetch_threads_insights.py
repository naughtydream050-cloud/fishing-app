from __future__ import annotations

from common import cli_parser, department_output, load_latest, save_stage


def run(sample: bool = False) -> dict:
    publishing = load_latest("publishing.json", {})
    status = publishing.get("status")
    thread_id = publishing.get("thread_id")
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
        "Threads insights are initialized as null unless a later metrics fetch supplies real values.",
        scores={"insight_fields": len(insights)},
        risks=[] if status == "posted" and thread_id else ["no_live_thread_id"],
        next_action="reaction memory",
        input_sources=["output/reports/publishing.json"],
        extra={"insights": insights, "source_status": status, "thread_id": thread_id},
    )
    save_stage("threads_insights.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Fetch Threads insights").parse_args()
    run(sample=args.sample)
