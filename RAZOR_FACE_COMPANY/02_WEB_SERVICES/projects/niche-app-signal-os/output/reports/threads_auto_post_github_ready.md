# Threads Auto Post GitHub Readiness

Date: 2026-06-20

## Result

GitHub Actions can now run the Niche App Signal OS daily pipeline with the existing repository-level Threads secrets.

Workflow:

`.github/workflows/niche-app-signal-os-auto-post.yml`

## Posting Modes

Manual safe run:

- Trigger: `workflow_dispatch`
- Input: `live_post=false`
- Effective mode: `DRY_RUN=true`, `AUTO_POST=false`
- Threads API posting: blocked

Manual live run:

- Trigger: `workflow_dispatch`
- Input: `live_post=true`
- Effective mode: `DRY_RUN=false`, `AUTO_POST=true`
- Additional required guard: `THREADS_AUTO_POST_ENABLED=true`
- Required secrets: `THREADS_ACCESS_TOKEN`, `THREADS_USER_ID`
- Target guard: `THREADS_TARGET_HANDLE=younengsaitoshaojie`

Scheduled live run:

- Trigger: daily cron
- Effective live mode only when `THREADS_AUTO_POST_ENABLED=true`
- Otherwise it runs as dry-run.

## Secret Handling

Secrets are referenced by name only:

- `THREADS_ACCESS_TOKEN`
- `THREADS_USER_ID`
- `THREADS_AUTO_POST_ENABLED`
- `CRON_SECRET`

The target handle is set in the workflow as non-secret config:

- `THREADS_TARGET_HANDLE=younengsaitoshaojie`

No secret values were read, printed, copied, or written.

## Safety

- No Threads posting was attempted during this setup.
- `post_to_threads.py` still requires all live guards before API calls.
- Duplicate guard remains active through `data/post_history.json`.
- Target account guard remains active through `data/manual_threads_target.json`.
