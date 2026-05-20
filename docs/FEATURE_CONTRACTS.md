---
STATUS: ACTIVE
---
# FEATURE_CONTRACTS

> Features communicate ONLY through exported functions, normalized types, and explicit interfaces.
> Breaking feature boundaries = repository error.

---

## Core Rule

Features must expose a stable public API.
Internal logic, state, and storage details are private.
Cross-feature imports of internals are forbidden.

---

## Active Features

### features/paywall

**Public API:**
```typescript
getPaywallState(): PaywallState
incrementViewCount(): PaywallState
PAYWALL_CONFIG: { freeViewLimit, monthlyPrice, stripeCheckoutUrl }
```

**UI contract:**
- UI calls `getPaywallState()` to check block status
- UI calls `incrementViewCount()` on each view action
- UI renders `PaywallModal` from `features/paywall/PaywallModal`
- UI must NOT know: storage key, pricing calc, Stripe internals

**Owns:**
- sessionStorage key `viewCount`
- `PAYWALL_CONFIG` constants
- `PaywallModal.tsx` component

**Must NOT:**
- Be imported outside of `features/paywall/` except through its public API
- Contain data fetching or provider logic

---

### features/alerts (Phase 2 — not yet implemented)

**Planned public API:**
```typescript
subscribeAlert(gearId: string, targetPrice: number): Promise<void>
unsubscribeAlert(gearId: string): Promise<void>
getAlerts(): Promise<Alert[]>
```

**Owns:** alert DB records, notification dispatch logic

---

### features/priceHistory (Phase 2 — not yet implemented)

**Planned public API:**
```typescript
getPriceHistory(gearId: string): Promise<PricePoint[]>
```

**Owns:** price_history table queries, chart data shaping

---

### features/aiSelection (Phase 2 — not yet implemented)

**Planned public API:**
```typescript
getAISelectedGear(): Promise<GearPrice[]>
```

**Owns:** AI model calls, scoring logic, selection criteria

---

## Cross-Feature Rules

| Rule | Status |
|------|--------|
| Features import ONLY from their own directory or shared lib/ | ENFORCED |
| UI imports features via public API only | ENFORCED |
| No hidden shared state between features | ENFORCED |
| Feature internals not exposed globally | ENFORCED |
| Normalized types (GearPrice, RegionId) shared via lib/ | ALLOWED |

---

## Shared Types (lib/)

Shared normalized types live in `lib/` — NOT inside any feature:

| Type | Location |
|------|----------|
| `GearPrice` | `lib/dataAccess.ts` |
| `RegionId` | `components/RegionSelector.tsx` → migrate to `lib/types.ts` (TODO) |
| `PaywallState` | `features/paywall/index.ts` (paywall-owned, not shared) |

---

## Violation Examples (repository errors)

```typescript
// ❌ UI directly reading sessionStorage (paywall's domain)
const count = sessionStorage.getItem('viewCount')

// ❌ Cross-feature import of internals
import { SESSION_KEY } from '@/features/paywall/storage'

// ❌ Paywall logic inline in GearList
if (viewCount > 2) { ... }

// ✅ Correct usage
import { getPaywallState, incrementViewCount } from '@/features/paywall'
const state = getPaywallState()
```

---

## Adding a New Feature

1. Create `/features/{name}/index.ts` with public API only
2. Add contract entry to this file
3. Update `docs/decisions/` if architectural decision needed
4. Update `CHANGELOG_AI.md`
5. Never expose internals outside the feature directory
