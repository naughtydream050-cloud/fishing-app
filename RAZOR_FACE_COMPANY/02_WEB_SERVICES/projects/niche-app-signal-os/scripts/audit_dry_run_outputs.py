from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Any

from common import DATA_DIR, MEMORY_DIR, OUTPUT_DIR, REPORTS_DIR, PROJECT_ROOT, read_json, save_stage, today_iso, write_json, write_text


MOJIBAKE_MARKERS = ["縺", "繧", "繝", "螳", "謗", "蜩", "譛", "隕", "荳", "逕", "驕", "雋", "邂"]
SECRET_ENV_NAMES = ["THREADS_ACCESS_TOKEN", "THREADS_USER_ID", "GEMINI_API_KEY", "GROQ_API_KEY"]
AUDIT_TEXT_SUFFIXES = {".json", ".md", ".py", ".yml", ".yaml", ".txt", ".html", ".svg"}


def _rel(path: Path) -> str:
    return path.relative_to(PROJECT_ROOT).as_posix()


def _text_files() -> list[Path]:
    roots = [
        DATA_DIR,
        OUTPUT_DIR,
        MEMORY_DIR,
        REPORTS_DIR,
        PROJECT_ROOT / "docs",
        PROJECT_ROOT / "handoff",
        PROJECT_ROOT / "web",
        PROJECT_ROOT / ".github",
    ]
    files: list[Path] = []
    for root in roots:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if path.is_file() and path.suffix.lower() in AUDIT_TEXT_SUFFIXES:
                files.append(path)
    files.extend(path for path in PROJECT_ROOT.glob("*.md") if path.is_file())
    return sorted(set(files))


def _contains_mojibake(path: Path) -> bool:
    text = path.read_text(encoding="utf-8", errors="ignore")
    return any(marker in text for marker in MOJIBAKE_MARKERS)


def _contains_secret_value(path: Path, secret_values: list[str]) -> bool:
    if not secret_values:
        return False
    text = path.read_text(encoding="utf-8", errors="ignore")
    return any(value and value in text for value in secret_values)


def _exists(path_text: str) -> bool:
    return (PROJECT_ROOT / path_text).exists()


def run(days: int = 7) -> dict[str, Any]:
    context = read_json(REPORTS_DIR / "latest" / "context-pack.json", {})
    post_log = read_json(DATA_DIR / "post_log.json", [])
    daily_outputs = context.get("daily_outputs", [])
    secret_values = [os.getenv(name, "") for name in SECRET_ENV_NAMES if os.getenv(name)]
    text_files = _text_files()

    expected_by_kind = {
        "thread_md": [item.get("md") for item in daily_outputs if isinstance(item, dict)],
        "thread_json": [item.get("json") for item in daily_outputs if isinstance(item, dict)],
        "card_svg": [item.get("card_svg") for item in daily_outputs if isinstance(item, dict)],
        "card_html": [item.get("card_html") for item in daily_outputs if isinstance(item, dict)],
        "research_md": [item.get("research_memory") for item in daily_outputs if isinstance(item, dict)],
        "council_md": [item.get("council_memory") for item in daily_outputs if isinstance(item, dict)],
    }
    counts = {
        key: sum(1 for path in paths if path and _exists(path))
        for key, paths in expected_by_kind.items()
    }
    counts.update(
        {
        "post_log_entries": len(post_log) if isinstance(post_log, list) else 0,
        "daily_outputs": len(daily_outputs) if isinstance(daily_outputs, list) else 0,
        }
    )
    extra_generated_counts = {
        "thread_md": len(list((OUTPUT_DIR / "thread_posts").glob("2026-*.md"))),
        "thread_json": len(list((OUTPUT_DIR / "thread_posts").glob("2026-*.json"))),
        "card_svg": len(list((OUTPUT_DIR / "card_images").glob("2026-*.svg"))),
        "card_html": len(list((OUTPUT_DIR / "card_images").glob("2026-*.html"))),
        "research_md": len(list((MEMORY_DIR / "research").glob("2026-*.md"))),
        "council_md": len(list((MEMORY_DIR / "council").glob("2026-*.md"))),
    }
    required_paths = [
        "memory/reports/weekly_report.md",
        "data/build_candidates.json",
        "data/note_candidates.json",
        "data/next_week_seed_weights.json",
        "output/reports/dry_run_batch_report.md",
        "output/reports/sample_post_review.md",
        "reports/latest/context-pack.json",
    ]
    required_paths.extend(
        item[path_key]
        for item in daily_outputs
        for path_key in ["md", "json", "card_svg", "card_html", "research_memory", "council_memory"]
        if isinstance(item, dict) and item.get(path_key)
    )
    missing_paths = sorted(path for path in required_paths if not _exists(path))
    mojibake_files = [_rel(path) for path in text_files if _contains_mojibake(path)]
    secret_hits = [_rel(path) for path in text_files if _contains_secret_value(path, secret_values)]

    statuses = sorted({entry.get("status") for entry in post_log if isinstance(entry, dict)})
    safety = {
        "dry_run": context.get("dry_run") is True,
        "auto_post_false": context.get("auto_post") is False,
        "threads_api_not_called": context.get("threads_api_called") is False,
        "post_log_dry_run_only": statuses == ["dry_run_saved"],
        "low_quality_gate_blocks": context.get("low_quality_gate", {}).get("approved") is False,
    }
    count_checks = {key: value >= days for key, value in counts.items()}
    count_checks["post_log_entries"] = counts["post_log_entries"] == days
    count_checks["daily_outputs"] = counts["daily_outputs"] == days

    failures = []
    failures.extend(f"missing:{path}" for path in missing_paths)
    failures.extend(f"mojibake:{path}" for path in mojibake_files)
    failures.extend(f"secret_value:{path}" for path in secret_hits)
    failures.extend(f"safety:{key}" for key, ok in safety.items() if not ok)
    failures.extend(f"count:{key}={value}" for key, value in counts.items() if not count_checks.get(key))

    audit = {
        "project": "niche-app-signal-os",
        "date": today_iso(),
        "status": "ok" if not failures else "failed",
        "days_expected": days,
        "counts": counts,
        "extra_generated_counts": extra_generated_counts,
        "safety": safety,
        "missing_paths": missing_paths,
        "mojibake_files": mojibake_files,
        "secret_value_hits": secret_hits,
        "post_statuses": statuses,
        "failures": failures,
    }
    save_stage("preflight_audit.json", audit)
    write_json(REPORTS_DIR / "latest" / "preflight-audit.json", audit)
    write_text(
        OUTPUT_DIR / "reports" / "preflight_audit.md",
        "\n".join(
            [
                "# Preflight Audit",
                "",
                f"- status: {audit['status']}",
                f"- days_expected: {days}",
                f"- dry_run: {safety['dry_run']}",
                f"- auto_post_false: {safety['auto_post_false']}",
                f"- threads_api_not_called: {safety['threads_api_not_called']}",
                f"- low_quality_gate_blocks: {safety['low_quality_gate_blocks']}",
                f"- missing_paths: {len(missing_paths)}",
                f"- mojibake_files: {len(mojibake_files)}",
                f"- secret_value_hits: {len(secret_hits)}",
                "",
            ]
        ),
    )
    return audit


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Audit DRY_RUN artifacts before operational review")
    parser.add_argument("--days", type=int, default=7)
    args = parser.parse_args()
    result = run(days=args.days)
    if result["status"] != "ok":
        raise SystemExit(1)
