from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Any

from common import OUTPUT_DIR, PROJECT_ROOT, REPORTS_DIR, read_json, today_iso, write_json, write_text


WEB_DIR = PROJECT_ROOT / "web" / "oshi-activity-management"
REQUIRED_FILES = [
    WEB_DIR / "index.html",
    WEB_DIR / "styles.css",
    WEB_DIR / "app.js",
    WEB_DIR / "README.md",
]
REQUIRED_TEXT = [
    "推し活ログボード",
    "ダッシュボード",
    "ライブ参戦ログ",
    "グッズ管理",
    "遠征費",
    "メモ",
    "ticket_status",
    "companion",
    "emotion_tag",
    "localStorage",
    "Export",
    "Import",
]
REQUIRED_JS = [
    "loadState",
    "normalizeState",
    "saveState",
    "addRecord",
    "saveForm",
    "deleteRecord",
    "exportData",
    "importData",
    "clearData",
]
FORBIDDEN_PATTERNS = [
    r"https?://",
    r"\bfetch\s*\(",
    r"\bXMLHttpRequest\b",
    r"THREADS_ACCESS_TOKEN",
    r"GEMINI_API_KEY",
    r"GROQ_API_KEY",
    r"SUPABASE",
    r"FIREBASE",
    r"AUTO_POST\s*=\s*true",
]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def run() -> dict[str, Any]:
    missing = [str(path.relative_to(PROJECT_ROOT)) for path in REQUIRED_FILES if not path.exists()]
    combined = "\n".join(_read(path) for path in REQUIRED_FILES if path.exists())
    missing_text = [text for text in REQUIRED_TEXT if text not in combined]
    missing_js = [text for text in REQUIRED_JS if text not in combined]
    forbidden_hits = []
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, combined, flags=re.IGNORECASE):
            forbidden_hits.append(pattern)

    checks = {
        "required_files": not missing,
        "required_text": not missing_text,
        "required_crud_js": not missing_js,
        "uses_localStorage": "localStorage" in combined,
        "has_import_export": "exportData" in combined and "importData" in combined,
        "has_empty_state": "empty-state" in combined,
        "has_gpt_followup_fields": all(field in combined for field in ["ticket_status", "companion", "emotion_tag"]),
        "no_external_url": r"https?://" not in forbidden_hits,
        "no_external_api_call": not any(hit in forbidden_hits for hit in [r"\bfetch\s*\(", r"\bXMLHttpRequest\b"]),
        "no_secret_names": not any(hit in forbidden_hits for hit in ["THREADS_ACCESS_TOKEN", "GEMINI_API_KEY", "GROQ_API_KEY"]),
        "no_db_auth_payment_markers": not any(hit in forbidden_hits for hit in ["SUPABASE", "FIREBASE"]),
        "auto_post_not_enabled": r"AUTO_POST\s*=\s*true" not in forbidden_hits,
    }
    context = read_json(REPORTS_DIR / "latest" / "context-pack.json", {})
    safety = {
        "context_dry_run": context.get("dry_run") is True,
        "context_auto_post_false": context.get("auto_post") is False,
        "context_threads_api_not_called": context.get("threads_api_called") is False,
    }
    failures = []
    failures.extend(f"missing_file:{path}" for path in missing)
    failures.extend(f"missing_text:{text}" for text in missing_text)
    failures.extend(f"missing_js:{text}" for text in missing_js)
    failures.extend(f"forbidden:{hit}" for hit in forbidden_hits)
    failures.extend(f"check:{key}" for key, ok in checks.items() if not ok)
    failures.extend(f"safety:{key}" for key, ok in safety.items() if not ok)

    result = {
        "date": today_iso(),
        "status": "ok" if not failures else "failed",
        "web_dir": "web/oshi-activity-management",
        "checks": checks,
        "safety": safety,
        "missing": missing,
        "missing_text": missing_text,
        "missing_js": missing_js,
        "forbidden_hits": forbidden_hits,
        "failures": failures,
    }
    write_json(OUTPUT_DIR / "reports" / "web_mvp_validation.json", result)
    write_text(
        OUTPUT_DIR / "reports" / "web_mvp_validation.md",
        "\n".join(
            [
                "# Web MVP Validation",
                "",
                f"- status: {result['status']}",
                f"- web_dir: {result['web_dir']}",
                f"- required_files: {checks['required_files']}",
                f"- required_text: {checks['required_text']}",
                f"- required_crud_js: {checks['required_crud_js']}",
                f"- uses_localStorage: {checks['uses_localStorage']}",
                f"- has_import_export: {checks['has_import_export']}",
                f"- has_empty_state: {checks['has_empty_state']}",
                f"- has_gpt_followup_fields: {checks['has_gpt_followup_fields']}",
                f"- no_external_api_call: {checks['no_external_api_call']}",
                f"- context_dry_run: {safety['context_dry_run']}",
                f"- context_auto_post_false: {safety['context_auto_post_false']}",
                f"- context_threads_api_not_called: {safety['context_threads_api_not_called']}",
                f"- failures: {len(failures)}",
                "",
            ]
        ),
    )
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate static Web MVP output")
    parser.parse_args()
    result = run()
    if result["status"] != "ok":
        raise SystemExit(1)
