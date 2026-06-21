console.error(
  [
    "generate_oshi_share_card.js is deprecated.",
    "Use the market-input pipeline instead:",
    "  python scripts/run_daily_pipeline.py --dry-run",
    "The pipeline must select a market-backed candidate and generate output/share-cards/YYYY-MM-DD-<candidate_id>.png.",
  ].join("\n")
);
process.exit(1);
