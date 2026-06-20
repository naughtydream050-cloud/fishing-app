# Threads API Setup

Date: 2026-06-20

## Current Status

Threads API token is not available yet.

The system must stay safe until Meta Developer setup is complete.

Current required safety defaults:

- `DRY_RUN=true`
- `AUTO_POST=false`
- `THREADS_AUTO_POST_ENABLED=false`

## GitHub Secrets Names

Register these names in GitHub Actions secrets when ready:

- `THREADS_ACCESS_TOKEN`
- `THREADS_USER_ID`
- `THREADS_TARGET_HANDLE`

Optional, only if you choose to use it as a secret instead of a plain false env:

- `THREADS_AUTO_POST_ENABLED`

Do not commit secret values.

## Local / Runtime Environment Names

The posting guard reads:

- `DRY_RUN`
- `AUTO_POST`
- `THREADS_AUTO_POST_ENABLED`
- `THREADS_ACCESS_TOKEN`
- `THREADS_USER_ID`
- `THREADS_TARGET_HANDLE`
- `THREADS_IMAGE_URL`
- `THREADS_GRAPH_BASE_URL`

## Required Posting Preconditions

The code will only attempt Threads API posting when all of these are true:

1. `quality_risk_gate.json` has `approved=true`.
2. `AUTO_POST=true`.
3. `DRY_RUN=false`.
4. `THREADS_AUTO_POST_ENABLED=true`.
5. `THREADS_ACCESS_TOKEN` is set.
6. `THREADS_USER_ID` is set.
7. `THREADS_TARGET_HANDLE` is set.
8. `THREADS_TARGET_HANDLE` matches `data/manual_threads_target.json`.
9. `data/post_history.json` has no previous `posted` entry with the same content hash for that handle.

If any condition fails, the system writes a safe stop status to:

- `output/reports/publishing.json`
- `data/post_log.json`
- `data/post_history.json`

## Meta Developer Setup Outline

1. Create or select a Meta Developer app.
2. Add Threads API access according to Meta's current documentation.
3. Connect the target Threads account.
4. Generate a valid Threads access token.
5. Confirm the target Threads user ID.
6. Register GitHub Secrets listed above.
7. Keep `AUTO_POST=false` for the first workflow run and inspect artifacts.
8. Only after review, decide separately whether to set `AUTO_POST=true` and `DRY_RUN=false`.

## Target Guard

Current manual target config:

- `data/manual_threads_target.json`

The guard blocks posting if `THREADS_TARGET_HANDLE` does not match that file.

## Duplicate Guard

Post history:

- `data/post_history.json`

The guard blocks live posting when the same content hash has already been posted to the same handle.

## Prohibited

- Do not test with dummy tokens.
- Do not use Chrome automation to post.
- Do not commit secret values.
- Do not set `AUTO_POST=true` until a separate approval step.
- Do not bypass the target guard.
