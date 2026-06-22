from __future__ import annotations

import hashlib
import re

from common import OUTPUT_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_json, write_text


NEED_RULES = [
    {
        "candidate_id": "receipt-payment-retrace",
        "category": "receipt-payment-log",
        "keywords": ["レシート", "領収書", "返品", "支払い", "明細", "購入履歴", "買い物", "EC"],
        "pain_point": "レシートや支払い履歴をあとで探す時に、写真フォルダやカード明細を行き来するのが面倒",
        "target_user": "買い物履歴や返品期限をスマホで探しがちな生活者",
        "current_workaround": "写真フォルダ、カード明細、EC購入履歴を別々に見る",
        "why_niche": "家計簿ほど重くなく、買ったもの単位で見返したい小さな不便に絞れる",
        "why_now": "キャッシュレスとEC購入が増え、支払いの証拠が複数アプリに散らばりやすい",
        "existing_alternatives": ["家計簿アプリ", "写真フォルダ", "カード明細", "EC購入履歴"],
        "expected_ui_metaphor": "買ったものごとのスマホ領収書ログ",
    },
    {
        "candidate_id": "student-deadline-check",
        "category": "student-deadline-board",
        "keywords": ["提出", "課題", "レポート", "授業", "学校", "締切", "小テスト", "学生"],
        "pain_point": "授業ごとの提出物や小テストがポータル、LINE、カレンダー、メモに散らばって忘れやすい",
        "target_user": "課題や提出期限をスマホで確認する学生",
        "current_workaround": "学校ポータル、LINE、カレンダー、スマホメモを行き来する",
        "why_niche": "本格的な学習管理ではなく、提出物の見落とし防止だけに絞れる",
        "why_now": "連絡手段が複数化し、期限情報が授業ごとに散らばりやすい",
        "existing_alternatives": ["学校ポータル", "LINE", "Googleカレンダー", "メモアプリ"],
        "expected_ui_metaphor": "授業別の提出物スマホボード",
    },
    {
        "candidate_id": "subscription-renewal-snapshot",
        "category": "subscription-renewal-log",
        "keywords": ["サブスク", "定期", "更新", "解約", "月額", "料金", "支払い"],
        "pain_point": "サブスクの更新日や月額がメール、カード明細、アプリ内設定に散らばって見えにくい",
        "target_user": "複数のサブスクをなんとなく契約したままにしているスマホユーザー",
        "current_workaround": "メール検索、カード明細、各サービスのアカウント画面を見る",
        "why_niche": "節約説教ではなく、更新前に見返すログだけなら投稿で伝わりやすい",
        "why_now": "小額サブスクが増え、更新タイミングの把握が日常的な不便になっている",
        "existing_alternatives": ["カード明細", "メール検索", "家計簿アプリ"],
        "expected_ui_metaphor": "更新日順のサブスク棚スマホUI",
    },
    {
        "candidate_id": "trip-packing-last-check",
        "category": "travel-packing-check",
        "keywords": ["旅行", "遠征", "荷物", "持ち物", "忘れ物", "準備", "チェックリスト"],
        "pain_point": "旅行や遠征の持ち物が毎回メモや写真に散らばって、出発前に不安になる",
        "target_user": "旅行やライブ遠征の直前にスマホで持ち物を確認する人",
        "current_workaround": "メモアプリ、過去の写真、LINE、自作チェックリストを見る",
        "why_niche": "旅行予約ではなく、直前の忘れ物不安だけに絞った画面が作れる",
        "why_now": "週末旅行やイベント遠征の準備情報がスマホ内に散らばりやすい",
        "existing_alternatives": ["メモアプリ", "Notion", "紙のチェックリスト"],
        "expected_ui_metaphor": "出発前のスマホ持ち物チェック画面",
    },
    {
        "candidate_id": "oshi-goods-inventory",
        "category": "oshi-goods-inventory",
        "keywords": ["推し", "グッズ", "ライブ", "現場", "チェキ", "アクスタ", "在庫", "交換"],
        "pain_point": "買ったグッズや交換予定が写真フォルダ、メモ、DMに散らばって分からなくなる",
        "target_user": "推し活のグッズや現場記録をスマホで見返したい人",
        "current_workaround": "写真フォルダ、メモ、DM、スプレッドシートを行き来する",
        "why_niche": "推し活全体ではなく、グッズと現場ログの見返しに絞れる",
        "why_now": "現場ごとの購入物や交換予定が増え、あとで見返すニーズが出やすい",
        "existing_alternatives": ["写真フォルダ", "Notion", "スプレッドシート", "メモアプリ"],
        "expected_ui_metaphor": "現場ごとのグッズ在庫スマホログ",
    },
]


