---
STATUS: STABLE
---
# DOC_SYNC_RULES

## Rule
If implementation changes any of the following, update relevant markdown WITHIN THE SAME BATCH:

| Change | Update |
|--------|--------|
| API behavior | API_CONTRACT.md |
| DB schema | DB_SCHEMA.md + migrations/ |
| Provider contract | decisions/003_provider_isolation.md |
| Architecture boundary | ARCHITECTURE.md |
| Task scope | /docs/tasks/task_XXX.md |
| Phase completion | PROJECT_STATE.md |
| Any above | STATE_SNAPSHOT.md + CHANGELOG_AI.md |

## Code/Docs Divergence
Code/docs divergence = repository error.
If found: update docs first, then verify code matches.

## Batch Rule
Never commit implementation without doc sync.
DONE_DEFINITION.md enforces this at task completion.
