from __future__ import annotations

from common import OUTPUT_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_json, write_text


def _selected_candidate() -> dict:
    pack = load_latest("daily_niche_ui_candidates.json", {})
    selected_id = pack.get("selected_candidate_id", "")
    for candidate in pack.get("candidates", []):
        if candidate.get("candidate_id") == selected_id:
            return candidate
    return {}


def _split_workaround(text: str) -> list[str]:
    parts = [part.strip(" 、。") for part in text.replace("、", ",").split(",") if part.strip(" 、。")]
    return parts[:4]


def _variant_text(candidate: dict, profile: dict, style: str) -> str:
    category = candidate.get("category", "この不便")
    pain = candidate.get("pain_point", "")
    workaround = _split_workaround(candidate.get("current_workaround", ""))
    metaphor = candidate.get("expected_ui_metaphor", "ログアプリ")
    cta = (profile.get("cta_style") or ["これ欲しい？今のやり方で十分？"])[0]
    if profile.get("tone_id") == "gen_z_oshi_activity":
        lines = [
            f"{category}、前日になると普通にバタつかない？",
            "",
            "チケットどこ",
            "身分証いるっけ",
            "充電器入れたっけ",
            "前回忘れたやつ何だっけ",
            "",
            "毎回スクショとメモを行ったり来たりして、出発前に小さく焦るやつ。",
            "",
            f"{metaphor}で、現場前にまとめて残せたら使う？",
            cta,
        ]
        return "\n".join(lines)
    if style == "short":
        return "\n".join(
            [
                f"{category}って、地味に毎回探さない？",
                "",
                pain,
                "",
                f"今は{candidate.get('current_workaround', 'メモ')}で何とかしてるけど、あとで見返す時に散らばりがち。",
                "",
                f"{metaphor}みたいに残せたら使う？",
            ]
        )
    bullets = workaround or ["メモ", "スクショ", "カレンダー"]
    return "\n".join(
        [
            f"{category}、あとで見返したい時ほど散らばらない？",
            "",
            *[f"{item}に残す" for item in bullets],
            "",
            pain,
            "",
            f"{metaphor}で一か所に残せたら使う？",
            "それとも今のやり方で十分？",
        ]
    )


def _tone_check(text: str, profile: dict) -> dict:
    avoid_words = profile.get("avoid_words") or []
    use_words = profile.get("use_words") or []
    used_avoid = [word for word in avoid_words if word and word in text]
    used_words = [word for word in use_words if word and word in text]
    passed = not used_avoid and bool(text.strip())
    return {
        "passed": passed,
        "tone_id": profile.get("tone_id", ""),
        "used_words": used_words,
        "used_avoid_words": used_avoid,
        "line_count": len([line for line in text.splitlines() if line.strip()]),
        "target_audience": profile.get("target_audience", ""),
    }


def run(sample: bool = False) -> dict:
    profile = load_latest("audience_tone_profile.json", {}).get("audience_tone_profile", {})
    candidate = _selected_candidate()
    variants = []
    for variant_id, style in [("A", "standard"), ("B", "short")]:
        text = _variant_text(candidate, profile, style)
        variants.append(
            {
                "variant_id": variant_id,
                "candidate_id": candidate.get("candidate_id", ""),
                "angle": style,
                "text": text,
                "tone_id": profile.get("tone_id", ""),
                "tone_check_result": _tone_check(text, profile),
                "length": len(text),
            }
        )
    passed = [variant for variant in variants if variant["tone_check_result"]["passed"]]
    selected = passed[0] if passed else variants[0]

    variants_payload = {
        "date": today_iso(),
        "candidate_id": candidate.get("candidate_id", ""),
        "tone_id": profile.get("tone_id", ""),
        "target_audience": profile.get("target_audience", ""),
        "selected_variant_id": selected["variant_id"],
        "variants": variants,
        "all_variants_tone_checked": True,
    }
    write_json(OUTPUT_DIR / "reports" / "threads_tone_variants.json", variants_payload)

    post = {
        "date": today_iso(),
        "candidate_id": candidate.get("candidate_id", ""),
        "text": selected["text"],
        "alt_text": f"{candidate.get('category', '候補')}のスマホUI風カード",
        "topic_tags": [candidate.get("category", ""), "ニッチアプリ", "DRY_RUN"],
        "decision": "dry_run",
        "tone_id": profile.get("tone_id", ""),
        "target_audience": profile.get("target_audience", ""),
        "variant_id": selected["variant_id"],
        "tone_check_result": selected["tone_check_result"],
    }
    payload = department_output(
        "Copywriting Department",
        "Generated candidate-specific Threads copy from the selected market need and audience tone profile.",
        scores={"length": len(selected["text"]), "variant_count": len(variants)},
        risks=[] if selected["tone_check_result"]["passed"] else ["no_tone_checked_variant_available"],
        next_action="generate share card",
        input_sources=["output/reports/daily_niche_ui_candidates.json", "output/reports/audience_tone_profile.json"],
        extra={"post": post, "tone_variants_path": "output/reports/threads_tone_variants.json"},
    )
    save_stage("threads_post.json", payload)
    write_text(OUTPUT_DIR / "thread_posts" / f"{today_iso()}.md", selected["text"] + "\n")
    return payload


if __name__ == "__main__":
    args = cli_parser("Generate tone-adapted Threads post").parse_args()
    run(sample=args.sample)
