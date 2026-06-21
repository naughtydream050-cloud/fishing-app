from __future__ import annotations

import hashlib
import os
import time
import urllib.error
import urllib.parse
import urllib.request

from common import DATA_DIR, OUTPUT_DIR, REPORTS_DIR, append_json_log, cli_parser, department_output, env_bool, load_latest, now_iso, read_json, redact, save_stage, today_iso, write_json, write_text


REQUIRED_THREAD_SECRETS = [
    "THREADS_ACCESS_TOKEN",
    "THREADS_USER_ID",
    "THREADS_TARGET_HANDLE",
    "THREADS_AUTO_POST_ENABLED",
]


def _threads_post(url: str, fields: dict[str, str]) -> dict:
    data = urllib.parse.urlencode(fields).encode("utf-8")
    request = urllib.request.Request(url, data=data, method="POST")
    with urllib.request.urlopen(request, timeout=30) as response:
        import json

        return json.loads(response.read().decode("utf-8"))


def _content_hash(post: dict, image_url: str = "") -> str:
    raw = "\n".join([post.get("text", ""), post.get("alt_text", ""), image_url])
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _target_config() -> dict:
    config = read_json(DATA_DIR / "manual_threads_target.json", {})
    return config.get("target_account", {}) if isinstance(config, dict) else {}


def _post_history() -> dict:
    history = read_json(DATA_DIR / "post_history.json", {"version": 1, "entries": []})
    if not isinstance(history, dict) or not isinstance(history.get("entries"), list):
        return {"version": 1, "entries": []}
    return history


def _write_history_entry(entry: dict) -> None:
    path = DATA_DIR / "post_history.json"
    history = _post_history()
    history["entries"].append(entry)
    write_json(path, history)


def _is_duplicate(content_hash: str, target_handle: str) -> bool:
    history = _post_history()
    for entry in history.get("entries", []):
        if not isinstance(entry, dict):
            continue
        if entry.get("content_hash") == content_hash and entry.get("target_handle") == target_handle and entry.get("status") == "posted":
            return True
    return False


def _missing_secret_names() -> list[str]:
    missing = []
    for name in REQUIRED_THREAD_SECRETS:
        value = os.getenv(name, "").strip()
        if not value:
            missing.append(name)
    return missing


def _target_guard(expected_handle: str, env_handle: str) -> tuple[bool, str]:
    if not expected_handle:
        return False, "missing_manual_target_config"
    if not env_handle:
        return False, "missing THREADS_TARGET_HANDLE"
    if expected_handle.lower().lstrip("@") != env_handle.lower().lstrip("@"):
        return False, f"target_handle_mismatch expected={expected_handle} actual={env_handle}"
    return True, "target_handle_ok"


def _publish_live_text_or_image(post: dict) -> dict:
    token = os.getenv("THREADS_ACCESS_TOKEN", "")
    user_id = os.getenv("THREADS_USER_ID", "")
    graph_base = os.getenv("THREADS_GRAPH_BASE_URL", "https://graph.threads.net/v1.0").rstrip("/")
    if not token or not user_id:
        raise RuntimeError("missing THREADS_ACCESS_TOKEN or THREADS_USER_ID")
    text = post.get("text", "")
    image_url = os.getenv("THREADS_IMAGE_URL", "").strip()
    container_fields = {
        "media_type": "IMAGE" if image_url else "TEXT",
        "text": text,
        "access_token": token,
    }
    if image_url:
        container_fields["image_url"] = image_url
    container = _threads_post(f"{graph_base}/{urllib.parse.quote(user_id)}/threads", container_fields)
    creation_id = container.get("id")
    if not creation_id:
        raise RuntimeError("Threads container response did not include id")
    if image_url:
        delay = int(os.getenv("THREADS_MEDIA_PUBLISH_DELAY_SECONDS", "35"))
        if delay > 0:
            time.sleep(delay)
    published = _threads_post(
        f"{graph_base}/{urllib.parse.quote(user_id)}/threads_publish",
        {"creation_id": creation_id, "access_token": token},
    )
    return {"creation_id": creation_id, "published": published}


def _image_url_from_audit(audit: dict) -> str:
    env_url = os.getenv("THREADS_IMAGE_URL", "").strip()
    selected_image_path = audit.get("selected_image_path", "")
    if env_url:
        return env_url
    if not selected_image_path:
        return ""
    github_sha = os.getenv("GITHUB_SHA", "").strip()
    if github_sha:
        return "https://raw.githubusercontent.com/naughtydream050-cloud/fishing-app/" + github_sha + "/" + selected_image_path
    return ""


