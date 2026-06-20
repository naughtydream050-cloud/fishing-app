from __future__ import annotations

from common import MEMORY_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_text


def run(sample: bool = False) -> dict:
    today = today_iso()
    research = load_latest("research_inputs.json", {"items": []})
    viral = load_latest("viral_patterns.json", {"patterns": []})
    items = research.get("items", [])
    top = (viral.get("patterns") or [{}])[0] if viral.get("patterns") else {}
    body = "\n".join(
        [
            f"# Research Memory - {today}",
            "",
            "## 今日伸びていたテーマ",
            f"- {top.get('category', '未選定')}",
            "",
            "## 反応が良かった投稿構造",
            f"- wording: {top.get('wording_pattern', '')}",
            f"- visual: {top.get('visual_pattern', '')}",
            "",
            "## ニッチ需要メモ",
            *[f"- {i.get('niche_category')}: {i.get('pain_point')}" for i in items],
            "",
            "## 自分の投稿に変換する案",
            f"- {top.get('pain_point', '小さい面倒')}を、架空アプリUIで一瞬で伝える。",
            "",
            "## 今日の仮説",
            f"- {top.get('hypothesis', '具体的な生活場面があるほどコメントされやすい。')}",
            "",
            "## Webサイト化候補",
            "- 反応が強いカテゴリを診断ページまたは待機リストLPにする。",
            "",
            "## note化候補",
            "- なぜこの小さい面倒をアプリ化したくなるのかを開発日記にする。",
            "",
            "## 収益導線",
            "- テンプレ無料、保存/通知/CSV出力を有料候補にする。",
            "",
            "## risk_notes",
            "- 元投稿の文面や画像をコピーしない。完成品実績のように見せない。",
            "",
            "## next_test_idea",
            "- コメントが返しやすい最後の一文をA/Bで変える。",
            "",
        ]
    )
    write_text(MEMORY_DIR / "research" / f"{today}.md", body)
    payload = department_output(
        "Memory Department",
        "Obsidian互換Markdownへ今日のリサーチ記録を保存しました。",
        scores={"research_items": len(items)},
        next_action="trend timing",
        input_sources=["output/reports/research_inputs.json", "output/reports/viral_patterns.json"],
        extra={"memory_path": f"memory/research/{today}.md"},
    )
    save_stage("memory_update.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Update memory box").parse_args()
    run(sample=args.sample)
