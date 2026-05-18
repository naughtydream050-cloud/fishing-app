# Scheduler Policy

Default:
- dry-run only
- no real posting unless `X_AUTO_POST_ENABLED=true`

Adapters:
- `manual`: write the next approved post to an export file
- `webhook`: send the next approved post to `X_WEBHOOK_URL`
- `x_api`: post to X only when all required X credentials exist

Hard gates:
- approved item must score 10/10
- no rejected draft
- no copied text flag
- no duplicate text
- no duplicate pattern from the latest post
- no forbidden claims
- no private data or secrets
- no inaccurate product facts
- no more than 1 post/day
- no more than 2 link posts/week

Forbidden automation:
- likes
- follows
- replies
- DMs
- quote posts

Queue behavior:
- dry-run does not mutate queue files
- production adapter success removes the item from `approved.json`
- every attempt writes `posting_log.json`
