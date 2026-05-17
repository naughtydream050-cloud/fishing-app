---
STATUS: ACTIVE
---
# STATE_SNAPSHOT
> Rewrite on state change. Under 200 lines.

## Project
- Name: fishing-app
- Stage: Phase 1 — **本番稼働中** 🚀
- URL: https://fishing-app-omega.vercel.app
- Path: D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app

## Architecture
- UI entry: lib/dataAccess.ts only
- Providers: providers/rakuten/ + providers/yahoo/ (isolated)
- Cache: Supabase TTL 1h → provider fallback
- Mock: USE_MOCK_DATA=true → lib/mockData.ts (no DB, no API)
- Data flow: Providers → dataAccess.ts → API routes → UI

## Completed
- [x] Next.js 15 + TypeScript scaffold
- [x] docs/ × 18 files + decisions/ × 6
- [x] providers/ (rakuten + yahoo, isolated)
- [x] lib/dataAccess.ts + lib/mockData.ts (region support)
- [x] components/GearCard.tsx (price comparison + 最安値バッジ)
- [x] components/RegionSelector.tsx (全国/中国地方/東京23区)
- [x] components/PaywallModal.tsx (3回目閲覧 → 400円CTA)
- [x] app/page.tsx + app/GearList.tsx (Server+Client split)
- [x] app/globals.css (18px, high contrast, 44px touch)
- [x] supabase/migrations/001_gear.sql
- [x] npm run mock (USE_MOCK_DATA=true)
- [x] features/paywall/ (PAYWALL_CONFIG, getPaywallState, PaywallModal)
- [x] RegionId normalized (nationwide/chugoku/tokyo_23)
- [x] docs/decisions/006_ui_architecture.md
- [x] docs/CONTEXT_VALIDITY_RULES.md (autonomous mode activated)
- [x] package.json null bytes fixed
- [x] Supabase project "fishing-app" 作成 (id: blibvusvsemibwcmwkvo, ap-northeast-1)
- [x] 001_gear.sql apply_migration 完了
- [x] .env.local 書き込み完了 (SUPABASE_URL + ANON_KEY + USE_MOCK_DATA=false)
- [x] lib/supabase.ts: SERVICE_ROLE_KEY フォールバック修正
- [x] DEPLOY_MANUAL.md 作成（手順書 + Git連携ガイド）
- [x] **Vercel 本番デプロイ完了** (2026-05-15) → https://fishing-app-omega.vercel.app
  - GitHub: naughtydream050-cloud/fishing-app (main)
  - Next.js 15.3.4 (CVE-2025-66478 対応済み)

## Pending
- [ ] RAKUTEN_APP_ID / YAHOO_CLIENT_ID を Vercel 環境変数に追加（現在 Rakuten API 動作中だが APP_ID 未設定で一部限定）
- [ ] Supabase gear_prices テーブルへのデータ投入（現在 Rakuten API 直接呼び出し）
- [ ] カスタムドメイン設定（任意）

## Supabase Status
- Project: fishing-app (id: blibvusvsemibwcmwkvo, ap-northeast-1, ACTIVE_HEALTHY)
- URL: https://blibvusvsemibwcmwkvo.supabase.co
- 001_gear.sql: ✅ 適用済み (gear_prices テーブル + インデックス)
- SERVICE_ROLE_KEY: 未設定 → anon key フォールバック中（RLS無効前提）

## Constraints
- Phase 1 only (no auth, SNS, maps, weather)
- Paywall: sessionStorage viewCount (server-side in Phase 2)
- No architecture redesign without approval

## Env Vars
- NEXT_PUBLIC_SUPABASE_URL=https://blibvusvsemibwcmwkvo.supabase.co ✅
- NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG... ✅
- SUPABASE_SERVICE_ROLE_KEY=未設定（フォールバック済）
- RAKUTEN_APP_ID=未設定（Phase1 API 連携時に必要）
- YAHOO_CLIENT_ID=未設定（Phase1 API 連携時に必要）
- USE_MOCK_DATA=false ✅

## Doc Read Priority
1. CURRENT_TASK.md → tasks/task_001_phase1_mvp.md
2. STATE_SNAPSHOT.md
3. ARCHITECTURE.md / API_CONTRACT.md

## Execution Mode
- AUTONOMOUS REPOSITORY EXECUTION MODE: ACTIVE
- User interrupt threshold: destructive/irreversible/security only
- Task continuation: autonomous
