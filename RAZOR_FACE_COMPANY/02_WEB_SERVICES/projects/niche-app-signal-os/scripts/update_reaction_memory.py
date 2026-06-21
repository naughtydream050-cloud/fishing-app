from __future__ import annotations

from common import DATA_DIR, MEMORY_DIR, cli_parser, department_output, load_latest, read_json, save_stage, today_iso, write_json, write_text


EMPTY_REACTION_SCHEMA = {
    "version": 1,
    "description": "Threads reaction memory. Live posts create an initial null-metrics record, then later metrics can update it.",
    "entries": [],
    "fields": {
        "date": "YYYY-MM-DD",
        "candidate_id": "example: live-trip-packing-check",
        "post_variant": "example: gen_z_oshi_activity",
        "manual_post_url": "optional",
        "post_id": "Threads post id",
        "selected_image_path": "output/share-cards/YYYY-MM-DD-candidate.png",
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


def _append_live_initial_entry(entries: list[dict]) -> bool:
    publishing = load_latest("publishing.json", {})
    live_result = publishing.get("live_post_result", {}) if isinstance(publishing, dict) else {}
    if publishing.get("status") != "posted" or not live_result.get("post_id"):
        return False
    already_exists = any(entry.get("post_id") == live_result.get("post_id") for entry in entries if isinstance(entry, dict))
    if already_exists:
        return False
    selected = load_latest("selected_post_candidate.json", {})
    entries.append(
        {
            "date": today_iso(),
            "candidate_id": live_result.get("selected_candidate_id", ""),
            "post_variant": selected.get("selected_tone", ""),
            "manual_post_url": live_result.get("post_url", ""),
            "post_id": live_result.get("post_id", ""),
            "selected_image_path": live_result.get("selected_image_path", ""),
            "likes": None,
            "replies": None,
            "reposts": None,
            "saves": None,
            "profile_clicks": None,
            "comments": [],
            "objections": [],
            "requested_fields": [],
            "design_feedback": [],
            "next_decision": "hold",
        }
    )
    return True


def run(sample: bool = False) -> dict:
    path = DATA_DIR / "reaction_memory.json"
    memory = read_json(path, EMPTY_REACTION_SCHEMA)
    if not isinstance(memory, dict) or "entries" not in memory:
        memory = EMPTY_REACTION_SCHEMA
    entries = memory.get("entries") or []
    added_live_initial_entry = _append_live_initial_entry(entries)
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
                f"- added_live_initial_entry: {added_live_initial_entry}",
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
        "Reaction memory was updated with an initial live-post record when available, without reading secrets.",
        scores={"reaction_entries": len(entries), "top_reaction_score": top_entries[0]["reaction_score"] if top_entries else 0},
        risks=["no_live_reaction_yet"] if not entries else [],
        next_action="candidate scoring",
        input_sources=["data/reaction_memory.json", "output/reports/publishing.json"],
        extra={
            "reaction_memory": str(path.relative_to(DATA_DIR.parent)),
            "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent)),
            "top_entries": top_entries,
            "added_live_initial_entry": added_live_initial_entry,
            "threads_api_called": False,
        },
    )
    save_stage("reaction_memory.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Update reaction memory schema and summary")
    run(sample=args.sample)
