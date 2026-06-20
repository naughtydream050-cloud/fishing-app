from __future__ import annotations

from common import OUTPUT_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_json, write_text


FORBIDDEN_OSHI_WORDS = [
    "試作UIを作ってます",
    "作ってます",
    "作りました",
    "一元管理",
    "効率化",
    "管理できます",
    "生産性",
    "SaaS",
    "革新的",
    "推し活女子",
    "完璧に整理",
    "節約しよう",
    "無駄遣い",
]


def _selected_item() -> dict:
    scored = load_latest("niche_demand_score.json", {}).get("selected_candidate", {})
    return (scored or {}).get("item", {}) if isinstance(scored, dict) else {}


def _tone_profile() -> dict:
    report = load_latest("audience_tone_profile.json", {})
    return report.get("audience_tone_profile") or {}


def _content_line_count(text: str) -> int:
    return len([line for line in text.splitlines() if line.strip()])


def _tone_check(text: str, profile: dict) -> dict:
    avoid_words = list(dict.fromkeys((profile.get("avoid_words") or []) + FORBIDDEN_OSHI_WORDS))
    use_words = profile.get("use_words") or []
    used_avoid = [word for word in avoid_words if word and word in text]
    used_words = [word for word in use_words if word and word in text]
    starts_with_aruaru = text.startswith(("推し活の記録って", "推し活の記録、", "現場のあと", "ライブ後"))
    developer_markers = ["作って", "試作", "開発", "リリース", "実装"]
    developer_voice = any(marker in text for marker in developer_markers)
    tone_id = profile.get("tone_id", "")
    line_count = _content_line_count(text)
    passed = not used_avoid and not developer_voice
    if tone_id == "gen_z_oshi_activity":
        passed = passed and starts_with_aruaru and len(used_words) >= 6 and line_count <= int(profile.get("max_lines", 9))
    return {
        "passed": passed,
        "tone_id": tone_id,
        "used_words": used_words,
        "used_avoid_words": used_avoid,
        "line_count": line_count,
        "starts_with_aruaru": starts_with_aruaru,
        "developer_voice": developer_voice,
        "target_audience": profile.get("target_audience", ""),
    }


def _oshi_variants(profile: dict) -> list[dict]:
    return [
        {
            "variant_id": "A",
            "angle": "現場ごとに散らばる情報あるある",
            "text": "\n".join(
                [
                    "推し活の記録、気づいたときにはマジで大散乱してて詰む。",
                    "",
                    "「え、座席どこだっけ？」",
                    "「セトリどこにメモった？」",
                    "「今回の遠征費、何万飛んだ？」",
                    "「てかグッズ何買ったっけ…？」",
                    "",
                    "あとで見返したいのに、毎回スクショと写真フォルダを一生スクロールして大捜索するやつ、マジでオタクあるある。",
                    "",
                    "ぶっちゃけ、現場ごとに一撃で全部まとめられるログアプリとかあったら使う？",
                    "それともNotionで自作すれば事足りる感じ？",
                    "みんなのリアルな意見教えてほしい！",
                ]
            ),
            "why": "説明口調を避け、推し活の雑談に近いラフなあるあるから反応を取りにいく。",
        },
        {
            "variant_id": "B",
            "angle": "あとで見たい情報がどこいった問題",
            "text": "\n".join(
                [
                    "現場のあと、あとで見たい情報ほどどこいった？ってならない？",
                    "",
                    "座席、セトリ、グッズ、遠征費。",
                    "メモった場所も写真フォルダも支払い履歴も全部ばらばら。",
                    "",
                    "思い出ごと現場ログに残せたら使う？",
                    "Notionで十分？",
                ]
            ),
            "why": "検索できない悩みを前面に出し、専用ログ仮説への反応を聞く。",
        },
        {
            "variant_id": "C",
            "angle": "Notionで十分かを聞く",
            "text": "\n".join(
                [
                    "推し活の現場ログ、Notionで足りてる？",
                    "",
                    "座席は画像、セトリはメモ、遠征費は支払い履歴、グッズは写真フォルダ。",
                    "あとで見返す時だけ、だいたい散らばる。",
                    "",
                    "現場ごとに残す専用ログ、あったら使う？",
                ]
            ),
            "why": "既存代替手段との比較でコメントを誘う。",
        },
    ]


