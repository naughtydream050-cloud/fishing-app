---
STATUS: STABLE
---
# SCRAPING_RULES

## Fetch Policy
- NEVER fetch all products
- Only fetch:
  - trending products (predefined keyword list)
  - manually curated products
  - AI-selected products (Phase 2+)

## Rate Limiting
- Rakuten API: max 1 req/sec, 10 req/session
- Yahoo API: max 1 req/sec, 10 req/session
- Always use revalidate: 3600 (1 hour cache)

## Caching Rules
- In-memory cache is acceptable for Phase 1
- Cache key: keyword + platform
- Cache TTL: 3600 seconds minimum
- DO NOT repeatedly hit Rakuten or Yahoo APIs

## Keyword Strategy
Phase 1 curated keywords:
- 釣り竿
- リール
- 釣り糸
- ルアー
- 仕掛け
- クーラーボックス
- 釣りバッグ
- ウェーダー

## Prohibited
- Scraping retailer HTML directly
- Bypassing API rate limits
- Storing raw API responses in DB
