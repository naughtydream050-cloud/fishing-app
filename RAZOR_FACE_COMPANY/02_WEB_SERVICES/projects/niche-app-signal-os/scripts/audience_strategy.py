from __future__ import annotations

from common import MEMORY_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_text


def _text_blob(item: dict) -> str:
    return " ".join(str(item.get(key, "")) for key in ["niche_category", "target_user", "pain_point", "app_idea", "original_text"])


def _oshi_strategy(item: dict, score: int) -> dict:
    return {
        "target_user_segment": "推し活の予定、現場記録、グッズ、遠征費、思い出メモが複数アプリに散らかるライト-ミドル層",
        "user_motivation": "管理したいというより、現場ごとの記憶と出費をあとでかわいく見返したい",
        "primary_job": "現場ごとに、ライブ参戦ログ・座席・セトリ・チケット状態・同行者・感情タグ・遠征費をまとめる",
        "current_alternatives": ["Notion", "スマホメモ", "カレンダー", "スクショ", "写真フォルダ", "家計簿アプリ"],
        "language_to_use": ["現場ごと", "見返す", "推し活ログ", "試作UI", "ログインなし", "ブラウザ保存"],
        "language_to_avoid": ["完全管理", "節約", "業務管理", "SaaS", "自動同期", "公式連携"],
        "comment_hooks": ["これ欲しい？", "Notionで十分？", "足りない項目ある？"],
        "segment_confidence": min(10, max(7, score)),
    }


def _generic_strategy(item: dict, score: int) -> dict:
    target = item.get("target_user") or "小さい面倒をスマホで管理したい人"
    pain = item.get("pain_point") or "あとから探す情報が散らかる"
    return {
        "target_user_segment": target,
        "user_motivation": f"{pain}を軽く減らしたい。重い管理ツールではなく、すぐ触れる試作UIで判断したい",
        "primary_job": pain,
        "current_alternatives": ["メモアプリ", "スプレッドシート", "Notion", "スクショ", "カレンダー"],
        "language_to_use": ["小さい面倒", "あとで見返す", "試作UI", "ログインなし", "ブラウザ保存"],
        "language_to_avoid": ["完全自動", "公式連携", "業務システム", "万能", "安全にバックアップ"],
        "comment_hooks": ["これ欲しい？", "今は何で管理してる？", "足りない項目ある？"],
        "segment_confidence": min(10, max(5, score)),
    }


def run(sample: bool = False) -> dict:
    selected = load_latest("niche_demand_score.json", {}).get("selected_candidate") or {}
    item = selected.get("item") or {}
    score = int(selected.get("score") or 0)
    blob = _text_blob(item)
    is_oshi = any(token in blob for token in ["推し", "ライブ", "グッズ", "遠征", "参戦", "チケット"])
    strategy = _oshi_strategy(item, score) if is_oshi else _generic_strategy(item, score)
    strategy.update(
        {
            "date": today_iso(),
            "candidate_category": item.get("niche_category", ""),
            "source_pain_point": item.get("pain_point", ""),
            "source_app_idea": item.get("app_idea", ""),
        }
    )

    memory_path = MEMORY_DIR / "audience" / f"{today_iso()}.md"
    write_text(
        memory_path,
        "\n".join(
            [
                f"# Audience Strategy - {today_iso()}",
                "",
                f"- target_user_segment: {strategy['target_user_segment']}",
                f"- user_motivation: {strategy['user_motivation']}",
                f"- primary_job: {strategy['primary_job']}",
                f"- segment_confidence: {strategy['segment_confidence']}",
                "",
                "## Language To Use",
                *[f"- {item}" for item in strategy["language_to_use"]],
                "",
                "## Language To Avoid",
                *[f"- {item}" for item in strategy["language_to_avoid"]],
                "",
                "## Current Alternatives",
                *[f"- {item}" for item in strategy["current_alternatives"]],
                "",
            ]
        ),
    )
    payload = department_output(
        "Audience Strategy Department",
        "投稿案を作る前に、誰に刺すか・どんな言葉なら自分ごと化するかを定義しました。",
        scores={"segment_confidence": strategy["segment_confidence"]},
        risks=[] if strategy["segment_confidence"] >= 7 else ["audience_segment_needs_more_evidence"],
        next_action="llm council",
        input_sources=["output/reports/niche_demand_score.json"],
        extra={"audience_strategy": strategy, "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent))},
    )
    save_stage("audience_strategy.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Define audience strategy before copy/design").parse_args()
    run(sample=args.sample)
