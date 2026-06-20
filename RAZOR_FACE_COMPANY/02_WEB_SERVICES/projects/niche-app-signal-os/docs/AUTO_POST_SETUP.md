# AUTO_POST Setup

AUTO_POST is disabled by default.

Required safe defaults:

- `DRY_RUN=true`
- `AUTO_POST=false`
- `THREADS_AUTO_POST_ENABLED=false`

Required GitHub Secrets / runtime names:

- `THREADS_ACCESS_TOKEN`
- `THREADS_USER_ID`
- `THREADS_TARGET_HANDLE`
- `THREADS_AUTO_POST_ENABLED`

Optional runtime names:

- `THREADS_IMAGE_URL`: public image URL accepted by Threads API. Do not use local files directly.
- `THREADS_GRAPH_BASE_URL`: default `https://graph.threads.net/v1.0`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`

Live posting is blocked unless all of these pass:

1. risk gate approved
2. `AUTO_POST=true`
3. `DRY_RUN=false`
4. `THREADS_AUTO_POST_ENABLED=true`
5. all required Threads secrets exist
6. `THREADS_TARGET_HANDLE` matches `data/manual_threads_target.json`
7. duplicate guard passes `data/post_history.json`

Never commit secret values to Markdown, logs, screenshots, or source files.

See `docs/THREADS_API_SETUP.md` before enabling any live posting.
