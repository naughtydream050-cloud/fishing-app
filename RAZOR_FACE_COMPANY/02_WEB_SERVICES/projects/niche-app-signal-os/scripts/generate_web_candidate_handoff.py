from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from common import DATA_DIR, OUTPUT_DIR, PROJECT_ROOT, REPORTS_DIR, read_json, today_iso, write_json, write_text


HANDOFF_DIR = PROJECT_ROOT / "handoff" / "oshi-activity-management"


def _load_text(path_text: str, max_chars: int = 1200) -> str:
    path = PROJECT_ROOT / path_text
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8").strip()[:max_chars]


def _safe_candidate() -> dict[str, Any]:
    review = read_json(OUTPUT_DIR / "reports" / "editorial_review.json", {})
    focus = review.get("decisions", {}).get("web_candidate_focus") or {}
    if focus:
        return focus
    candidates = read_json(DATA_DIR / "build_candidates.json", [])
    return candidates[0] if candidates else {}


def _related_outputs() -> list[dict[str, Any]]:
    context = read_json(REPORTS_DIR / "latest" / "context-pack.json", {})
    outputs = context.get("daily_outputs", [])
    related = []
    for item in outputs:
        category = item.get("category", "")
        if any(key in category for key in ["推し", "ライブ", "グッズ", "遠征"]):
            related.append(item)
    return related[:4]


def _json_pack(candidate: dict[str, Any], related: list[dict[str, Any]]) -> dict[str, Any]:
    pain_points = sorted({item.get("pain_point", "") for item in related if item.get("pain_point")})
    evidence_sources = []
    for item in related:
        evidence_sources.extend([item.get("md"), item.get("json"), item.get("research_memory"), item.get("council_memory")])
    evidence_sources = [source for source in evidence_sources if source]
    return {
        "candidate_id": "oshi-activity-management",
        "date": today_iso(),
        "category": candidate.get("category", "推し活管理"),
        "target_user": candidate.get("target_user", "複数の推し活予定をスマホで管理する人"),
        "pain_points": pain_points or ["推し活の予定、当落、入金、同行者メモが散らばる"],
        "mvp_features": [
            "現場予定の一覧",
            "当落ステータス管理",
            "入金期限メモ",
            "同行者メモ",
            "グッズ/遠征費の簡易メモ",
        ],
        "note_angle": "なぜ推し活の予定と当落メモは、普通のカレンダーだけだと散らばるのか",
        "monetization_path": [
            "無料: ローカル保存の現場メモ",
            "有料候補: CSV出力、通知、テンプレ、複数カテゴリ管理",
            "将来候補: note記事からWebアプリ待機リストへ誘導",
        ],
        "confidence_score": int(candidate.get("signal_score") or 10),
        "evidence_sources": evidence_sources,
        "next_action": "GPTへhandoff packを相談してからWeb MVP実装判断を行う",
        "safety": {
            "auto_post": False,
            "dry_run": True,
            "threads_real_posting": False,
            "external_api_added": False,
        },
    }


def _build_handoff_md(pack: dict[str, Any], related: list[dict[str, Any]]) -> str:
    evidence_lines = []
    for item in related:
        evidence_lines.append(f"- {item.get('date')}: {item.get('category')} / quality={item.get('quality_score')} risk={item.get('risk_score')}")
    return "\n".join(
        [
            "# Build Handoff - Oshi Activity Management",
            "",
            "## Candidate Summary",
            "推し活の現場予定、当落、入金、同行者メモを一画面で整理するローカルファーストのミニWebアプリ候補。",
            "",
            "## Target User",
            f"- {pack['target_user']}",
            "",
            "## User Pain",
            *[f"- {pain}" for pain in pack["pain_points"]],
            "",
            "## Old Way / Current Workaround",
            "- カレンダー、メモ、スクショ、SNS DM、チケットサイトを行き来する。",
            "- 支払い期限や同行者情報が、楽しい予定と別管理になる。",
            "",
            "## MVP Solution",
            "- 現場ごとに予定、当落、入金、同行者、メモを1枚のカードで管理する。",
            "- まずはログインなし、ローカル保存、手入力で始める。",
            "",
            "## Core Features",
            *[f"- {feature}" for feature in pack["mvp_features"]],
            "",
            "## First Screen Idea",
            "- 左: 現場カード一覧",
            "- 右: 選択した現場の当落/入金/同行者/メモ編集",
            "- 上部: 次の期限、未入金、当落待ちの小さなサマリー",
            "",
            "## Data Model Draft",
            "- event_id",
            "- title",
            "- venue",
            "- event_date",
            "- lottery_status",
            "- payment_status",
            "- payment_due_date",
            "- companion_name",
            "- goods_budget",
            "- travel_cost",
            "- memo",
            "",
            "## Note Article Angle",
            f"- {pack['note_angle']}",
            "",
            "## Threads Evidence",
            *evidence_lines,
            "",
            "## Why This Should Be Built First",
            "- 7日DRY_RUNのEditorial Reviewでkeep categoryの先頭。",
            "- 推し活、ライブ記録、グッズ、遠征費の隣接カテゴリを束ねやすい。",
            "- DB/Auth/paymentなしでもMVP価値を検証できる。",
            "",
            "## Risks",
            "- 実在サービスのチケット情報連携に踏み込むと規約/認証リスクが増える。",
            "- 最初から通知や共有を入れると実装範囲が膨らむ。",
            "- 完成品のように宣伝せず、仮説検証として扱う。",
            "",
            "## Next Codex Build Prompt",
            "See `NEXT_BUILD_PROMPT.md`.",
            "",
        ]
    )


