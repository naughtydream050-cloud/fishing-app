---
STATUS: ACTIVE
---
# DOCUMENT_INDEX

> Single authoritative map of all repository documentation.
> AI agents: read this file to determine which docs to load for a given task.
> Prevents duplicated responsibilities, overlapping docs, and AI context confusion.

---

## Priority System
- **P1** — Always read (every session)
- **P2** — Read if relevant to task
- **P3** — Reference only (look up when needed)
- **ARCHIVE** — Historical only, do not load unless explicitly requested

---

## P1 — Always Read

### CURRENT_TASK.md
- Purpose: Active implementation target pointer
- Owner: Repository
- Update when: Task changes
- Archive: Never
- Points to: `/docs/tasks/task_XXX.md`

### STATE_SNAPSHOT.md
- Purpose: Ultra-compact current repo state (fastest context recovery)
- Owner: Repository
- Update when: Any task completes, phase changes, completed items change
- Archive: Never (rewrite in place)

---

## P2 — Read If Relevant

### ARCHITECTURE.md
- Purpose: System architecture, data flow, component boundaries
- Owner: Architecture decisions
- Update when: Data flow changes, new provider added, layer boundary changes
- Archive: Never (extend in place)
- Relevant for: Any structural change, new feature, provider work

### API_CONTRACT.md
- Purpose: Unified GearPrice type, endpoint specs, frontend access rules
- Owner: Data layer
- Update when: GearPrice type changes, endpoint added/modified
- Archive: Never
- Relevant for: dataAccess.ts changes, new API routes, type changes

### DB_SCHEMA.md
- Purpose: Table definitions, column specs, index rules, query guidelines
- Owner: Data layer
- Update when: Migration added, schema changes
- Archive: Never
- Relevant for: Any DB migration, new table, schema change

### FEATURE_CONTRACTS.md
- Purpose: Feature boundary definitions and public API contracts
- Owner: Feature layer
- Update when: New feature added, public API changes
- Archive: Never
- Relevant for: Any features/ work, cross-feature integration

### SCRAPING_RULES.md
- Purpose: Fetch policy, rate limits, keyword strategy, cache TTL
- Owner: Provider layer
- Update when: Keyword list changes, rate limit discovered, TTL changes
- Archive: Never
- Relevant for: Provider work, API integration, caching work

### MOCK_DATA.md
- Purpose: Normalized mock data spec for offline development
- Owner: Development
- Update when: New GearPrice fields added, new regions added
- Archive: Never
- Relevant for: UI development, mock mode work

---

## P3 — Reference Only

### PROJECT_STATE.md
- Purpose: Milestone-level phase progress
- Owner: Product
- Update when: Phase completes
- Archive: Never

### AI_HANDOFF.md
- Purpose: Context for incoming AI agents — prohibited actions, approval requirements
- Owner: Repository governance
- Update when: New prohibited patterns discovered
- Archive: Never

### TOKEN_RULES.md
- Purpose: Token budget and session efficiency rules
- Owner: Repository governance
- Update when: New efficiency rules added
- Archive: Never

### DOC_SYNC_RULES.md
- Purpose: When and what to update after implementation changes
- Owner: Repository governance
- Update when: New doc sync scenarios discovered
- Archive: Never

### DONE_DEFINITION.md
- Purpose: Task completion checklist
- Owner: Repository governance
- Update when: New completion requirements added
- Archive: Never

### ERROR_PATTERNS.md
- Purpose: Recurring implementation mistake registry
- Owner: Repository governance
- Update when: New pattern discovered (EP-XXX)
- Archive: Never

### DEPRECATION_RULES.md
- Purpose: Deprecation header format, shim rules, cleanup policy
- Owner: Repository governance
- Update when: New deprecated file added, cleanup policy changes
- Archive: Never

### MIGRATION_RULES.md
- Purpose: Incremental/reversible/documented change discipline
- Owner: Repository governance
- Update when: New prohibited migration pattern discovered
- Archive: Never

### NEXT_TASKS.md
- Purpose: Phase 2+ planned work
- Owner: Product
- Update when: Phase plan changes, new task scoped
- Archive: Never

### CONTEXT_BUDGET_RULES.md
- Purpose: Token efficiency rules, doc read routing, forbidden patterns
- Owner: Repository governance
- Update when: New task type routing needed, budget rules change
- Archive: Never
- Priority: P3

### CONTEXT_VALIDITY_RULES.md
- Purpose: Stale context prevention, doc freshness checks, autonomous execution mode
- Owner: Repository governance
- Update when: New validity rules needed
- Archive: Never
- Priority: P3

---

## CHANGELOG & HISTORY

### CHANGELOG_AI.md
- Purpose: Append-only AI-readable implementation history
- Owner: Repository
- Update when: Every implementation batch completes
- Archive: Never (append only, newest first)
- Priority: P3 (lower priority over time)

---

## TASKS (docs/tasks/)

### task_001_phase1_mvp.md
- Purpose: Phase 1 MVP task definition and checklist
- Owner: Active task
- Update when: Checklist item completes
- Archive: When phase completes → move to docs/archive/

---

## DECISIONS (docs/decisions/)

### 001_no_orm.md — P3
- Purpose: No ORM decision record
### 002_single_repo.md — P3
- Purpose: Single repo decision record
### 003_provider_isolation.md — P3
- Purpose: Provider isolation decision record
### 004_no_full_crawling.md — P3
- Purpose: No full crawl decision record
### 005_data_access_boundary.md — P3
- Purpose: dataAccess.ts as UI boundary decision
### 006_ui_architecture.md — P3
- Purpose: Component responsibility, Server/Client boundary, mobile-first

---

## Ownership Map

| Layer | Primary Docs |
|-------|-------------|
| Active work | CURRENT_TASK.md, STATE_SNAPSHOT.md |
| Data/API | API_CONTRACT.md, DB_SCHEMA.md |
| Architecture | ARCHITECTURE.md, decisions/ |
| Features | FEATURE_CONTRACTS.md |
| Providers | SCRAPING_RULES.md |
| Governance | AI_HANDOFF.md, TOKEN_RULES.md, CONTEXT_BUDGET_RULES.md, DOC_SYNC_RULES.md, DONE_DEFINITION.md, ERROR_PATTERNS.md, DEPRECATION_RULES.md, MIGRATION_RULES.md |
| History | CHANGELOG_AI.md |
| Product | PROJECT_STATE.md, NEXT_TASKS.md |
| Tasks | docs/tasks/ |
| Decisions | docs/decisions/ |

---

## Archive Condition

Move to docs/archive/ when:
- Task file: phase completes
- Decision: superseded by newer decision
- Any doc: STATUS changed to DEPRECATED and all references migrated
