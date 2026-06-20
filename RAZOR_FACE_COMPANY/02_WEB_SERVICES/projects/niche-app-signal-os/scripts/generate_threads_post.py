from __future__ import annotations

from common import OUTPUT_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_json, write_text


def _selected_item() -> dict:
    scored = load_latest("niche_demand_score.json", {}).get("selected_candidate", {})
    return (scored or {}).get("item", {})


def _oshi_variants(profile: dict) -> list[dict]:
    cta = profile.get("cta") or "これ欲しい？それともNotionで十分？"
    return [
        {
            "variant_id": "A",
            "angle": "現場ごとに散らばる情報",
            "text": "\n".join(
                [
                    "現場のこと、あとで見返そうと思っても散らばりがちじゃない？",
                    "座席はスクショ、セトリはメモ、遠征費は決済履歴、グッズは写真。",
                    "ライブごとにまとめて残せる推し活ログの試作UIを作ってます。",
                    cta,
                ]
            ),
            "why": "あるあるから入り、管理/節約ではなく見返す・残す文脈に寄せる",
        },
        {
            "variant_id": "B",
            "angle": "あとで見たいのに探せない",
            "text": "\n".join(
                [
                    "ライブ終わった直後は全部覚えてるのに、あとで見たい時に限って散らばる。",
                    "座席、セトリ、同行者、遠征費、買ったグッズ、メモった感想。",
                    "現場ごとに残せるログUI、あったら使う？",
                    cta,
                ]
            ),
            "why": "余韻と記録の痛みに寄せる",
        },
        {
            "variant_id": "C",
            "angle": "Notionで十分か聞く",
            "text": "\n".join(
                [
                    "推し活の現場ログ、Notionで作れるけど毎回ちゃんと残すのはちょっと重い。",
                    "座席、チケット状態、セトリ、遠征費、思い出だけサッと残せる画面を試作中。",
                    "こういうの欲しい？それともNotionで十分？",
                ]
            ),
            "why": "代替手段との比較でコメントを誘う",
        },
    ]


def _generic_variants(profile: dict, item: dict) -> list[dict]:
    pain = item.get("pain_point") or "あとで見返したい情報が散らばる"
    idea = item.get("app_idea") or "小さい面倒を軽く残せる試作UI"
    cta = profile.get("cta") or "これ欲しい？それとも今の管理で十分？"
    return [
        {
            "variant_id": "A",
            "angle": "小さい面倒あるある",
            "text": "\n".join(
                [
                    f"{pain}、地味にあるあるじゃない？",
                    f"今のメモやスクショだとあとで探しにくいので、{idea}を試作しています。",
                    cta,
                ]
            ),
            "why": "説明よりも小さい共感から入る",
        }
    ]


def _tone_warnings(text: str, profile: dict) -> list[str]:
    warnings = []
    avoid_words = profile.get("avoid_words", [])
    used_avoid = [word for word in avoid_words if word and word in text]
    use_words = profile.get("use_words", [])
    used_count = sum(1 for word in use_words if word and word in text)
    if used_avoid:
        warnings.append(f"avoid_words_used: {', '.join(used_avoid)}")
    if profile.get("tone_id") == "gen_z_oshi_activity" and used_count < 4:
        warnings.append("oshi_tone_use_words_too_few")
    if "このアプリは" in text or "提供します" in text:
        warnings.append("too_explanatory_or_finished_product_like")
    return warnings


def run(sample: bool = False) -> dict:
    council = load_latest("llm_council.json", {}).get("decision_payload", {})
    tone_report = load_latest("audience_tone_profile.json", {})
    profile = tone_report.get("audience_tone_profile") or {}
    item = _selected_item()
    tone_id = profile.get("tone_id", "default_light_problem")

    variants = _oshi_variants(profile) if tone_id == "gen_z_oshi_activity" else _generic_variants(profile, item)
    for variant in variants:
        variant["tone_id"] = tone_id
        variant["warnings"] = _tone_warnings(variant["text"], profile)
        variant["line_count"] = len(variant["text"].splitlines())
        variant["length"] = len(variant["text"])

    selected = variants[0]
    variants_payload = {
        "date": today_iso(),
        "tone_id": tone_id,
        "selected_variant_id": selected["variant_id"],
        "variants": variants,
        "profile_source": "output/reports/audience_tone_profile.json",
    }
    write_json(OUTPUT_DIR / "reports" / "threads_tone_variants.json", variants_payload)

    payload = department_output(
        "Copywriting Department",
        "Audience Tone Profileを参照し、Threads向け投稿variantを生成しました。",
        scores={"length": selected["length"], "line_count": selected["line_count"], "variant_count": len(variants)},
        risks=selected["warnings"],
        next_action="card image",
        input_sources=["output/reports/llm_council.json", "output/reports/audience_tone_profile.json"],
        extra={
            "post": {
                "date": today_iso(),
                "text": selected["text"],
                "alt_text": "推し活ログの試作UI。現場ごとに座席、セトリ、チケット状態、同行者、感情タグ、遠征費を見返せるカード。",
                "topic_tags": [item.get("niche_category", council.get("selected_niche", "個人開発"))],
                "decision": council.get("decision", "dry_run"),
                "tone_id": tone_id,
                "variant_id": selected["variant_id"],
            },
            "tone_variants_path": "output/reports/threads_tone_variants.json",
        },
    )
    save_stage("threads_post.json", payload)
    write_text(OUTPUT_DIR / "thread_posts" / f"{today_iso()}.md", selected["text"] + "\n")
    return payload


if __name__ == "__main__":
    args = cli_parser("Generate tone-adapted Threads post").parse_args()
    run(sample=args.sample)
