# Threads Tone Pipeline

Date: 2026-06-20

## Purpose

Audience Strategy defines who the idea is for. Audience Tone Adapter turns that into Threads-native copy behavior before Copywriting runs.

The goal is to avoid generic explanation copy and make each post sound natural for the target audience.

## New Department

### Audience Tone Adapter Department

Script:

- `scripts/audience_tone_adapter.py`

Inputs:

- `output/reports/audience_strategy.json`
- `data/audience_tone_rules.json`

Outputs:

- `output/reports/audience_tone_profile.json`
- `memory/audience_tone/YYYY-MM-DD.md`

Used by:

- `scripts/generate_threads_post.py`
- `scripts/quality_risk_gate.py`

## Rule: gen_z_oshi_activity

Use for `oshi-activity-management`.

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

Avoid words:

- 効率化
- 管理しよう
- 節約しよう
- 無駄遣い
- 課金しすぎ
- 完璧に整理
- 推し活女子
- 革新的
- 業務効率
- SaaS
- 生産性

## Copy Structure

For `gen_z_oshi_activity`, Threads copy should:

1. Start from an あるある / 現場 scene.
2. Name the scattered information concretely.
3. Present the UI as a trial, not a finished SaaS.
4. Ask whether the user wants it or whether Notion is enough.

Example:

```text
現場のこと、あとで見返そうと思っても散らばりがちじゃない？
座席はスクショ、セトリはメモ、遠征費は決済履歴、グッズは写真。
ライブごとにまとめて残せる推し活ログの試作UIを作ってます。
これ欲しい？それともNotionで十分？
```

## Risk Gate Additions

`quality_risk_gate.py` now warns when:

- 投稿が説明口調すぎる
- 若者言葉が不自然すぎる
- 推し活向けなのに管理/節約/効率化が強すぎる
- 完成SaaSのように誤認させる

## Safety

- DRY_RUN remains true.
- AUTO_POST remains false.
- Threads real posting remains prohibited.
- No external API added.
- No DB/Auth/payment/RLS added.
- No secrets required.
