from __future__ import annotations

from common import DATA_DIR, MEMORY_DIR, cli_parser, department_output, read_json, save_stage, today_iso, write_json, write_text


EMPTY_REACTION_SCHEMA = {
    "version": 1,
    "description": "Manual-post reaction memory. Keep empty until the owner records real post results.",
    "entries": [],
    "fields": {
        "date": "YYYY-MM-DD",
        "candidate_id": "example: oshi-activity-management",
        "post_variant": "example: A",
        "manual_post_url": "optional",
        "likes": "number or null",
        "replies": "number or null",
        "reposts": "number or null",
        "saves": "number or null",
        "profile_clicks": "number or null",
        "comments": ["raw comment snippets or summaries"],
        "objections": ["example: Notionで十分"],
        "requested_fields": ["example: 写真, リマインド"],
        "design_feedback": ["example: かわいい, 見づらい"],
        "next_decision": "hold | note | lp | mvp_revision | saas_candidate",
    },
}


def _score_entry(entry: dict) -> int:
    likes = int(entry.get("likes") or 0)
    replies = int(entry.get("replies") or 0)
    saves = int(entry.get("saves") or 0)
    requested = len(entry.get("requested_fields") or [])
    objections = len(entry.get("objections") or [])
    return likes + replies * 3 + saves * 4 + requested * 2 - objections


def run(sample: bool = False) -> dict:
    path = DATA_DIR / "reaction_memory.json"
    memory = read_json(path, EMPTY_REACTION_SCHEMA)
    if not isinstance(memory, dict) or "entries" not in memory:
        memory = EMPTY_REACTION_SCHEMA
    entries = memory.get("entries") or []
    scored_entries = [{**entry, "reaction_score": _score_entry(entry)} for entry in entries]
    top_entries = sorted(scored_entries, key=lambda item: item["reaction_score"], reverse=True)[:5]
    memory["entries"] = entries
    write_json(path, memory)

    memory_path = MEMORY_DIR / "reaction" / f"{today_iso()}.md"
    write_text(
        memory_path,
        "\n".join(
            [
                f"# Reaction Memory - {today_iso()}",
                "",
                f"- entries: {len(entries)}",
                "- source: manual only",
                "- threads_api_called: false",
                "",
                "## Top Reaction Entries",
                *(
                    [
                        f"- {entry.get('candidate_id', 'unknown')} / variant={entry.get('post_variant', '')} / score={entry['reaction_score']} / decision={entry.get('next_decision', '')}"
                        for entry in top_entries
                    ]
                    or ["- none yet"]
                ),
                "",
            ]
        ),
    )
    payload = department_output(
        "Reaction Memory Department",
        "手動投稿後の反応をMemoryへ戻すためのスキーマと集計受け皿を更新しました。実投稿やAPI取得は行いません。",
        scores={"reaction_entries": len(entries), "top_reaction_score": top_entries[0]["reaction_score"] if top_entries else 0},
        risks=["no_live_reaction_yet"] if not entries else [],
        next_action="candidate scoring",
        input_sources=["data/reaction_memory.json"],
        extra={
            "reaction_memory": str(path.relative_to(DATA_DIR.parent)),
            "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent)),
            "top_entries": top_entries,
            "threads_api_called": False,
        },
    )
    save_stage("reaction_memory.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Update manual reaction memory schema and summary").parse_args()
    run(sample=args.sample)
