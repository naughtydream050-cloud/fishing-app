# Threads Auto Post Pipeline Report

Date: 2026-06-20

Status: guard structure implemented. No live posting performed.

## Implemented

- AUTO_POST gate
- DRY_RUN gate
- `THREADS_AUTO_POST_ENABLED` gate
- target account guard
- duplicate guard
- post history
- API missing-secrets safe stop
- GitHub Secrets names documentation
- Threads API setup documentation

## Files

- `scripts/post_to_threads.py`
- `data/post_history.json`
- `data/manual_threads_target.json`
- `.env.example`
- `.github/workflows/daily_threads_signal_post.yml`
- `docs/THREADS_API_SETUP.md`

## Required Secrets / Environment Names

- `THREADS_ACCESS_TOKEN`
- `THREADS_USER_ID`
- `THREADS_TARGET_HANDLE`
- `THREADS_AUTO_POST_ENABLED`

## Safety Defaults

- `DRY_RUN=true`
- `AUTO_POST=false`
- `THREADS_AUTO_POST_ENABLED=false`
- Threads API call: not attempted
- Chrome posting: not used

## Live Posting Preconditions

The code can only enter the Threads API posting function when:

1. risk gate approved
2. `AUTO_POST=true`
3. `DRY_RUN=false`
4. `THREADS_AUTO_POST_ENABLED=true`
5. all required Threads secrets are present
6. target handle matches `data/manual_threads_target.json`
7. duplicate guard passes

## Current Result

No token is configured. The intended current behavior is safe stop / dry-run logging only.
