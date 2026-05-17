---
STATUS: STABLE
---
# 002_single_repo

## Decision
Single Next.js repository. No separate backend repo.

## Reason
- Reduces operational complexity
- AI-maintainability: one context, one codebase
- Vercel monorepo support

## Applies to
- All phases

## Revisit condition
If API layer requires separate scaling (Phase 5+).
