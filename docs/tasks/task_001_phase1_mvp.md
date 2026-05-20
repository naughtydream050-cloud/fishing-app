---
STATUS: ACTIVE
---
# task_001_phase1_mvp

## Objective
Phase 1 MVP: AI gear lowest-price engine + affiliate

## Scope
- Rakuten API integration (providers/rakuten/)
- Yahoo Shopping API integration (providers/yahoo/)
- Unified GearPrice type (API_CONTRACT.md)
- gear_prices DB cache (no ORM)
- Homepage lowest-price ranking
- Affiliate links

## Out of scope
- Auth, SNS, maps, weather
- Price history, favorites, alerts (Phase 2)

## Done Definition
See: /docs/DONE_DEFINITION.md

## Status
- [x] Scaffold complete
- [x] dataAccess.ts + mockData.ts
- [x] npm run mock mode
- [x] GearCard with price comparison UI
- [x] RegionSelector (中国地方/東京23区)
- [x] PaywallModal (3回目閲覧)
- [x] .env.local configured (SUPABASE_URL + ANON_KEY + USE_MOCK_DATA=false)
- [x] 001_gear.sql executed (Supabase project: blibvusvsemibwcmwkvo)
- [ ] Vercel deployed — 手動: `cd fishing-app && vercel deploy --prod`
