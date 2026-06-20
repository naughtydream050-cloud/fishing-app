from __future__ import annotations

import hashlib
import os
import urllib.error
import urllib.parse
import urllib.request

from common import DATA_DIR, append_json_log, cli_parser, department_output, env_bool, load_latest, now_iso, read_json, redact, save_stage, today_iso, write_json


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


def _apply_post_overrides(post: dict) -> dict:
    overridden = dict(post)
    text_override = os.getenv("THREADS_POST_TEXT_OVERRIDE", "").strip()
    alt_override = os.getenv("THREADS_ALT_TEXT_OVERRIDE", "").strip()
    tags_override = os.getenv("THREADS_TOPIC_TAGS_OVERRIDE", "").strip()
    if text_override:
        overridden["text"] = text_override.replace("\\n", "\n")
    if alt_override:
        overridden["alt_text"] = alt_override
    if tags_override:
        overridden["topic_tags"] = [tag.strip() for tag in tags_override.split(",") if tag.strip()]
    return overridden


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
    published = _threads_post(
        f"{graph_base}/{urllib.parse.quote(user_id)}/threads_publish",
        {"creation_id": creation_id, "access_token": token},
    )
    return {"creation_id": creation_id, "published": published}


def run(dry_run: bool = False, sample: bool = False) -> dict:
    forced_dry_run = dry_run or env_bool("DRY_RUN", True)
    auto_post = env_bool("AUTO_POST", False)
    threads_auto_enabled = env_bool("THREADS_AUTO_POST_ENABLED", False)
    gate = load_latest("quality_risk_gate.json", {})
    post = _apply_post_overrides(load_latest("threads_post.json", {}).get("post", {}))
    image_url = os.getenv("THREADS_IMAGE_URL", "").strip()
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
        "image_url_present": bool(image_url),
        "post_text_override": bool(os.getenv("THREADS_POST_TEXT_OVERRIDE", "").strip()),
    }

    target_ok, target_message = _target_guard(expected_handle, env_target_handle)
    if not gate.get("approved"):
        status = "blocked_by_risk_gate"
        risks.extend(gate.get("risks", []))
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
        }
    )
    payload = department_output(
        "Publishing Department",
        "Threads投稿処理をAUTO_POST/DRY_RUN/target/duplicate/Secrets guard付きで評価しました。",
        scores={"auto_post": auto_post, "dry_run": forced_dry_run, "threads_auto_post_enabled": threads_auto_enabled},
        risks=risks,
        next_action="fetch insights" if status == "posted" else "manual review or fix posting preflight",
        input_sources=["output/reports/quality_risk_gate.json", "output/reports/threads_post.json", "data/manual_threads_target.json", "data/post_history.json"],
        extra={
            "status": status,
            "thread_id": thread_id,
            "target_guard": target_message,
            "live_preflight": live_preflight,
            "log_entry": redact(str(log_entry)),
            "api_called": status in {"posted", "threads_api_error"},
        },
    )
    save_stage("publishing.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Post to Threads or save dry run").parse_args()
    run(dry_run=args.dry_run, sample=args.sample)
