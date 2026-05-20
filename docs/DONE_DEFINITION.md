---
STATUS: STABLE
---
# DONE_DEFINITION

A task is NOT complete unless ALL of the following pass:

## Checklist
- [ ] Implementation finished
- [ ] Docs synced (DOC_SYNC_RULES.md)
- [ ] TypeScript type check passes (tsc --noEmit)
- [ ] Lint passes (next lint)
- [ ] STATE_SNAPSHOT.md updated
- [ ] CHANGELOG_AI.md updated (append)
- [ ] Task file status updated (/docs/tasks/task_XXX.md)

## Notes
- Partial implementation = task remains ACTIVE
- Skip doc sync = task NOT done
- STATE_SNAPSHOT rewrite required at phase milestones
