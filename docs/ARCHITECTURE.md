---
STATUS: STABLE
---
# ARCHITECTURE

## Core Loop
Trending fish/activity
→ AI detects useful gear
→ Price comparison (Rakuten + Yahoo)
→ Cheapest shop surfaced
→ Affiliate conversion

## Directory Structure
fishing-app/
├── app/
│   ├── page.tsx          # Homepage gear ranking
│   ├── api/
│   │   ├── gear/route.ts        # Gear search endpoint
│   │   └── prices/route.ts      # Price comparison endpoint
│   └── layout.tsx
├── providers/
│   ├── rakuten/index.ts  # Rakuten Ichiba API client (canonical)
│   └── yahoo/index.ts    # Yahoo Shopping API client (canonical)
├── lib/
│   ├── rakuten.ts        # @deprecated — re-exports providers/rakuten
│   ├── yahoo.ts          # @deprecated — re-exports providers/yahoo
│   ├── gear.ts           # Gear DB operations
│   └── supabase.ts       # Supabase client
├── supabase/
│   └── migrations/
│       └── 001_gear.sql  # Gear + prices schema
└── docs/                 # SSOT markdown
    ├── archive/
    ├── decisions/        # ADR files 001〜
    └── tasks/            # task_XXX files

## Rules
- No microservices
- No separate backend repo
- Single repo
- Simple components
- No heavy state management

## Provider Isolation Rules
- providers/rakuten/index.ts: Rakuten-specific parsing ONLY (canonical)
- providers/yahoo/index.ts: Yahoo-specific parsing ONLY (canonical)
- lib/rakuten.ts + lib/yahoo.ts: @deprecated shims for import compat only
- gear.ts: Unified GearPrice type + DB ops
- No provider logic in UI components or page.tsx
- See: decisions/003_provider_isolation.md

## Caching Strategy (Phase 1)
- next: { revalidate: 3600 } on all external API calls
- Supabase as persistent cache layer
- In-memory cache acceptable as secondary layer

## What NOT to build in Phase 1
- Auth
- Social feed
- Notifications
- Advanced filtering
- Maps
- Community features

## Data Flow (Strict)
```
Providers (providers/rakuten/, providers/yahoo/)
↓ provider-specific types (internal only)
Normalization (dataAccess.ts)
↓ GearPrice[] (public type)
API Routes (app/api/)
↓ JSON GearPrice[]
Frontend/UI (app/page.tsx, components/)
```

## Cache Ownership
- Allowed: providers/, lib/dataAccess.ts
- Forbidden: UI components, page.tsx

## Mock Mode
- USE_MOCK_DATA=true → lib/mockData.ts (no DB, no external API)
- Env server-side only (not NEXT_PUBLIC_*)
