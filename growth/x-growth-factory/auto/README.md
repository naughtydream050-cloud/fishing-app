# SPEC AI Threads Auto Posting

Purpose: run daily SPEC AI Threads posting without daily AI-token usage.

The daily run uses:
- free trend sources
- deterministic topic scoring
- local templates
- safety gates
- Threads API only when explicitly enabled

It does not use:
- Codex
- GPT/OpenAI
- Groq
- Gemini
- SPEC AI API
- paid APIs
- engagement automation

## Dry Run

```bash
node growth/x-growth-factory/auto/run-daily.mjs --dry-run
```

## Production Posting

Required env:
- `THREADS_AUTO_POST_ENABLED=true`
- `THREADS_ACCESS_TOKEN`
- `THREADS_USER_ID`
- `CRON_SECRET`

Command:

```bash
THREADS_AUTO_POST_ENABLED=true CRON_SECRET=... node growth/x-growth-factory/auto/run-daily.mjs --cron-secret ...
```

Real posting is blocked unless the provided `--cron-secret` matches `CRON_SECRET`.

## Weekly PDCA

```bash
node growth/x-growth-factory/auto/run-weekly-pdca.mjs
```

Weekly PDCA reads posting logs and optional manual metrics, then updates:
- `auto/pdca/pattern-memory.json`
- `auto/pdca/weekly-pdca-report.md`

## Policy

- 1 post/day max
- max 2 link posts/week
- no copied viral posts
- no fake numbers
- no testimonials unless real and sourced
- no likes, follows, replies, DMs, or scraping
