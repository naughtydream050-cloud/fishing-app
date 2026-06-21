from __future__ import annotations

from common import DATA_DIR, MEMORY_DIR, cli_parser, department_output, load_latest, read_json, save_stage, today_iso, write_text


DEFAULT_RULE = {
    "target_audience": "daily niche app audience",
    "tone": "casual problem-first Threads copy",
    "use_words": ["あとで見返す", "散らばる", "探す", "メモ", "ログ", "これ欲しい？"],
    "avoid_words": ["革新的", "SaaS", "生産性", "業務効率", "完全自動化"],
    "opening_style": ["あるあるから入る", "アプリ説明から入らない", "1文を短くする"],
    "cta_style": ["これ欲しい？", "今のやり方で十分？", "専用であったら使う？"],
    "max_lines": 12,
}


def _load_rules() -> dict:
    rules = read_json(DATA_DIR / "audience_tone_rules.json", {})
    body = rules.get("rules", {}) if isinstance(rules, dict) else {}
    body.setdefault("default_light_problem", DEFAULT_RULE)
    body.setdefault(
        "student_casual",
        {
            **DEFAULT_RULE,
            "target_audience": "students tracking deadlines and hand-ins",
            "use_words": ["提出物", "締切", "授業ごと", "見落とす", "明日いるやつ", "これ欲しい？"],
            "avoid_words": ["業務効率", "革新的", "完全自動化", "学習管理システム"],
        },
    )
    return body


def run(sample: bool = False) -> dict:
    audience = load_latest("audience_strategy.json", {}).get("audience_strategy") or {}
    design = load_latest("design_strategy.json", {}).get("design_strategy") or {}
    rules = _load_rules()
    tone_id = audience.get("tone_id") or "default_light_problem"
    tone_rule = rules.get(tone_id) or rules["default_light_problem"]
    profile = {
        "date": today_iso(),
        "candidate_id": audience.get("candidate_id", design.get("candidate_id", "")),
        "tone_id": tone_id,
        "target_audience": tone_rule.get("target_audience") or audience.get("target_user_segment", ""),
        "target_user_segment": audience.get("target_user_segment", ""),
        "ui_target_audience": design.get("target_audience_for_copy", ""),
        "audience_context": design.get("audience_context", ""),
        "copy_tone_hint": design.get("copy_tone_hint", ""),
        "tone": tone_rule.get("tone", DEFAULT_RULE["tone"]),
        "use_words": tone_rule.get("use_words", DEFAULT_RULE["use_words"]),
        "avoid_words": tone_rule.get("avoid_words", DEFAULT_RULE["avoid_words"]),
        "opening_style": tone_rule.get("opening_style", DEFAULT_RULE["opening_style"]),
        "structure": tone_rule.get("structure", []),
        "cta_style": tone_rule.get("cta_style", DEFAULT_RULE["cta_style"]),
        "max_lines": tone_rule.get("max_lines", 12),
        "source": [
            "output/reports/audience_strategy.json",
            "output/reports/design_strategy.json",
            "data/audience_tone_rules.json",
        ],
    }

    memory_path = MEMORY_DIR / "audience_tone" / f"{today_iso()}.md"
    write_text(
        memory_path,
        "\n".join(
            [
                f"# Audience Tone - {today_iso()}",
                "",
                f"- candidate_id: {profile['candidate_id']}",
                f"- tone_id: {profile['tone_id']}",
                f"- target_audience: {profile['target_audience']}",
                "",
                "## Use Words",
                *[f"- {word}" for word in profile["use_words"]],
                "",
            ]
        ),
    )

    payload = department_output(
        "Audience Tone Adapter Department",
        "Converted candidate audience strategy into a concrete Threads tone profile.",
        scores={"use_word_count": len(profile["use_words"]), "avoid_word_count": len(profile["avoid_words"])},
        risks=[],
        next_action="generate tone-adapted Threads post",
        input_sources=profile["source"],
        extra={"audience_tone_profile": profile, "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent))},
    )
    save_stage("audience_tone_profile.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Adapt post tone to the UI/card target audience segment").parse_args()
    run(sample=args.sample)
