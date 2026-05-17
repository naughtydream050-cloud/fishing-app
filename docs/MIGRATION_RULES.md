---
STATUS: STABLE
---
# MIGRATION_RULES

> AI agents tend to rewrite working systems, collapse boundaries, and remove compatibility layers too early.
> Strict migration discipline is mandatory.

---

## Core Rules

All structural changes must be:
- **Incremental** — one step at a time, not full rewrites
- **Reversible** — shim strategy until old system is verified removed
- **Documented** — changelog entry + migration note before making change

Avoid:
- Destructive rewrites
- Silent contract changes
- Broad renames across multiple files at once
- Multi-system rewrites in a single batch

---

## DB Migration Rules

### Additive only (prefer)
```sql
-- ✅ Safe: add column with default
ALTER TABLE gear_prices ADD COLUMN search_keyword text DEFAULT '';

-- ❌ Dangerous: rename column (breaks existing queries silently)
ALTER TABLE gear_prices RENAME COLUMN gear_name TO title;
```

Rules:
- Never delete production columns directly
- Never rename fields without a compatibility period
- Never break normalized types (GearPrice must remain stable)
- Prefer additive migrations → compatibility period → cleanup migration

### Migration file naming
```
supabase/migrations/
  001_gear.sql          ← initial schema
  002_add_keyword.sql   ← additive
  003_cleanup_v1.sql    ← cleanup after compatibility period
```

---

## Feature Migration Rules

Moving a feature to a new location requires:

1. **Create canonical target** (`features/paywall/index.ts`)
2. **Create shim** (deprecated re-export at old path)
3. **Deprecation period** (keep shim until all imports migrate)
4. **Cleanup task** (find all imports → migrate → delete shim)

Example (already done):
```
Old: components/PaywallModal.tsx (business logic)
New: features/paywall/PaywallModal.tsx (canonical)
Shim: components/PaywallModal.tsx (re-export only, @deprecated)
```

---

## API Contract Migration Rules

API contracts (`lib/dataAccess.ts` public API) are stable interfaces.

Breaking changes require:
- Entry in `docs/API_CONTRACT.md` with migration note
- Compatibility strategy (old signature kept or overloaded)
- `CHANGELOG_AI.md` entry with `### Breaking` section

Non-breaking additions are safe:
- Adding optional parameters with defaults ✅
- Adding new exported functions ✅
- Extending types with optional fields ✅

Breaking changes (require explicit migration):
- Removing exported functions ❌
- Renaming exported functions ❌
- Changing required parameter types ❌
- Narrowing return types ❌

---

## Code/Type Migration Rules

When renaming or moving types:
1. Export the new type at canonical location
2. Re-export from old location with `@deprecated`
3. Migrate all usages in a single batch
4. Remove old export

Example (already done: Region → RegionId):
```typescript
// Old: type Region = 'all' | 'chugoku' | 'tokyo'
// New: type RegionId = 'nationwide' | 'chugoku' | 'tokyo_23'
// Migrated in single batch ✅
```

---

## Provider Migration Rules

When adding/replacing a data provider:

1. Implement new provider in `providers/{name}/index.ts`
2. Add to `lib/dataAccess.ts` with `Promise.allSettled` (graceful)
3. Old provider remains until validated removable
4. Update `ARCHITECTURE.md` + `docs/decisions/`

---

## Migration Checklist (per change)

- [ ] Change is incremental (not a full rewrite)
- [ ] Shim exists if moving canonical location
- [ ] `CHANGELOG_AI.md` entry added
- [ ] Affected docs updated (API_CONTRACT, ARCHITECTURE, DB_SCHEMA)
- [ ] Cleanup task created if shim introduced
- [ ] `STATE_SNAPSHOT.md` updated

---

## AI Agent Prohibited Patterns

| Pattern | Why Prohibited |
|---------|----------------|
| Rewrite entire file "for consistency" | Destroys working code |
| Rename across 10+ files silently | Silent contract break |
| Delete shim before import audit | Breaks consumers |
| Add new field to GearPrice and remove old | Type breaking change |
| Change API route response shape | Breaks frontend |
| Drop DB column in same migration as add | No compatibility period |
