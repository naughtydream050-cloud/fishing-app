---
STATUS: STABLE
---
# 003_provider_isolation

## Decision
Provider-specific parsing stays isolated in providers/rakuten/ and providers/yahoo/.
Frontend never receives raw provider payloads.
API routes return only normalized GearPrice[].

## Reason
- Provider APIs change frequently
- Isolation reduces blast radius
- Unified type simplifies frontend

## Applies to
- providers/rakuten/index.ts
- providers/yahoo/index.ts
- app/api/gear/route.ts

## Revisit condition
If adding Amazon or other provider (create providers/amazon/).
