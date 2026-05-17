---
STATUS: STABLE
---
# CONTEXT_BUDGET_RULES

> Context efficiency is a core architecture requirement.
> Repository must remain AI-operable under constrained context windows.

---

## Default Read Strategy

```
Session start:
1. DOCUMENT_INDEX.md       ← routing only, not full doc load
2. CURRENT_TASK.md (P1)    ← always
3. STATE_SNAPSHOT.md (P1)  ← always
4. Relevant P2 docs only   ← based on task type (see routing below)
5. P3 docs only if required ← look up specific rule, not full read
```

Never read all docs automatically.
Never recursively load all markdown files.

---

## Task-Based Read Routing

| Task type | Load docs |
|-----------|-----------|
| UI change | ARCHITECTURE.md, API_CONTRACT.md, FEATURE_CONTRACTS.md |
| DB migration | DB_SCHEMA.md, MIGRATION_RULES.md |
| Provider work | SCRAPING_RULES.md, API_CONTRACT.md |
| New feature | FEATURE_CONTRACTS.md, ARCHITECTURE.md |
| Mock/dev | MOCK_DATA.md |
| Deprecation | DEPRECATION_RULES.md |
| Doc update | DOC_SYNC_RULES.md, DOCUMENT_INDEX.md |
| Bug fix | ERROR_PATTERNS.md (scan for related EP) |
| Phase completion | DONE_DEFINITION.md, PROJECT_STATE.md |

---

## Forbidden Patterns

```
❌ Read all .md files in docs/
❌ Load CHANGELOG_AI.md unless debugging history
❌ Re-read docs already in context
❌ Inline full doc content into summaries
❌ Load decisions/ unless reviewing architecture
❌ Load archive/ unless explicitly requested
❌ Read entire task file list if current task is known
```

---

## Summary Rules

When summarizing documents:
- Use bullets only
- Operational wording (verbs + outcomes)
- No prose explanations
- No restating obvious context
- Max 3 bullets per doc
- Skip docs with no change since last read

---

## Token Budget

| Operation | Max tokens |
|-----------|-----------|
| Session startup (P1 docs) | ~1500 |
| Per-task P2 docs | ~2000 |
| Implementation output | ~4000 |
| Total per session | ~8000 |

---

## Context Hygiene Rules

- Do NOT duplicate document content between docs
- Do NOT inline CHANGELOG_AI history into STATE_SNAPSHOT
- Do NOT copy ARCHITECTURE into API_CONTRACT
- Each doc owns its domain exclusively (see DOCUMENT_INDEX.md)
- CHANGELOG_AI grows over time — load only if explicitly needed

---

## AI Agent Checklist (before loading docs)

1. Is this doc already in context? → Skip
2. Is this doc P3 and not task-relevant? → Skip
3. Is this an archive doc? → Skip unless explicitly requested
4. Am I about to load all markdown files? → Stop
5. Can I answer from STATE_SNAPSHOT alone? → Use it