def run(dry_run: bool = False, sample: bool = False) -> dict:
    forced_dry_run = dry_run or env_bool("DRY_RUN", True)
    auto_post = env_bool("AUTO_POST", False)
    threads_auto_enabled = env_bool("THREADS_AUTO_POST_ENABLED", False)
    gate = load_latest("quality_risk_gate.json", {})
    selected_candidate = load_latest("selected_post_candidate.json", {})
    source_audit = load_latest("post_source_audit.json", {})
    generated_post = load_latest("threads_post.json", {}).get("post", {})
    post = dict(generated_post)
    if selected_candidate.get("selected") and selected_candidate.get("selected_post_text"):
        post["text"] = selected_candidate["selected_post_text"]
    image_url = _image_url_from_audit(source_audit)
    target = _target_config()
    expected_handle = target.get("handle", "")
    env_target_handle = os.getenv("THREADS_TARGET_HANDLE", "").strip()
    content_hash = _content_hash(post, image_url)
    risks = []
    status = "dry_run_saved"
    thread_id = None
    live_preflight = {
        "gate_approved": bool(gate.get("approved")),
        "auto_post": auto_post,
        "threads_auto_post_enabled": threads_auto_enabled,
        "dry_run": forced_dry_run,
        "target_handle": env_target_handle,
        "expected_target_handle": expected_handle,
        "content_hash": content_hash,
        "duplicate": False,
        "missing_secrets": [],
        "selected_candidate": bool(selected_candidate.get("selected")),
        "post_source_audit_allowed": bool(source_audit.get("posting_allowed")),
    }

    target_ok, target_message = _target_guard(expected_handle, env_target_handle)
    if os.getenv("THREADS_POST_TEXT_OVERRIDE", "").strip():
        status = "blocked_by_fixed_override"
        risks.append("THREADS_POST_TEXT_OVERRIDE is not allowed in normal operation")
    elif os.getenv("THREADS_IMAGE_URL", "").strip() and source_audit.get("selected_image_path") and source_audit.get("selected_image_path") not in os.getenv("THREADS_IMAGE_URL", ""):
        status = "blocked_by_fixed_image_url"
        risks.append("THREADS_IMAGE_URL does not match selected_image_path")
    elif not source_audit.get("posting_allowed"):
        status = "blocked_by_post_source_audit"
        risks.extend(source_audit.get("blocks", []) or ["post_source_audit_not_allowed"])
    elif not gate.get("approved"):
        status = "blocked_by_risk_gate"
        risks.extend(gate.get("risks", []))
    elif not selected_candidate.get("selected"):
        status = "blocked_by_post_selection"
        risks.append(selected_candidate.get("rejected_reason_if_any") or "selected_post_candidate_missing_or_rejected")
    elif not auto_post:
        risks.append("AUTO_POST=false")
    elif forced_dry_run:
        risks.append("DRY_RUN=true")
    elif not threads_auto_enabled:
        status = "threads_auto_post_disabled"
        risks.append("THREADS_AUTO_POST_ENABLED=false")
    elif not target_ok:
        status = "target_guard_blocked"
        risks.append(target_message)
    else:
        missing = _missing_secret_names()
        live_preflight["missing_secrets"] = missing
        if missing:
            status = "missing_threads_credentials"
            risks.append("missing " + ", ".join(missing))
        elif _is_duplicate(content_hash, env_target_handle):
            status = "duplicate_blocked"
            live_preflight["duplicate"] = True
            risks.append("duplicate post content for target handle")
        else:
            try:
                live = _publish_live_text_or_image(post)
                status = "posted"
                thread_id = live.get("published", {}).get("id")
            except urllib.error.HTTPError as exc:
                status = "threads_api_error"
                risks.append(redact(f"Threads API HTTP {exc.code}: {exc.read().decode('utf-8', errors='replace')[:500]}"))
            except Exception as exc:
                status = "threads_api_error"
                risks.append(redact(str(exc)))

    log_entry = {
        "date": today_iso(),
        "created_at": now_iso(),
        "status": status,
        "auto_post": auto_post,
        "threads_auto_post_enabled": threads_auto_enabled,
        "dry_run": forced_dry_run,
        "thread_id": thread_id,
        "target_handle": env_target_handle or expected_handle,
        "content_hash": content_hash,
        "post_text": post.get("text", ""),
        "alt_text": post.get("alt_text", ""),
        "topic_tags": post.get("topic_tags", []),
        "candidate_id": source_audit.get("selected_candidate_id", selected_candidate.get("selected_candidate_id", "")),
        "selected_image_path": source_audit.get("selected_image_path", selected_candidate.get("selected_image_path", "")),
        "post_text_hash": hashlib.sha256(post.get("text", "").encode("utf-8")).hexdigest() if post.get("text") else "",
    }
    append_json_log(DATA_DIR / "post_log.json", log_entry)
    _write_history_entry(
        {
            "date": log_entry["date"],
            "created_at": log_entry["created_at"],
            "status": status,
            "target_handle": log_entry["target_handle"],
            "content_hash": content_hash,
            "thread_id": thread_id,
            "dry_run": forced_dry_run,
            "auto_post": auto_post,
            "threads_auto_post_enabled": threads_auto_enabled,
            "candidate_id": log_entry["candidate_id"],
            "selected_image_path": log_entry["selected_image_path"],
            "post_text_hash": log_entry["post_text_hash"],
        }
    )
    post_url = f"https://www.threads.net/@{(env_target_handle or expected_handle).lstrip('@')}/post/{thread_id}" if thread_id else ""
    live_result = {
        "date": today_iso(),
        "created_at": log_entry["created_at"],
        "status": status,
        "posting_attempted": status in {"posted", "threads_api_error"},
        "api_called": status in {"posted", "threads_api_error"},
        "post_id": thread_id,
        "post_url": post_url,
        "target_handle": env_target_handle or expected_handle,
        "selected_candidate_id": log_entry["candidate_id"],
        "selected_image_path": log_entry["selected_image_path"],
        "selected_post_text": post.get("text", ""),
        "posted_at": log_entry["created_at"] if status == "posted" else None,
        "risks": risks,
    }
    write_json(OUTPUT_DIR / "reports" / "live_post_result.json", live_result)
    write_text(
        OUTPUT_DIR / "reports" / "live_post_result.md",
        "\n".join(
            [
                f"# Live Post Result - {today_iso()}",
                "",
                f"- status: {status}",
                f"- posting_attempted: {live_result['posting_attempted']}",
                f"- api_called: {live_result['api_called']}",
                f"- post_id: {thread_id or ''}",
                f"- post_url: {post_url}",
                f"- target_handle: {live_result['target_handle']}",
                f"- selected_candidate_id: {live_result['selected_candidate_id']}",
                f"- selected_image_path: {live_result['selected_image_path']}",
                "",
                "## Selected Post Text",
                post.get("text", ""),
                "",
                "## Risks",
                *[f"- {risk}" for risk in risks],
                "",
            ]
        ),
    )
    context_path = REPORTS_DIR / "latest" / "context-pack.json"
    context = read_json(context_path, {})
    if isinstance(context, dict):
        context["publishing"] = {
            "status": status,
            "posting_attempted": live_result["posting_attempted"],
            "api_called": live_result["api_called"],
            "post_id": thread_id,
            "post_url": post_url,
            "selected_candidate_id": log_entry["candidate_id"],
            "selected_image_path": log_entry["selected_image_path"],
        }
        write_json(context_path, context)
    payload = department_output(
        "Publishing Department",
        "Threads posting was evaluated through AUTO_POST, DRY_RUN, target, duplicate, post source audit, and secrets guards.",
        scores={"auto_post": auto_post, "dry_run": forced_dry_run, "threads_auto_post_enabled": threads_auto_enabled},
        risks=risks,
        next_action="fetch insights" if status == "posted" else "manual review or fix posting preflight",
        input_sources=[
            "output/reports/quality_risk_gate.json",
            "output/reports/selected_post_candidate.json",
            "output/reports/post_source_audit.json",
            "output/reports/threads_post.json",
            "data/manual_threads_target.json",
            "data/post_history.json",
        ],
        extra={
            "status": status,
            "thread_id": thread_id,
            "target_guard": target_message,
            "live_preflight": live_preflight,
            "log_entry": redact(str(log_entry)),
            "api_called": status in {"posted", "threads_api_error"},
            "live_post_result": live_result,
        },
    )
    save_stage("publishing.json", payload)
    print(f"publishing_status={status}")
    print(f"posting_attempted={status in {'posted', 'threads_api_error'}}")
    if thread_id:
        print(f"thread_id={thread_id}")
    return payload


if __name__ == "__main__":
    args = cli_parser("Post to Threads or save dry run").parse_args()
    run(dry_run=args.dry_run, sample=args.sample)
