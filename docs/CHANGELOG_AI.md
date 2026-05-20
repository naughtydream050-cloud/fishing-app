## 2026-05-15 (Vercel 本番デプロイ完了 🚀)

### Done
- **本番 URL 確認済み**: https://fishing-app-omega.vercel.app（Rakuten API 連携、実データ表示）
- GitHub → Vercel 自動デプロイ設定済み (naughtydream050-cloud/fishing-app, main ブランチ)
- FUSE マウント経由の git push により複数ファイルが切り詰め/破損 → 全て手動修復
  - dataAccess.ts, mockData.ts, supabase.ts, rakuten.ts, yahoo.ts, PaywallModal.tsx, globals.css, page.tsx
- Next.js 15.0.0 → 15.3.4 にアップグレード（CVE-2025-66478 対応）
- 環境変数設定: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, USE_MOCK_DATA=false

### Root Cause (記録)
- VirtioFS/FUSE マウント経由のファイルコピーが最大 ~50行で切り詰め
- 対策: bash heredoc で直接 /tmp/fishing-git/ に書き込み → git push

---

## 2026-05-15 (Vercel Deploy Manual 作成)

### Done
- DEPLOY_MANUAL.md 作成（`npm install` → `vercel deploy --prod` の手順 + Git連携ガイド）
- STATE_SNAPSHOT.md 更新（Stage / Completed / Pending 反映）

### Blocker (記録)
- サンドボックスの DNS が外部ブロック（EAI_AGAIN）のため、CLI デプロイは sandbox 内から実行不可
- Vercel MCP の `deploy_to_vercel` は `vercel deploy` の実行を要求するだけで自動実行不可
- Windows ファイルシステム（AppData）はマウントされていないため token 読み取り不可

### Next
- ユーザーが DEPLOY_MANUAL.md の手順をローカル PowerShell で実行

---

## 2026-05-15 (Phase 1 Supabase 完了 + Vercel 準備)

### Done (Supabase MCP)
- Supabase project "fishing-app" 新規作成 (id: blibvusvsemibwcmwkvo, ap-northeast-1, free tier)
- 001_gear.sql apply_migration 完了 (gear_prices テーブル + 2インデックス)
- NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY → .env.local 書き込み

### Fixed
- lib/supabase.ts — SUPABASE_SERVICE_ROLE_KEY 未設定時に anon key フォールバック

### Blocked
- Vercel deploy — sandbox の DNS 制限 + auth.json アクセス不可により自動化断念
  → 手動: プロジェクトルートで `vercel deploy --prod` を実行してください

### Updated
- STATE_SNAPSHOT.md — Supabase 完了、Pending → Vercel のみ
- task_001_phase1_mvp.md — .env.local / 001_gear.sql チェック済み

---

## 2026-05-15 (Phase 1 Infra Check + Autonomous Mode)

### Added
- docs/CONTEXT_VALIDITY_RULES.md — stale context prevention, doc validity checks, autonomous execution mode
- DOCUMENT_INDEX.md — CONTEXT_VALIDITY_RULES entry (P3)

### Fixed
- package.json — null bytes stripped (581→574 bytes)

### Checked (Supabase MCP)
- list_projects: sharyo-ocr のみ確認、fishing-app プロジェクト未作成
- 001_gear.sql: 適用待ち（プロジェクト作成後に apply_migration で即実行可能）

### Checked (npm)
- package.json 修正済み、node_modules 未生成
- ローカルで `npm install` 実行必要

### State
- STATE_SNAPSHOT.md: pending 更新、Supabase status 追記、Execution Mode 追記
- AUTONOMOUS REPOSITORY EXECUTION MODE: ACTIVE

---

## 2026-05-15 (Context Validity + Autonomous Mode)

### Added
- docs/CONTEXT_VALIDITY_RULES.md — stale context prevention, doc validity checks
- Autonomous Repository Execution Mode activated

### Constraints
- AI must verify doc STATUS before relying on content
- STATE_SNAPSHOT: rewrite on change, never accumulate
- CURRENT_TASK: one active task only, invalid after completion
- User interruption: only for destructive/irreversible/security actions
- Task continuation: autonomous after each completion

---

## 2026-05-14 (Context Budget Rules)

### Added
- docs/CONTEXT_BUDGET_RULES.md — read strategy, task routing, token budget
- DOCUMENT_INDEX.md — CONTEXT_BUDGET_RULES entry added
- TOKEN_RULES.md — reference to CONTEXT_BUDGET_RULES added

### Constraints
- Never read all docs automatically
- P1 always, P2 task-relevant only, P3 only if required
- Session token budget: ~8000 total

---

## 2026-05-14 (Document Index)

### Added
- docs/DOCUMENT_INDEX.md — canonical docs router (P1/P2/P3/ARCHIVE priority system)

### Constraints
- DOCUMENT_INDEX.md is the authoritative map of all docs
- AI agents: load DOCUMENT_INDEX.md to determine which docs are relevant
- Each doc has: purpose, priority, owner, update trigger, archive condition

---

## 2026-05-14 (Migration Rules)

### Added
- docs/MIGRATION_RULES.md — incremental/reversible/documented change policy
- ERROR_PATTERNS.md — EP-010

### Constraints
- DB: additive only, no silent renames/deletes
- Feature: canonical → shim → deprecation period → cleanup
- API: breaking changes require migration note + compat strategy
- AI agents: no full rewrites, no silent renames, no early shim removal

---

## 2026-05-14 (Deprecation Rules)

### Added
- docs/DEPRECATION_RULES.md
- ERROR_PATTERNS.md — EP-009

### Changed
- components/PaywallModal.tsx — correct deprecation header added
- lib/rakuten.ts — deprecation header added
- lib/yahoo.ts — deprecation header added

