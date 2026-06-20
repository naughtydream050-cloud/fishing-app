from __future__ import annotations

import argparse
import json
import os
import re
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_DIR = PROJECT_ROOT / "output"
MEMORY_DIR = PROJECT_ROOT / "memory"
REPORTS_DIR = PROJECT_ROOT / "reports"

DEFAULT_CATEGORIES = [
    "推し活管理",
    "ライブ参戦記録",
    "グッズ管理",
    "遠征費管理",
    "レシート家計簿",
    "大学生向け家計簿",
    "SNS投稿管理",
    "noteネタ管理",
    "AI返信文生成",
    "BASE/EC投稿自動化",
    "DTM/FL Studioトラブル診断",
    "個人開発SaaSチェック",
    "生活の小さい面倒解決",
    "予定/チケット/思い出管理",
    "サブスク整理",
    "画像/スクショ整理",
    "LINE返信忘れ防止",
    "チケット抽選管理",
]

SECRET_NAMES = {
    "THREADS_ACCESS_TOKEN",
    "THREADS_USER_ID",
    "THREADS_TARGET_HANDLE",
    "THREADS_AUTO_POST_ENABLED",
    "GEMINI_API_KEY",
    "GROQ_API_KEY",
}


def today_iso() -> str:
    return os.getenv("RUN_DATE") or date.today().isoformat()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_dirs() -> None:
    for path in [
        DATA_DIR,
        OUTPUT_DIR / "thread_posts",
        OUTPUT_DIR / "card_images",
        OUTPUT_DIR / "reports",
        MEMORY_DIR / "research",
        MEMORY_DIR / "audience",
        MEMORY_DIR / "audience_tone",
        MEMORY_DIR / "design_strategy",
        MEMORY_DIR / "reaction",
        MEMORY_DIR / "council",
        MEMORY_DIR / "reports",
        REPORTS_DIR / "latest",
    ]:
        path.mkdir(parents=True, exist_ok=True)


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def department_output(
    department: str,
    summary: str,
    *,
    scores: dict[str, Any] | None = None,
    risks: list[str] | None = None,
    next_action: str = "",
    input_sources: list[str] | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload = {
        "department": department,
        "date": today_iso(),
        "input_sources": input_sources or [],
        "summary": summary,
        "scores": scores or {},
        "risks": risks or [],
        "next_action": next_action,
    }
    if extra:
        payload.update(extra)
    return payload


def sample_research_items() -> list[dict[str, Any]]:
    return [
        {
            "source_platform": "manual",
            "source_url": "",
            "original_text": "ライブ遠征のホテル、交通費、チケット、グッズ代をあとから見返せるアプリがほしい。",
            "image_path": "",
            "impressions": 0,
            "likes": 18,
            "replies": 4,
            "reposts": 1,
            "saves_or_bookmarks_if_available": 6,
            "engagement_numbers": {"likes": 18, "replies": 4, "reposts": 1, "saves": 6},
            "niche_category": "遠征費管理",
            "target_user": "ライブ遠征をするファン",
            "pain_point": "遠征費と参戦記録がバラバラになる",
            "app_idea": "ライブごとに費用と思い出をまとめるミニ家計簿",
            "wording_pattern": "あとから見返したい",
            "visual_pattern": "旅程カード + 費用サマリー + 思い出メモ",
            "why_it_worked_hypothesis": "楽しい記録と現実的な出費が同時に刺さるため保存されやすい",
        },
        {
            "source_platform": "manual",
            "source_url": "",
            "original_text": "スクショに埋もれたレシートや予約番号を用途別に整理してくれる箱がほしい。",
            "image_path": "",
            "impressions": 0,
            "likes": 11,
            "replies": 2,
            "reposts": 0,
            "saves_or_bookmarks_if_available": 5,
            "engagement_numbers": {"likes": 11, "replies": 2, "reposts": 0, "saves": 5},
            "niche_category": "画像/スクショ整理",
            "target_user": "予約や買い物をスマホスクショで管理する人",
            "pain_point": "必要なスクショが見つからない",
            "app_idea": "スクショを用途別に分類し期限前に出す整理アプリ",
            "wording_pattern": "スクショに埋もれる",
            "visual_pattern": "スマホ内の束を分類するUI",
            "why_it_worked_hypothesis": "誰でも経験する小さな面倒でコメントしやすい",
        },
    ]


def load_research_items() -> list[dict[str, Any]]:
    raw = read_json(DATA_DIR / "research_sources.json", None)
    if raw is None:
        raw = read_json(DATA_DIR / "research_sources.example.json", sample_research_items())
    if isinstance(raw, dict):
        raw = raw.get("items", [])
    return list(raw)


def load_latest(name: str, default: Any) -> Any:
    return read_json(OUTPUT_DIR / "reports" / name, default)


def save_stage(name: str, payload: Any) -> Path:
    path = OUTPUT_DIR / "reports" / name
    write_json(path, payload)
    return path


def env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def redact(value: str) -> str:
    redacted = value
    for key in SECRET_NAMES:
        secret = os.getenv(key)
        if secret:
            redacted = redacted.replace(secret, f"<{key}:redacted>")
    redacted = re.sub(r"(?i)(access_token|api_key|token)=([^&\s]+)", r"\1=<redacted>", redacted)
    return redacted


def append_json_log(path: Path, entry: dict[str, Any]) -> None:
    existing = read_json(path, [])
    if not isinstance(existing, list):
        existing = []
    existing.append(entry)
    write_json(path, existing)


def cli_parser(description: str) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--dry-run", action="store_true", help="force DRY_RUN behavior")
    parser.add_argument("--sample", action="store_true", help="run against bundled sample data")
    return parser