def _mvp_spec_md(pack: dict[str, Any]) -> str:
    return "\n".join(
        [
            "# MVP Spec - Oshi Activity Management",
            "",
            "## MVP Scope",
            "- ローカル保存の推し活予定管理Webアプリ。",
            "- ログインなし、外部APIなし、手入力のみ。",
            "",
            "## Non-Goals",
            "- Threads自動投稿",
            "- チケットサイト連携",
            "- LINE通知",
            "- 決済",
            "- Auth/RLS/DB",
            "",
            "## User Flow",
            "1. 現場カードを追加する。",
            "2. 公演日、会場、当落、入金期限を入力する。",
            "3. 同行者、グッズ予算、遠征費、メモを追記する。",
            "4. 次にやることを一覧で確認する。",
            "",
            "## Screens",
            "- Dashboard: 次の期限、当落待ち、未入金、総予算",
            "- Event List: 現場カード一覧",
            "- Event Detail: 入力フォームとメモ",
            "- Export: JSON/CSVの簡易出力候補",
            "",
            "## Fields",
            *[f"- {field}" for field in ["title", "venue", "event_date", "lottery_status", "payment_status", "payment_due_date", "companion_name", "goods_budget", "travel_cost", "memo"]],
            "",
            "## Validation Rules",
            "- title is required",
            "- event_date must be valid date when provided",
            "- payment_due_date must be valid date when provided",
            "- cost fields must be non-negative numbers",
            "",
            "## Local-First Version",
            "- localStorage or a single JSON file export/import.",
            "- No server required for MVP.",
            "",
            "## Future Path",
            "- Paid: reminders, CSV export, multi-device sync.",
            "- Note: build diary and problem framing.",
            "- SaaS: only after repeated demand signals.",
            "",
        ]
    )


def _note_angle_md(pack: dict[str, Any]) -> str:
    return "\n".join(
        [
            "# Note Angle",
            "",
            "## Title Candidates",
            "- 推し活の予定管理、なぜカレンダーだけだと足りないのか",
            "- 当落、入金、同行者メモが散らばる問題を小さなアプリにする",
            "- 推し活の楽しい予定ほど、管理が地味に面倒になる話",
            "",
            "## Article Structure",
            "1. 推し活管理の小さい面倒",
            "2. 今の回避策: カレンダー、メモ、スクショ、DM",
            "3. なぜ散らばるのか",
            "4. 1画面で見たい情報",
            "5. まず作るならログインなしの小さいWebアプリ",
            "6. 読者に聞く: Notionで十分か、専用アプリが欲しいか",
            "",
            "## Before / After",
            "- Before: 予定、当落、支払い、同行者が別々。",
            "- After: 現場ごとのカードで次の行動が見える。",
            "",
            "## Natural CTA",
            "- こういう推し活管理ボードがあったら使うか、コメントで聞く。",
            "- 待機リストではなく、まずはスクショ付き仮説紹介にする。",
            "",
        ]
    )


def _threads_evidence_md(related: list[dict[str, Any]]) -> str:
    lines = ["# Threads Evidence", "", "## Related 7-Day DRY_RUN Outputs"]
    for item in related:
        post_text = _load_text(item.get("md", ""), max_chars=420)
        lines.extend(
            [
                "",
                f"### {item.get('date')} - {item.get('category')}",
                f"- target_user: {item.get('target_user')}",
                f"- pain_point: {item.get('pain_point')}",
                f"- quality_score: {item.get('quality_score')}",
                f"- risk_score: {item.get('risk_score')}",
                "- generated_post_excerpt:",
                "```text",
                post_text,
                "```",
            ]
        )
    lines.extend(
        [
            "",
            "## Why Kept",
            "- 推し活管理、ライブ記録、グッズ管理、遠征費管理は隣接しており、1つのWeb候補へ束ねやすい。",
            "- 期限、支払い、同行者、記録という具体的な管理課題がある。",
            "",
            "## Why Others Were Not First",
            "- SNS/note/AI返信/EC/DTM候補は別プロダクトになりやすく、最初のWeb候補としては範囲が広がる。",
            "",
        ]
    )
    return "\n".join(lines)


