---
STATUS: STABLE
---
# AI_HANDOFF

## Context
New project. Phase 1 implementation started.

## SSOT
All architecture decisions in /docs/*.md.
Code must match docs. Docs override code if conflict.

## Prohibited
- Architecture redesign without explicit approval
- Adding new external services without updating ARCHITECTURE.md
- Destructive DB migrations
- Auth/payment rewrites

## Approval required for
- Dependency changes (major)
- New API integrations
- DB schema changes
