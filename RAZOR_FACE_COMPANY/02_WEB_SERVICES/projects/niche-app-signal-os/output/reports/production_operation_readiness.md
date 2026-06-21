# Production Operation Readiness - 2026-06-21

- repository: naughtydream050-cloud/fishing-app
- target_account: 有能サイト紹介 / younengsaitoshaojie
- workflow: .github/workflows/niche-app-signal-os-auto-post.yml
- schedule: 毎日09:10 JST
- selected_candidate_id: live-trip-packing-check
- market_evidence_count: 3
- selected_image_path: output/share-cards/2026-06-20-live-trip-packing-check.png
- post_source_audit.posting_allowed: true

## Local Blockers
- gh CLI is not installed, so workflow_dispatch cannot be started from this machine.
- local python points to WindowsApps python.exe and does not run scripts locally.
- current branch is codex/fix-dispatch-workflow and is not current with origin/main; fetched origin/main but did not merge over a dirty worktree.

## GitHub UI Dry-run
- Open GitHub repo naughtydream050-cloud/fishing-app.
- Go to Actions > Niche App Signal OS Auto Post.
- Run workflow on the branch containing these changes.
- Set live_post=false.
- Confirm artifacts include selected_post_candidate.json, post_source_audit.json, and a candidate-specific PNG.

## GitHub UI Live Test
- Run only after dry-run succeeds.
- Confirm repository secrets are set: THREADS_ACCESS_TOKEN, THREADS_USER_ID, THREADS_AUTO_POST_ENABLED=true.
- Confirm workflow env THREADS_TARGET_HANDLE is younengsaitoshaojie.
- Run workflow with live_post=true once.
- Confirm output/reports/live_post_result.md, data/post_history.json, and data/reaction_memory.json are updated.
