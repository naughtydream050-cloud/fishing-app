# Current Task

## Goal

Create the first MVP of Niche App Signal OS as an internal, dry-run-first Threads signal system.

## Scope

- New project only: `02_WEB_SERVICES/projects/niche-app-signal-os`
- Python scripts, JSON artifacts, Markdown memory, and GitHub Actions
- Initial mode: `DRY_RUN=true`, `AUTO_POST=false`
- No live Threads posting until user review

## Not In Scope

- Existing projects
- Production apps
- Secrets or token values
- Payment, Auth, RLS, database migrations
- Unofficial scraping
- Copying third-party posts or images

## Validation

- `python scripts/run_daily_pipeline.py --dry-run`
- `python scripts/run_dry_run_batch.py --days 7`
- `python scripts/generate_card_image.py --sample`
- `python scripts/quality_risk_gate.py --sample`

## Result Format

Use the requested Result Card: Changed, Verified, Decision, Risk, Next.
