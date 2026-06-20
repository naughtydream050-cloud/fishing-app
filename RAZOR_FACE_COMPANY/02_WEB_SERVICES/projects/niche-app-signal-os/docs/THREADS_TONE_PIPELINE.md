# Threads Tone Pipeline

Date: 2026-06-20

## Purpose

Threads copy must match the target audience chosen during UI/card planning.

The flow is not "always use Gen Z tone." Design Intelligence first defines `target_audience_for_copy` and `copy_tone_hint` for the current app idea. Audience Tone Adapter then converts that into a concrete copy profile before Copywriting runs.

## Pipeline Order

Research -> Audience Strategy -> Design Intelligence -> Audience Tone Adapter -> Generate Threads Post -> Quality Risk Gate -> Select Post Candidate -> Card Image -> Post To Threads

## Departments

### Design Intelligence Department

Script:

- `scripts/design_intelligence.py`

Outputs:

- `output/reports/design_strategy.json`
- `memory/design_strategy/YYYY-MM-DD.md`

Important fields:

- `target_audience_for_copy`
- `audience_context`
- `copy_tone_hint`
- `card_cta`

### Audience Tone Adapter Department

Script:

- `scripts/audience_tone_adapter.py`

Inputs:

- `output/reports/audience_strategy.json`
- `output/reports/design_strategy.json`
- `output/reports/niche_demand_score.json`
- `data/audience_tone_rules.json`

Outputs:

- `output/reports/audience_tone_profile.json`
- `memory/audience_tone/YYYY-MM-DD.md`

Used by:

- `scripts/generate_threads_post.py`
- `scripts/quality_risk_gate.py`
- `scripts/select_post_candidate.py`

## Rule: gen_z_oshi_activity

Use for `oshi-activity-management` when the UI/card target is Z世代寄りの推し活層.

Use words:

- 現場
- 見返す
- 残す
- メモった
- 散らばる
- あとで見たい
- 座席
- セトリ
- 遠征費
- グッズ
- 思い出
- ログ
- どこいった
- 写真フォルダ
- 支払い履歴

Avoid words:

- 管理
- 効率化
- 節約
- 一元管理
- SaaS
- 生産性
- 革新的
- 推し活女子
- 完璧に整理
- 試作UIを作ってます
- 作ってます
- 作りました
- 管理できます
- 節約しよう
- 無駄遣い

## Copy Structure

For `gen_z_oshi_activity`, Threads copy should:

1. Start from an あるある / 現場 scene.
2. Name scattered information concretely.
3. Avoid developer voice and finished-product wording.
4. Ask whether the user wants it or whether Notion is enough.

Example:

```text
推し活の記録、気づいたときにはマジで大散乱してて詰む。

「え、座席どこだっけ？」
「セトリどこにメモった？」
「今回の遠征費、何万飛んだ？」
「てかグッズ何買ったっけ…？」

あとで見返したいのに、毎回スクショと写真フォルダを一生スクロールして大捜索するやつ、マジでオタクあるある。

ぶっちゃけ、現場ごとに一撃で全部まとめられるログアプリとかあったら使う？
それともNotionで自作すれば事足りる感じ？
みんなのリアルな意見教えてほしい！
```

## Risk Gate

`quality_risk_gate.py` blocks or strongly warns when:

- The post is too explanatory for Threads.
- Youth slang feels unnatural.
- Oshi copy leans too hard into 管理/節約/効率化.
- Developer voice is visible.
- The post looks like a finished SaaS announcement.

## Final Selection

`scripts/select_post_candidate.py` writes `output/reports/selected_post_candidate.json`.

`scripts/post_to_threads.py` uses `selected_post_text` only when:

- `quality_risk_gate.json` is approved.
- `tone_check_result.passed` is true.
- `selected_post_candidate.json` has `selected: true`.

If tone mismatch remains, publishing stops even when live posting is enabled later.

## Safety

- DRY_RUN remains true by default.
- AUTO_POST remains false by default.
- Threads API is not called during dry-run validation.
- No external API added.
- No DB/Auth/payment/RLS added.
- No secrets required for tone adaptation.
