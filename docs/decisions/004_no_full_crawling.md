---
STATUS: STABLE
---
# 004_no_full_crawling

## Decision
Never fetch all products. Only fetch curated/trending/AI-selected gear.

## Reason
- Rate limit safety
- Cost control
- Relevance quality

## Applies to
- providers/rakuten/index.ts
- providers/yahoo/index.ts
- All future provider additions

## See
SCRAPING_RULES.md for keyword list and rate limits.