def _generic_variants(profile: dict, item: dict) -> list[dict]:
    pain = item.get("pain_point") or "あとで見返したい情報が散らばる"
    return [
        {
            "variant_id": "A",
            "angle": "小さな不便あるある",
            "text": "\n".join(
                [
                    f"{pain}の、地味にあるあるじゃない？",
                    "",
                    "メモした場所だけ覚えてなくて、あとで探す時間が増えるやつ。",
                    "",
                    "これだけ残せる小さなログ、あったら使う？",
                    "今のやり方で十分？",
                ]
            ),
            "why": "一般ニッチ向けの軽い問題提起。",
        }
    ]


def run(sample: bool = False) -> dict:
    council = load_latest("llm_council.json", {}).get("decision_payload", {})
    profile = _tone_profile()
    item = _selected_item()
    tone_id = profile.get("tone_id", "default_light_problem")

    variants = _oshi_variants(profile) if tone_id == "gen_z_oshi_activity" else _generic_variants(profile, item)
    for variant in variants:
        variant["tone_id"] = tone_id
        variant["tone_check_result"] = _tone_check(variant["text"], profile)
        variant["line_count"] = _content_line_count(variant["text"])
        variant["length"] = len(variant["text"])

    passed_variants = [variant for variant in variants if variant["tone_check_result"]["passed"]]
    selected = passed_variants[0] if passed_variants else variants[0]

    variants_payload = {
        "date": today_iso(),
        "tone_id": tone_id,
        "target_audience": profile.get("target_audience", ""),
        "ui_target_audience": profile.get("ui_target_audience", ""),
        "selected_variant_id": selected["variant_id"],
        "variants": variants,
        "profile_source": "output/reports/audience_tone_profile.json",
        "all_variants_tone_checked": True,
    }
    write_json(OUTPUT_DIR / "reports" / "threads_tone_variants.json", variants_payload)

    post = {
        "date": today_iso(),
        "text": selected["text"],
        "alt_text": "推し活ログボードのスマホUI風カード。ライブ参戦ログ、座席、セトリメモ、チケット状態、同行者、感情タグ、遠征費合計を見返せる画面。",
        "topic_tags": ["推し活", "ライブ参戦ログ", "現場ログ"] if tone_id == "gen_z_oshi_activity" else [item.get("niche_category", "ニッチアプリ")],
        "decision": council.get("decision", "dry_run"),
        "tone_id": tone_id,
        "target_audience": profile.get("target_audience", ""),
        "variant_id": selected["variant_id"],
        "tone_check_result": selected["tone_check_result"],
    }
    payload = department_output(
        "Copywriting Department",
        "Generated Threads variants from the Audience Tone Profile and selected tone-checked copy.",
        scores={"length": len(selected["text"]), "line_count": _content_line_count(selected["text"]), "variant_count": len(variants)},
        risks=[] if selected["tone_check_result"]["passed"] else ["no_tone_checked_variant_available"],
        next_action="quality risk gate",
        input_sources=["output/reports/llm_council.json", "output/reports/audience_tone_profile.json"],
        extra={"post": post, "tone_variants_path": "output/reports/threads_tone_variants.json"},
    )
    save_stage("threads_post.json", payload)
    write_text(OUTPUT_DIR / "thread_posts" / f"{today_iso()}.md", selected["text"] + "\n")
    return payload


if __name__ == "__main__":
    args = cli_parser("Generate tone-adapted Threads post").parse_args()
    run(sample=args.sample)
