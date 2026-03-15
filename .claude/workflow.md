# Tyneq — Claude Workflow

## Session Start Checklist
1. Read `tasks/lessons.md` — don't re-derive patterns already documented
2. Read `tasks/todo.md` — understand active work items and known bugs
3. Check current branch (`git branch`) — implementation work goes on feature branches, not `main`
4. Check `tasks/lessons.md` → "Architecture Decisions" before calling something a bug — many quirks are intentional trade-offs

---

## Task Execution

### For any task with 3+ steps or an architectural decision
→ Enter plan mode. Write the plan to `tasks/todo.md` as checkable items before touching code.
→ Check in with the user before starting implementation.

### During implementation
- Mark todo items complete as you finish each one — not in a batch at the end
- If something goes sideways: STOP, re-plan, don't push through
- One subagent per research/exploration concern — keep main context clean

### Verification (never skip)
- Run `npx tsc --noEmit` — catch type errors before running tests
- Run `npm test` — confirm no regressions
- Would a staff engineer approve this? If not, fix it first

---

## Operator Work Rules

Adding an operator requires **all four** of:
1. Create operator file in the right folder (see `tasks/lessons.md` → "Where to put a new operator file")
2. Add `validate` to the decorator/function (not in the constructor)
3. Add side-effect import to `src/operators/extensions/index.ts`
4. Add method signature to `ITyneqEnumerable` in `src/types/core.ts`

Missing any of these causes silent failures or type errors. See `tasks/lessons.md`.

---

## After a Correction
1. Update `tasks/lessons.md` with the rule that would have prevented the mistake
2. If it's a bug: add to `tasks/todo.md`
3. If it's a known trade-off: document it inline in `tasks/lessons.md` → "Architecture Decisions", not in todo

---

## Key Commands
```bash
npx tsc --noEmit       # type-check (run first, it's fast)
npm test               # full test suite
npm run build          # tsup CJS + ESM + types
npm run docs           # typedoc
```

---

## Principles
- **Root causes only** — no workarounds, no `--no-verify`, no temporary hacks
- **Minimal impact** — touch only what the task requires
- **Ask when blocked** — don't brute-force past an obstacle
- **Elegant > clever** — for non-trivial changes, ask "is there a simpler way?" before finalizing
