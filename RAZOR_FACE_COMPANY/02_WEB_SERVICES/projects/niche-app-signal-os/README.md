# Niche App Signal OS

Threads向けに「こんなアプリあったら便利じゃない？」系の投稿素材を生成し、反応を蓄積してWebサイト化・note化・SaaS化候補を見つける内部運用システムです。

初期状態は必ず安全側です。

- `DRY_RUN=true`
- `AUTO_POST=false`
- APIキーやトークン値はログに出さない
- MVPでは大規模スクレイピングしない
- 手動入力JSON/CSV相当の貼り付け分析を優先する

## Daily Run

```powershell
python scripts/run_daily_pipeline.py --dry-run
```

## 7-Day Dry Run Batch

```powershell
python scripts/run_dry_run_batch.py --days 7
```

This generates seven days of post drafts, JSON payloads, card SVG/HTML assets, Memory Box notes, Council notes, weekly learning, and a batch report. It does not call the Threads API and keeps `AUTO_POST=false`.

## Audience / Design Harness

The pipeline includes an audience and design strategy layer before card generation:

- `scripts/audience_strategy.py`: defines who the idea is for, what language fits, and what wording to avoid.
- `scripts/audience_tone_adapter.py`: adapts Threads post tone, vocabulary, and structure before copywriting.
- `scripts/design_intelligence.py`: turns the audience strategy into UI metaphor, color direction, must-show fields, and visual anti-patterns.
- `scripts/update_reaction_memory.py`: creates and summarizes `data/reaction_memory.json` for manual post reactions.

This keeps the system focused on demand validation, not just post generation. For example, `oshi-activity-management` should be presented as a pastel, ticket-stub/notebook-like推し活ログ rather than a sterile management dashboard.

See `docs/HARNESS_AUDIENCE_DESIGN_LOOP.md`.

For Threads tone rules, see `docs/THREADS_TONE_PIPELINE.md`.

## Threads Auto Post Preparation

Live posting remains disabled by default. The guarded posting path requires:

- `AUTO_POST=true`
- `DRY_RUN=false`
- `THREADS_AUTO_POST_ENABLED=true`
- `THREADS_ACCESS_TOKEN`
- `THREADS_USER_ID`
- `THREADS_TARGET_HANDLE`
- target handle match against `data/manual_threads_target.json`
- duplicate guard pass against `data/post_history.json`

Setup notes: `docs/THREADS_API_SETUP.md` and `docs/AUTO_POST_SETUP.md`.

## Preflight Audit

```powershell
python scripts/audit_dry_run_outputs.py --days 7
```

This checks artifact counts, `DRY_RUN=true`, `AUTO_POST=false`, `threads_api_called=false`, low-quality gate blocking, missing files, mojibake markers, and accidental secret-value exposure.

## Editorial Review

```powershell
python scripts/review_dry_run_batch.py
```

This ranks the 7-day DRY_RUN categories, writes keep/reduce decisions, and creates Web/note candidate shortlists without touching Threads posting.

## Web MVP

```powershell
python scripts/generate_web_candidate_handoff.py
python scripts/validate_web_mvp.py
```

The first local-first MVP lives at `web/oshi-activity-management/index.html`.
Open that file in a browser. It uses `localStorage`, JSON import/export, and no DB/Auth/payment/external API.

主な成果物:

- `output/thread_posts/YYYY-MM-DD.md`
- `output/card_images/YYYY-MM-DD.svg`
- `output/card_images/YYYY-MM-DD.html`
- `output/reports/*.json`
- `memory/research/YYYY-MM-DD.md`
- `memory/council/YYYY-MM-DD.md`
- `memory/reports/weekly_report.md`
- `reports/latest/context-pack.json`

## Live Posting

ライブ投稿は初期実装ではガードされています。`AUTO_POST=true`化、Threads API権限、Secrets運用は `docs/CONSULT_GPT.md` と `docs/AUTO_POST_SETUP.md` を確認してから判断します。
