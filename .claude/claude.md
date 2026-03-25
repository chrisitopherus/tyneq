# Tyneq — Claude Code Instructions

## Session Start

Before any implementation:
1. Read `tasks/lessons.md` - check if unanswered questions/ideas are there and answer them
2. Read `tasks/lessons.md` — contains distilled rules; don't re-derive them
3. Read `tasks/todo.md` — check active work items and known issues
4. Run `git branch` — implementation work goes on feature branches, not `main`
5. Consult `.claude/workflow.md` for task execution protocol

---

## Key Commands

```bash
npx tsc --noEmit       # type-check first — fast, catches most mistakes
npm test               # full test suite (vitest)
npm run lint           # check style (quotes, semis)
npm run lint:fix       # auto-fix style violations
npm run build          # tsup CJS + ESM + types
npm run docs           # typedoc generation
```

Always run `npx tsc --noEmit` before `npm test`. Fix type errors first.
Run `npm run lint:fix` when adding new files to keep quote style consistent.

---

## Project Overview

Tyneq is a LINQ-style lazy enumerable library for TypeScript. The core contract is:
- Every enumeration must produce a fresh enumerator with independent state
- Operators are lazy unless categorized as "buffer" (requires full-source state)
- Operators are registered onto `TyneqEnumerableBase.prototype` at module-load time via the registry

**Source layout:**
| Path | Purpose |
|------|---------|
| `src/core/` | Runtime kernel: base types, ordering, caching, errors, query-node plumbing |
| `src/enumerators/streaming/` | Streaming enumerator implementations |
| `src/enumerators/buffer/` | Buffer enumerator implementations |
| `src/operators/` | Terminal operator implementations (flat — no subdirectory) |
| `src/extensions/` | `@operator`, `@terminal`, `createOperator`, `OperatorRegistry` |
| `src/queryplan/` | Query plan introspection types and printers |
| `src/utility/` | `ArgumentUtility` facade + `src/utility/guards/` implementations |
| `src/types/core.ts` | `TyneqSequence` — the public method surface |
| `tests/unit/operators/` | Per-operator unit tests |
| `tests/integration/` | Composed pipeline and re-iterability tests |

---

## Adding an Operator — Required Checklist

All four steps are mandatory. Missing any causes silent failures or type errors.

1. **Create the operator file** in the correct folder (see `tasks/lessons.md` → "Where to put a new operator file")
2. **Add validation** to the `validate` arg of `@operator`/`@terminal`/`createOperator` — never in the constructor
3. **Add a named import** to `src/core/TyneqEnumerableBase.ts` (streaming/buffer: import the enumerator class; terminal: import the operator class)
4. **Add the method signature** to `TyneqSequence` in `src/types/core.ts`

---

## Non-Negotiable Rules

**Validation placement:** `validate` callback runs eagerly at call site. Constructor only validates `sourceEnumerator` (infrastructure). Putting user-arg validation in a constructor defers errors until iteration — a silent failure. See `tasks/lessons.md` for the full pattern.

**Base class selection:**
| Kind | Extends |
|------|---------|
| Streaming operator | `TyneqEnumerator` |
| Buffer operator | `TyneqEnumerator` (declare kind explicitly: `@operator('name', 'buffer')`) |
| Terminal operator | `TyneqTerminalOperator` |
| Source generator | `TyneqBaseEnumerator` ← **not for pipeline operators** |

**`any[]` in decorators is intentional.** TypeScript rejects `unknown[]` in decorator positions due to contravariance. Don't "fix" it.

**`IWithCreateEnumerable` cast is intentional.** The double-cast exists to call a `protected` method from registration machinery. See `tasks/lessons.md` → "Architecture Decisions".

**Never patch the prototype directly.** All registration must go through `@operator`, `@terminal`, `createOperator`, `createStreamingOperator`, or `createTerminalOperator`.

**Both registration styles are intentional.** Class-based (`@operator`) and functional (`createOperator`) both route through `OperatorRegistry`. Don't consolidate them.

---

## Validation Utilities

Use `ArgumentUtility` (facade at `src/utility/argumentUtility.ts`):
- Prefer shorthand `{ param }` over explicit name strings — name is inferred via `nameof`
- Use `ValidationBuilder` to accumulate and throw all errors at once when validating multiple args

---

## Architecture Decisions — Don't Re-Derive

See `tasks/lessons.md` → "Architecture Decisions" for the canonical list. The most commonly misread ones:
- `any[]` constraints in decorators — required by TypeScript, not a bug
- `IWithCreateEnumerable` cast — structural workaround for `protected` method access
- Dual registration APIs — intentional, interchangeable at runtime

---

## After a Correction

1. Add a rule to `tasks/lessons.md` that would have prevented the mistake
2. If it's a bug: add to `tasks/todo.md`
3. If it's a design trade-off: document in `tasks/lessons.md` → "Architecture Decisions", not in todo

---

## Principles

- **Root causes only** — no workarounds, no `--no-verify`, no temporary hacks
- **Minimal impact** — touch only what the task requires
- **Ask when blocked** — don't brute-force past an obstacle
- **Elegant > clever** — for non-trivial changes, ask "is there a simpler way?" before finalizing
- **Tasks with 3+ steps or architectural decisions** → enter plan mode, write to `tasks/todo.md`, check in before implementing

---

## Key References

| What | Where |
|------|-------|
| Operator authoring patterns & common mistakes | `tasks/lessons.md` |
| Active work items | `tasks/todo.md` |
| Task execution protocol | `.claude/workflow.md` |
| Adding/reshaping operators | `HOWTO.md` |
| TSDoc conventions | `DOCUMENTATION_GUIDELINES.md` |
| Navigation shortcuts (which file owns what) | `tasks/lessons.md` → "Navigation Shortcuts" |
