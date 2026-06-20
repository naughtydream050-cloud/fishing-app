from __future__ import annotations

from common import DATA_DIR, MEMORY_DIR, cli_parser, department_output, load_latest, read_json, save_stage, today_iso, write_text


OSHI_MARKERS = ["oshi", "推し", "推し活", "ライブ", "現場", "グッズ", "遠征", "セトリ", "座席"]


def _load_rules() -> dict:
    rules = read_json(DATA_DIR / "audience_tone_rules.json", {})
    return rules.get("rules", {}) if isinstance(rules, dict) else {}


def _selected_item() -> dict:
    scored = load_latest("niche_demand_score.json", {}).get("selected_candidate", {})
    return (scored or {}).get("item", {}) if isinstance(scored, dict) else {}


def _handoff_blob() -> str:
    handoff = read_json(DATA_DIR / "web_candidate_handoff.json", {})
    return str(handoff)


def _blob(audience: dict, design: dict, selected_item: dict) -> str:
    keys = [
        "target_user_segment",
        "target_audience_for_copy",
        "audience_context",
        "copy_tone_hint",
        "primary_job",
        "source_pain_point",
        "source_app_idea",
        "niche_category",
        "category",
        "app_idea",
        "pain_point",
    ]
    parts = [str(audience.get(key, "")) for key in keys]
    parts.extend(str(design.get(key, "")) for key in keys)
    parts.extend(str(selected_item.get(key, "")) for key in keys)
    parts.append(_handoff_blob())
    return " ".join(parts)


def _select_tone_id(audience: dict, design: dict, selected_item: dict, rules: dict) -> str:
    text = _blob(audience, design, selected_item)
    if "gen_z_oshi_activity" in rules and ("oshi-activity-management" in text or any(marker in text for marker in OSHI_MARKERS)):
        return "gen_z_oshi_activity"
    return "default_light_problem" if "default_light_problem" in rules else next(iter(rules), "default_light_problem")


def run(sample: bool = False) -> dict:
    audience = load_latest("audience_strategy.json", {}).get("audience_strategy") or {}
    design = load_latest("design_strategy.json", {}).get("design_strategy") or {}
    selected_item = _selected_item()
    rules = _load_rules()
    tone_id = _select_tone_id(audience, design, selected_item, rules)
    tone_rule = rules.get(tone_id, {})
    profile = {
        "date": today_iso(),
        "tone_id": tone_id,
        "target_audience": tone_rule.get("target_audience") or design.get("target_audience_for_copy") or audience.get("target_user_segment", ""),
        "target_user_segment": audience.get("target_user_segment", ""),
        "ui_target_audience": design.get("target_audience_for_copy", ""),
        "audience_context": design.get("audience_context", ""),
        "copy_tone_hint": design.get("copy_tone_hint", ""),
        "tone": tone_rule.get("tone", ""),
        "use_words": tone_rule.get("use_words", []),
        "avoid_words": tone_rule.get("avoid_words", []),
        "opening_style": tone_rule.get("opening_style", []),
        "structure": tone_rule.get("structure", []),
        "cta_style": tone_rule.get("cta_style", []),
        "max_lines": tone_rule.get("max_lines", 9),
        "source": [
            "output/reports/audience_strategy.json",
            "output/reports/design_strategy.json",
            "output/reports/niche_demand_score.json",
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
                f"- tone_id: {profile['tone_id']}",
                f"- target_audience: {profile['target_audience']}",
                f"- ui_target_audience: {profile['ui_target_audience']}",
                f"- copy_tone_hint: {profile['copy_tone_hint']}",
                "",
                "## Use Words",
                *[f"- {word}" for word in profile["use_words"]],
                "",
                "## Avoid Words",
                *[f"- {word}" for word in profile["avoid_words"]],
                "",
                "## Opening Style",
                *[f"- {item}" for item in profile["opening_style"]],
                "",
            ]
        ),
    )

    payload = department_output(
        "Audience Tone Adapter Department",
        "Design target audience and Audience Strategy were converted into a concrete Threads tone profile.",
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
