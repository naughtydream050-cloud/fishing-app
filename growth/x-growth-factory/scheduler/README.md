# Posting Workflow

Dry-run:

```bash
node growth/x-growth-factory/scheduler/post-next-approved.mjs --dry-run
```

Manual export:

```bash
X_AUTO_POST_ENABLED=true X_POSTING_ADAPTER=manual node growth/x-growth-factory/scheduler/post-next-approved.mjs
```

Webhook:

```bash
X_AUTO_POST_ENABLED=true X_POSTING_ADAPTER=webhook X_WEBHOOK_URL=https://example.com/hook node growth/x-growth-factory/scheduler/post-next-approved.mjs
```

X API:

```bash
X_AUTO_POST_ENABLED=true X_POSTING_ADAPTER=x_api node growth/x-growth-factory/scheduler/post-next-approved.mjs
```

Required for X API:
- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`

No adapter performs likes, follows, replies, DMs, or quote posts.
