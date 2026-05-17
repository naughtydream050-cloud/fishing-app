---
STATUS: STABLE
---
# CONTEXT_VALIDITY_RULES

> AI agents tend to trust stale docs, merge old assumptions, and preserve outdated flows.
> Strict context validity checks are mandatory.

---

## Pre-Use Checklist (before relying on any doc)

- [ ] STATUS is ACTIVE or STABLE (not DEPRECATED or ARCHIVED)
- [ ] Not superseded by a newer decision or canonical replacement
- [ ] STATE_SNAPSHOT.md was recently rewritten (not accumulated)
- [ ] CURRENT_TASK.md points to active task only

---

## Invalid Context — Do NOT rely on

| Source | Why invalid |
|--------|-------------|
| @deprecated files | Logic moved to canonical location |
| docs/archive/ files | Historical only |
| Stale STATE_SNAPSHOT | Outdated completed/pending items |
| Superseded decisions | Check decisions/ for STATUS |
| Compatibility shims | Re-export only, no logic |
| Old CURRENT_TASK content | Must reflect active task only |

---

## STATE_SNAPSHOT Rules

- Rewrite completely when state changes
- Never append history (use CHANGELOG_AI for that)
- Under 200 lines always
- Old snapshots must NOT accumulate
- If snapshot has >5 outdated "pending" items → rewrite immediately

---

## CURRENT_TASK Rules

- Becomes invalid immediately after task completes
- Must point to ONE active task file only
- Never contain historical work
- Format: `CURRENT_TASK: task_XXX / See: /docs/tasks/task_XXX.md`

---

## Document Freshness Check

Before loading a doc, verify:

```typescript
// Check STATUS field in frontmatter
// If STATUS: DEPRECATED → use canonical replacement
// If STATUS: ARCHIVED → do not load unless explicitly requested
// If STATUS: STABLE → safe to load, unlikely to change
// If STATUS: ACTIVE → load, may have recent changes
```

---

## Autonomous Execution Mode

AUTONOMOUS REPOSITORY EXECUTION MODE is active.

Do NOT interrupt the user for:
- small approvals
- naming consistency
- mock data updates
- documentation sync
- migration bookkeeping
- feature isolation decisions
- canonical exports
- cleanup tasks
- shim removal timing
- lint/typecheck execution
- small UI refinements
- cache placement
- provider normalization

ONLY interrupt for:
- Destructive migrations
- Billing/payment production changes
- Infrastructure replacement
- Architecture redesign
- Irreversible deletions
- Credential/security-sensitive actions

---

## Task Continuation Flow

After each task completes:
1. Update STATE_SNAPSHOT.md + CHANGELOG_AI.md + task file
2. Select next logical task from NEXT_TASKS.md
3. Continue execution autonomously

---

## Repository Error Conditions

- Relying on @deprecated shim logic → ERROR
- Loading archived docs without explicit request → ERROR
- STATE_SNAPSHOT not updated after task completion → ERROR
- CURRENT_TASK pointing to completed task → ERROR
- AI agent asking user about routine implementation decisions → VIOLATION
