---
STATUS: STABLE
---
# DEPRECATION_RULES

> Strict deprecation management is mandatory.
> AI agents tend to duplicate components, create V2 files, and preserve dead abstractions.
> This file prevents repository entropy.

---

## Deprecation Header (Required)

Every deprecated file MUST include this header:

```typescript
/**
 * @deprecated
 * Use: {canonical path}
 *
 * Removal: {condition — e.g. "after all imports migrate"}
 * Cleanup stage: {Phase X or task name}
 */
```

---

## Shim Rules

Shim files are TEMPORARY compatibility layers only.

A shim MUST:
- re-export canonical implementation only
- contain zero business logic
- contain zero duplicated UI logic
- contain the deprecation header

A shim must NOT:
- become permanent
- grow with new logic
- be copy-pasted and evolved

---

## Currently Deprecated

| File | Canonical | Removal Condition | Stage |
|------|-----------|-------------------|-------|
| `components/PaywallModal.tsx` | `features/paywall/PaywallModal` | After all imports migrate | Phase 1 cleanup |
| `lib/rakuten.ts` | `providers/rakuten/index.ts` | After all imports migrate | Phase 1 cleanup |
| `lib/yahoo.ts` | `providers/yahoo/index.ts` | After all imports migrate | Phase 1 cleanup |

---

## Cleanup Task Rules

Create `DEPRECATION_CLEANUP_TASK` periodically:

1. List all @deprecated files
2. Check if any active import points to deprecated file
3. If no active imports: delete the file
4. If active imports exist: migrate imports → delete

Cleanup task runs:
- At phase boundaries (Phase 1 → 2, etc.)
- When deprecated list exceeds 5 files

---

## Adding a Deprecated File

1. Add deprecation header to the file
2. Add row to "Currently Deprecated" table above
3. Update `CHANGELOG_AI.md`

---

## Repository Error Conditions

- Deprecated shim grows with new logic → ERROR
- Deprecated file exists past its removal condition → ERROR
- New code imports from deprecated file (not migrated) → WARNING
- @deprecated header missing from shim → ERROR
