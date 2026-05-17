---
STATUS: STABLE
---
# 005_data_access_boundary

## Decision
lib/dataAccess.ts is the ONLY UI-facing boundary for data.

## Data Flow
Providers → Normalization → dataAccess.ts → API routes → Frontend/UI

## Rules
- Frontend/UI must ONLY call: getTrendingGears(), getGearById(), future normalized methods
- Frontend must NEVER: call providers directly, parse provider payloads, access Supabase directly
- Caching belongs ONLY in provider layer or dataAccess layer (never in UI components)
- Provider-specific logic must NEVER leak into UI

## Mock Mode
- USE_MOCK_DATA=true bypasses ALL: external APIs, DB, Supabase
- mockData.ts uses normalized GearPrice only — no provider-specific fields
- Mock works with zero external dependencies

## Repository Error Conditions
- UI component imports from providers/ directly → ERROR
- UI component imports supabase directly → ERROR
- Provider-specific type in UI → ERROR
- Cache logic in UI component → ERROR

## Revisit condition
If dataAccess.ts grows >300 lines, consider splitting by domain (gear, user, etc.)