def _hash_urls(urls: list[str]) -> str:
    joined = "\n".join(sorted(set(urls)))
    return hashlib.sha256(joined.encode("utf-8")).hexdigest() if joined else ""


def _score_signal(rule: dict, signal: dict) -> int:
    blob = f"{signal.get('title', '')} {signal.get('summary', '')} {' '.join(signal.get('niche_hints', []))}"
    return sum(1 for keyword in rule["keywords"] if keyword in blob)


def _fallback_rule(signals: list[dict]) -> dict | None:
    blob = " ".join(f"{item.get('title', '')} {item.get('summary', '')} {' '.join(item.get('niche_hints', []))}" for item in signals)
    if re.search(r"レシート|支払い|買い物|明細|返品", blob):
        return NEED_RULES[0]
    return NEED_RULES[0] if signals else None


def _candidate_from_rule(rule: dict, matched: list[dict], freshness: str, fallback_reason: str) -> dict:
    evidence_texts = []
    urls = []
    source_types = []
    for signal in matched[:5]:
        text = " / ".join(part for part in [signal.get("title", ""), signal.get("summary", "")[:160]] if part)
        if text:
            evidence_texts.append(text)
        url = signal.get("item_url") or signal.get("source_url", "")
        if url:
            urls.append(url)
        if signal.get("source_type"):
            source_types.append(signal["source_type"])
    return {
        "candidate_id": rule["candidate_id"],
        "category": rule["category"],
        "pain_point": rule["pain_point"],
        "target_user": rule["target_user"],
        "current_workaround": rule["current_workaround"],
        "evidence_texts": evidence_texts,
        "source_type": "public_market_research",
        "source_urls": sorted(set(urls)),
        "source_types": sorted(set(source_types)),
        "evidence_count": len(evidence_texts),
        "research_freshness": freshness if evidence_texts and urls else "stale_blocked",
        "fallback_reason": fallback_reason,
        "source_urls_hash": _hash_urls(urls),
        "why_niche": rule["why_niche"],
        "why_now": rule["why_now"],
        "existing_alternatives": rule["existing_alternatives"],
        "expected_ui_metaphor": rule["expected_ui_metaphor"],
    }


def run(sample: bool = False) -> dict:
    research = load_latest("public_market_research.json", {})
    signals = research.get("signals", []) if isinstance(research, dict) else []
    freshness = research.get("research_freshness", "stale_blocked") if isinstance(research, dict) else "stale_blocked"
    candidates = []

    for rule in NEED_RULES:
        matched = [signal for signal in signals if _score_signal(rule, signal) > 0]
        matched.sort(key=lambda signal: _score_signal(rule, signal), reverse=True)
        if matched:
            candidates.append(_candidate_from_rule(rule, matched, freshness, ""))

    if not candidates and signals:
        rule = _fallback_rule(signals)
        if rule:
            candidates.append(
                _candidate_from_rule(
                    rule,
                    signals[:5],
                    "fallback_with_reason",
                    "public signals existed but did not strongly match niche rules; mapped to closest reusable pain pattern",
                )
            )

    risks = []
    if not signals:
        risks.append("no_raw_market_signals")
    if not candidates:
        risks.append("no_extracted_market_needs")

    payload = department_output(
        "Market Need Extraction Department",
        "Extracted candidate-shaped niche app needs from daily public market signals.",
        scores={"signal_count": len(signals), "candidate_count": len(candidates)},
        risks=risks,
        next_action="collect research inputs" if candidates else "manual fallback or stop",
        input_sources=["output/reports/public_market_research.json"],
        extra={"items": candidates, "signals_used": len(signals)},
    )
    write_json(OUTPUT_DIR / "reports" / "extracted_market_needs.json", payload)
    write_text(
        OUTPUT_DIR / "reports" / "extracted_market_needs.md",
        "\n".join(
            [
                f"# Extracted Market Needs - {today_iso()}",
                "",
                f"- signal_count: {len(signals)}",
                f"- candidate_count: {len(candidates)}",
                "",
                "## Candidates",
                *[
                    f"- {item['candidate_id']}: evidence={item['evidence_count']} freshness={item['research_freshness']} urls={len(item['source_urls'])}"
                    for item in candidates
                ],
                "",
            ]
        ),
    )
    save_stage("market_need_extraction_stage.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Extract market needs from public signals").parse_args()
    run(sample=args.sample)
