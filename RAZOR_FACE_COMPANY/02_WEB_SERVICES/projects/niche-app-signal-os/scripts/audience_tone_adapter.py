from __future__ import annotations

from common import DATA_DIR, MEMORY_DIR, cli_parser, department_output, load_latest, read_json, save_stage, today_iso, write_text


def _load_rules() -> dict:
    rules = read_json(DATA_DIR / "audience_tone_rules.json", {})
    return rules.get("rules", {}) if isinstance(rules, dict) else {}


def _blob(strategy: dict) -> str:
    keys = ["target_user_segment", "user_motivation", "primary_job", "source_pain_point", "source_app_idea"]
    return " ".join(str(strategy.get(key, "")) for key in keys)


def _select_tone_id(strategy: dict, rules: dict) -> str:
    text = _blob(strategy)
    if any(token in text for token in ["推し", "ライブ", "現場", "グッズ", "遠征", "セトリ", "座席"]):
        return "gen_z_oshi_activity"
    return "default_light_problem" if "default_light_problem" in rules else next(iter(rules), "default_light_problem")


def run(sample: bool = False) -> dict:
    audience = load_latest("audience_strategy.json", {}).get("audience_strategy") or {}
    rules = _load_rules()
    tone_id = _select_tone_id(audience, rules)
    tone_rule = rules.get(tone_id, {})
    profile = {
        "date": today_iso(),
        "tone_id": tone_id,
        "target_user_segment": audience.get("target_user_segment", ""),
        "entry_style": tone_rule.get("entry_style", "小さい面倒"),
        "tone": tone_rule.get("tone", ""),
        "use_words": tone_rule.get("use_words", []),
        "avoid_words": tone_rule.get("avoid_words", []),
        "structure": tone_rule.get("structure", []),
        "cta": tone_rule.get("cta", "これ欲しい？"),
        "max_lines": tone_rule.get("max_lines", 5),
        "source": "output/reports/audience_strategy.json",
    }

    memory_path = MEMORY_DIR / "audience_tone" / f"{today_iso()}.md"
    write_text(
        memory_path,
        "\n".join(
            [
                f"# Audience Tone - {today_iso()}",
                "",
                f"- tone_id: {profile['tone_id']}",
                f"- entry_style: {profile['entry_style']}",
                f"- tone: {profile['tone']}",
                f"- cta: {profile['cta']}",
                "",
                "## Use Words",
                *[f"- {word}" for word in profile["use_words"]],
                "",
                "## Avoid Words",
                *[f"- {word}" for word in profile["avoid_words"]],
                "",
                "## Structure",
                *[f"- {item}" for item in profile["structure"]],
                "",
            ]
        ),
    )

    payload = department_output(
        "Audience Tone Adapter Department",
        "Audience Strategyを受け取り、Threads投稿文の口調・語彙・構成を調整しました。",
        scores={"use_word_count": len(profile["use_words"]), "avoid_word_count": len(profile["avoid_words"])},
        risks=[],
        next_action="copywriting",
        input_sources=["output/reports/audience_strategy.json", "data/audience_tone_rules.json"],
        extra={"audience_tone_profile": profile, "memory_path": str(memory_path.relative_to(MEMORY_DIR.parent))},
    )
    save_stage("audience_tone_profile.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Adapt post tone to audience segment").parse_args()
    run(sample=args.sample)
