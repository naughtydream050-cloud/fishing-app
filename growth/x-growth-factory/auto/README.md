# SPEC AI Threads Scheduler Export

Purpose: run SPEC AI Threads growth without daily AI-token usage.

Current mode: scheduler export.

Threads API posting is intentionally paused. The system now produces a 30-day posting calendar that can be scheduled manually in Threads or imported into a free scheduler.

It does not use:
- Codex
- GPT/OpenAI
- Groq
- Gemini
- SPEC AI API
- paid APIs
- engagement automation
- Threads API

## Export Files

- `exports/threads-calendar/threads-30-day-calendar.md`
- `exports/threads-calendar/threads-30-day-calendar.csv`
- `exports/threads-calendar/posts/day-01.md` through `day-30.md`

## Threads Native Scheduling

1. Open Threads.
2. Copy one day from `posts/day-XX.md`.
3. Create a post.
4. Use Threads' native scheduling if available on the account.
5. Schedule only one post per day.

## Buffer / Manual Scheduler Import

1. Import `threads-30-day-calendar.csv`.
2. Map `suggested_date` to publish time.
3. Map `text` to post body.
4. Map `url` only when `link_included` is `true`.
5. Keep link posts at max 2/week.

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
- no secrets or API tokens required for scheduler export

## Threads API Image Posts

Threads API image posts cannot use local files such as `imageLocalPath`.

Each approved image post must include a public, unauthenticated `imageUrl` that Meta can fetch. Keep `imageLocalPath` for local audit/editing, but do not treat it as publishable by itself.

If `imageRequired` is true and `imageUrl` is missing, the daily runner must stay in `setup_required` behavior and must not silently fall back to text-only posting.
