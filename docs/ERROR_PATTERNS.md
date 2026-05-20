---
STATUS: ACTIVE
---
# ERROR_PATTERNS

Tracks repeated implementation mistakes. Add new entries when patterns recur.

## Patterns

### EP-001: Raw provider payload leaked to frontend
- Symptom: Frontend code imports Rakuten/Yahoo-specific types
- Fix: Normalize in providers/*/index.ts, return GearPrice[] only
- Prevention: decisions/003_provider_isolation.md

### EP-002: Missing normalization layer
- Symptom: API route returns provider-specific fields
- Fix: Map all fields to GearPrice before returning
- Prevention: API_CONTRACT.md

### EP-003: Undocumented schema change
- Symptom: DB column exists but not in DB_SCHEMA.md
- Fix: Update DB_SCHEMA.md + add migration file
- Prevention: DOC_SYNC_RULES.md

### EP-004: Repeated API calls without cache
- Symptom: Rakuten/Yahoo hit on every request
- Fix: Add revalidate: 3600 or in-memory cache
- Prevention: SCRAPING_RULES.md

### EP-005: Outdated STATE_SNAPSHOT
- Symptom: STATE_SNAPSHOT describes completed items as pending
- Fix: Rewrite STATE_SNAPSHOT after each task completion
- Prevention: DONE_DEFINITION.md

### EP-006: UI directly imports provider
- Symptom: `import { searchRakutenGear } from '@/providers/rakuten'` in page/component
- Fix: Route through dataAccess.ts
- Prevention: decisions/005_data_access_boundary.md

### EP-007: Cache logic in UI component
- Symptom: useState/useEffect for caching in component
- Fix: Move cache to dataAccess.ts or provider layer
- Prevention: decisions/005_data_access_boundary.md

### EP-008: Cross-feature internal import
- Symptom: Feature A imports internal module from Feature B (not via public API)
- Fix: Only import from the feature's index.ts public API
- Prevention: FEATURE_CONTRACTS.md

### EP-009: Deprecated shim grows with logic
- Symptom: @deprecated file contains new business logic or duplicated UI
- Fix: Delete logic, keep shim as re-export only; or delete shim if no imports
- Prevention: DEPRECATION_RULES.md

### EP-010: Destructive migration without compatibility period
- Symptom: Column deleted / function renamed without shim or deprecation period
- Fix: Restore compatibility layer, migrate consumers, then clean up
- Prevention: MIGRATION_RULES.md