def _next_build_prompt_md() -> str:
    return "\n".join(
        [
            "# Next Build Prompt",
            "",
            "あなたはCodexです。",
            "",
            "Task:",
            "Niche App Signal OSのDRY_RUNレビューで選ばれた `oshi-activity-management` を、DB/Auth/paymentなしのローカルファーストWeb MVPとして新規実装してください。",
            "",
            "Read first:",
            "- `handoff/oshi-activity-management/BUILD_HANDOFF.md`",
            "- `handoff/oshi-activity-management/MVP_SPEC.md`",
            "- `handoff/oshi-activity-management/THREADS_EVIDENCE.md`",
            "",
            "Constraints:",
            "- AUTO_POSTやThreads APIには触らない",
            "- Secrets/API keysを扱わない",
            "- 既存productionや他プロジェクトを触らない",
            "- DB/Auth/payment/RLSなし",
            "- localStorageで保存",
            "- 日本語UI",
            "",
            "Build:",
            "- 現場カード一覧",
            "- 当落/入金/同行者/費用/メモ編集",
            "- 次の期限サマリー",
            "- JSON export/import",
            "",
            "Verify:",
            "- local run",
            "- lint/build相当",
            "- 主要UIが日本語で読める",
            "- データ追加/編集/削除/保存ができる",
            "",
        ]
    )


def run() -> dict[str, Any]:
    HANDOFF_DIR.mkdir(parents=True, exist_ok=True)
    candidate = _safe_candidate()
    related = _related_outputs()
    pack = _json_pack(candidate, related)

    write_text(HANDOFF_DIR / "BUILD_HANDOFF.md", _build_handoff_md(pack, related))
    write_text(HANDOFF_DIR / "MVP_SPEC.md", _mvp_spec_md(pack))
    write_text(HANDOFF_DIR / "NOTE_ANGLE.md", _note_angle_md(pack))
    write_text(HANDOFF_DIR / "THREADS_EVIDENCE.md", _threads_evidence_md(related))
    write_text(HANDOFF_DIR / "NEXT_BUILD_PROMPT.md", _next_build_prompt_md())
    write_json(DATA_DIR / "web_candidate_handoff.json", pack)

    report = {
        "date": today_iso(),
        "status": "ok",
        "candidate_id": pack["candidate_id"],
        "category": pack["category"],
        "target_user": pack["target_user"],
        "handoff_dir": "handoff/oshi-activity-management",
        "files": [
            "handoff/oshi-activity-management/BUILD_HANDOFF.md",
            "handoff/oshi-activity-management/MVP_SPEC.md",
            "handoff/oshi-activity-management/NOTE_ANGLE.md",
            "handoff/oshi-activity-management/THREADS_EVIDENCE.md",
            "handoff/oshi-activity-management/NEXT_BUILD_PROMPT.md",
            "data/web_candidate_handoff.json",
        ],
        "adopted_reason": "7日DRY_RUNのEditorial Reviewで推し活関連カテゴリがkeepされ、Web化候補として束ねやすいため。",
        "excluded_reason": "投稿/analytics自動化はAUTO_POSTや外部API判断に近づくため、今回は除外。",
        "next_gpt_question": "このhandoff packを元に、実Web MVP実装へ進むか判断する。",
        "safety": pack["safety"],
    }
    write_json(OUTPUT_DIR / "reports" / "web_candidate_handoff_report.json", report)
    write_text(
        OUTPUT_DIR / "reports" / "web_candidate_handoff_report.md",
        "\n".join(
            [
                "# Web Candidate Handoff Report",
                "",
                f"- date: {today_iso()}",
                f"- status: {report['status']}",
                f"- candidate_id: {pack['candidate_id']}",
                f"- category: {pack['category']}",
                f"- handoff_dir: {report['handoff_dir']}",
                "- auto_post: false",
                "- dry_run: true",
                "- threads_real_posting: false",
                "",
                "## Adopted Reason",
                report["adopted_reason"],
                "",
                "## Excluded Reason",
                report["excluded_reason"],
                "",
                "## Files",
                *[f"- {file}" for file in report["files"]],
                "",
                "## Next GPT Question",
                report["next_gpt_question"],
                "",
            ]
        ),
    )
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Web candidate handoff pack from DRY_RUN review")
    parser.parse_args()
    run()
