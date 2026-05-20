---
STATUS: STABLE
---
# 001_no_orm

## Decision
Do not use ORM. Use Supabase SQL + lightweight queries directly.

## Reason
- Reduces abstraction overhead
- Simpler AI-readable queries
- Supabase client is sufficient for Phase 1-2

## Applies to
- All DB operations in lib/gear.ts
- Future table additions

## Revisit condition
If query complexity exceeds 5+ joins per feature.
