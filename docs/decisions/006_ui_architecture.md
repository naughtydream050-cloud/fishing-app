---
STATUS: STABLE
---
# 006_ui_architecture

## Component Responsibility
- Keep components shallow: GearCard, RegionSelector, PaywallModal
- No mega components, no deeply nested trees
- Business logic stays out of UI

## Server/Client Boundary
Server Components: data fetching, normalization, cache, initial render
Client Components: interactions only (tabs, modal state, local UI state)

Client Components must NOT:
- fetch providers directly
- contain pricing logic
- contain normalization logic

## Feature Isolation
Feature logic lives in /features/:
- /features/paywall — paywall config, state, modal
- /features/alerts — (Phase 2)
- /features/priceHistory — (Phase 2)

## Region IDs
Use normalized IDs only (never UI labels internally):
type RegionId = "nationwide" | "chugoku" | "tokyo_23"

## Style Rules
- 18px+ text minimum
- 44px+ tap targets
- High contrast
- Mobile-first (users age 40+, thumb navigation)
- No dark patterns, no dense dashboards

## Product Goal
"simple high-conversion affiliate UX"
NOT: advanced SaaS / social app / pro terminal