### Constraints
- Shims: re-export only, zero logic, deprecation header required
- Deprecated table in DEPRECATION_RULES.md must stay current
- Cleanup at phase boundaries or when >5 deprecated files

---

## 2026-05-14 (Feature Contracts)

### Added
- docs/FEATURE_CONTRACTS.md — feature boundary definitions + public APIs
- ERROR_PATTERNS.md — EP-008 (cross-feature internal import)

### Constraints
- Features communicate via exported functions + normalized types only
- No cross-feature internal imports
- Feature internals are private

### Next
- Validate mock mode in browser

---

## 2026-05-14 (UI Architecture)

### Added
- features/paywall/index.ts — PAYWALL_CONFIG, getPaywallState, incrementViewCount
- features/paywall/PaywallModal.tsx — canonical paywall modal
- docs/decisions/006_ui_architecture.md

### Changed
- RegionId: 'all'/'tokyo' → 'nationwide'/'tokyo_23' (normalized IDs)
- app/GearList.tsx — uses features/paywall (no inline paywall logic)
- components/PaywallModal.tsx → deprecated shim → features/paywall/PaywallModal
- lib/mockData.ts, dataAccess.ts, RegionSelector.tsx — RegionId updated

### Constraints
- Paywall logic: features/paywall/ only (never inline in UI)
- RegionId: normalized strings only, never UI labels in code
- Client Components: interaction only, no business logic

### Next
- npm run mock → test RegionSelector + PaywallModal

---

## 2026-05-14 (MVP UI)

### Added
- app/GearList.tsx — client component (region state + paywall logic)
- components/GearCard.tsx — price comparison chip + 最安値バッジ + affiliate CTA
- components/RegionSelector.tsx — 全国/中国地方/東京23区 タブ
- components/PaywallModal.tsx — 3回目閲覧で表示 (400円/月 Stripe CTA placeholder)
- lib/mockData.ts — エリア別モックデータ (chugoku, tokyo)

### Changed
- lib/dataAccess.ts — GearPrice型拡張 (manufacturer, competitorPrice), region param
- app/page.tsx — Server Component + GearList分離
- app/globals.css — 18px base, 高コントラスト, min-height 44px

### Constraints
- viewCount: sessionStorage (Phase 1暫定。Phase 2でサーバー管理予定)
- Paywall: placeholder only (Stripe未接続)
- GearList: USE_MOCK_DATA=true 時はDB/API完全バイパス

### Next
- npm install → npm run mock → ブラウザ確認
- .env.local設定 → npm run dev → 実API確認

---

## 2026-05-14 (DataAccess boundary enforcement)

### Changed
- lib/dataAccess.ts — env var: NEXT_PUBLIC_USE_MOCK → USE_MOCK_DATA
- package.json — mock script updated
- .env.local.example — updated

### Added
- docs/decisions/005_data_access_boundary.md
- ARCHITECTURE.md — strict data flow diagram + cache ownership
- ERROR_PATTERNS.md — EP-006, EP-007

### Constraints
- USE_MOCK_DATA=true bypasses ALL external deps (API + DB)
- UI forbidden from: providers/, supabase, provider-specific types, cache logic
- Data flow: Providers → dataAccess.ts → API routes → UI (strict)

### Next
- npm install → npm run mock → validate zero-dependency UI

---

## 2026-05-14 (Razor Face Standard)

### Added
- lib/dataAccess.ts — getTrendingGears, getGearById (unified public API)
- lib/mockData.ts — MOCK_GEAR (4 items)
- Mock mode: NEXT_PUBLIC_USE_MOCK=true / npm run mock

### Changed
- app/api/gear/route.ts — dataAccess経由
- app/page.tsx — dataAccess経由
- package.json — mock script (cross-env)

### Constraints
- UI → dataAccess.ts のみ。provider直接import禁止
- 1プロバイダー障害時も他を返す (Promise.allSettled + 5s timeout)
- Supabase TTL 1h キャッシュ優先

### Next
- .env.local設定 → npm install → npm run mock で確認


---
STATUS: ACTIVE
---
# CHANGELOG_AI
> append-only | newest first | AI-readable only | no essays

## 2026-05-14 (docs restructure)

### Added
- docs/tasks/ + task_001_phase1_mvp.md
- docs/decisions/ + 001〜004
- docs/archive/
- docs/NEXT_TASKS.md
- docs/MOCK_DATA.md
- docs/DOC_SYNC_RULES.md
- docs/ERROR_PATTERNS.md
- docs/DONE_DEFINITION.md
- providers/rakuten/index.ts
- providers/yahoo/index.ts

### Changed
- CURRENT_TASK.md — simplified to task pointer only
- All docs — STATUS tags added
- ARCHITECTURE.md — provider path updated to providers/
- lib/rakuten.ts — @deprecated re-export added
- lib/yahoo.ts — @deprecated re-export added

### Constraints
- Provider logic: providers/ only (decisions/003)
- No full crawl (decisions/004)
- Doc sync required on all changes (DOC_SYNC_RULES.md)

### Next
- Configure .env.local
- Run 001_gear.sql
- npm install → validate affiliate loop

---

## 2026-05-14

### Added
- Project scaffold: fishing-app (Phase 1 MVP)
- docs/CURRENT_TASK.md, PROJECT_STATE.md, ARCHITECTURE.md, AI_HANDOFF.md, TOKEN_RULES.md
- docs/API_CONTRACT.md — unified GearPrice type, endpoint spec
- docs/SCRAPING_RULES.md — fetch policy, rate limits, curated keywords
- docs/DB_SCHEMA.md — gear_prices table schema
- lib/rakuten.ts — Rakuten Ich