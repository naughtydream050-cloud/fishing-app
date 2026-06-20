# Threads Tone Pipeline Report

Date: 2026-06-20

Status: implemented.

## Added

- `data/audience_tone_rules.json`
- `scripts/audience_tone_adapter.py`
- `docs/THREADS_TONE_PIPELINE.md`

## Updated

- `scripts/run_daily_pipeline.py`
- `scripts/run_dry_run_batch.py`
- `scripts/generate_threads_post.py`
- `scripts/quality_risk_gate.py`
- `reports/latest/context-pack.json`

## Behavior

Audience Tone Adapter reads `output/reports/audience_strategy.json`, selects a tone rule from `data/audience_tone_rules.json`, and writes `output/reports/audience_tone_profile.json`.

Copywriting reads that tone profile and writes:

- `output/reports/threads_tone_variants.json`
- `output/reports/threads_post.json`
- `output/thread_posts/YYYY-MM-DD.md`

For `oshi-activity-management`, the selected tone is `gen_z_oshi_activity`.

## Current Selected Variant

```text
現場のこと、あとで見返そうと思っても散らばりがちじゃない？
座席はスクショ、セトリはメモ、遠征費は決済履歴、グッズは写真。
ライブごとにまとめて残せる推し活ログの試作UIを作ってます。
これ欲しい？それともNotionで十分？
```

## Safety

- DRY_RUN=true remains required.
- AUTO_POST=false remains required.
- Threads real posting remains prohibited.
- No external API was added.
- No DB/Auth/payment/RLS was added.
- No secrets were added.
