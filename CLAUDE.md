# Tyneq -- Agent Instructions

This file is loaded automatically by Claude Code at the start of every session.
It is the single source of truth for how the agent must behave in this repository.

---

## File aliases (read these before touching anything)

| Alias | Path | Purpose |
|---|---|---|
| `LESSONS` | `tasks/lessons.md` | Distilled rules, architecture decisions, common mistakes |
| `TODO` | `tasks/todo.md` | Active work items and resolved history |
| `FUTURE` | `tasks/future.md` | Deferred ideas, not actionable yet |
| `NOTES` | `tasks/notes.md` | Scratch pad -- raw ideas from the user to evaluate |
| `STATE` | `tasks/workflow-state.md` | Live session state (branch, last run, pending steps) |
| `RESULTS` | `tasks/results.md` | Accumulated run outputs and findings |

Always read `LESSONS` and `STATE` at the start of any non-trivial task. They contain decisions
that must not be re-derived.

---

## Branch discipline

- `main` -- release branch, protected. Never commit directly.
- `dev` -- integration branch, protected. Never commit directly.
- Every feature, fix, or doc change gets its own branch off `dev`.
- Branch naming: `feature/<slug>`, `fix/<slug>`, `docs/<slug>`, `refactor/<slug>`.
- Always create the branch before making any file changes.

```bash
git checkout dev && git pull
git checkout -b feature/<slug>
```

---

## Mandatory workflow for every change

Run these steps in order. Do not skip any step. Update `STATE` after each step completes.

### 1. Read context
- Read `LESSONS` for rules that apply to the change.
- Read `STATE` to know what was done last session.
- If the task came from `NOTES`, evaluate each note and decide: implement, document, defer to `FUTURE`, or discard.

### 2. Create branch
- Always create a new branch off `dev` before making any changes.

### 3. Implement
- Make the minimum change required. No speculative additions.
- ASCII-only in all text files (no Unicode arrows, ellipses, em-dashes, smart quotes).
- Follow the ESLint code style from `LESSONS` (double quotes, explicit access modifiers, etc.).

### 4. Type-check
```bash
npx tsc --noEmit
```
Fix all errors before proceeding.

### 5. Lint
```bash
npm run lint
```
If violations exist, run `npm run lint:fix`, then re-check. Fix anything lint:fix cannot auto-fix.

### 6. Test
```bash
npm test
```
All tests must pass. If a test fails, diagnose and fix -- do not skip or comment out tests.

### 7. Review agent (spawn in background)
After steps 4-6 pass, spawn a `general-purpose` subagent to review the changes:

> "Review the changes on branch [branch-name] in c:/Users/jochc/Documents/repos/tyneq.
> Check for: correctness, edge cases not covered by tests, clarity of code and docs,
> performance issues, ASCII-only compliance in text files, ESLint style violations,
> consistency with patterns in tasks/lessons.md, and anything that could be simplified.
> Report findings as a numbered list. If nothing needs changing, say 'No issues found.'"

Apply any valid findings. Re-run steps 4-6 after applying fixes.
If the review agent finds nothing, the change is ready to commit.

### 8. Refinement pass
Before committing, scan the changed files for:
- Performance: unnecessary allocations, redundant iterations, missed early-returns.
- Clarity: variable names, comment accuracy, doc examples that are wrong or misleading.
- Docs: README, guide pages, and JSDoc that describe the changed behavior. Update all of them.
- Consistency: does the change match the patterns in similar existing code?

### 9. Update state files
- Update `STATE` with: branch name, what was done, scripts that passed, pending items.
- If a note in `NOTES` was resolved, remove or strike it.
- If new rules or patterns were discovered, add them to `LESSONS`.
- If a new future idea surfaced, add it to `FUTURE`.

### 10. Commit
```bash
git add <specific files>
git commit -m "<type>: <short description>"
```
Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
Never use `git add -A` or `git add .` -- always stage specific files.

---

## Key scripts

```bash
npx tsc --noEmit       # type-check (step 4)
npm run lint           # ESLint check (step 5)
npm run lint:fix       # auto-fix style violations
npm test               # vitest run (step 6)
npm run test:coverage  # with coverage report
npm run build          # full build: tsc + lint + tsup
npm run docs:api       # regenerate TypeDoc API docs
npm run docs:dev       # local docs site (VitePress)
```

---

## Key file locations

| What | Where |
|---|---|
| Public API barrel | `src/index.ts` |
| All sequence methods (types) | `src/types/core.ts` -- `TyneqSequence`, `TyneqOrderedSequence`, `TyneqCachedSequence` |
| `@operator` decorator | `src/plugin/decorators/operator.ts` |
| `@terminal` decorator | `src/plugin/decorators/terminal.ts` |
| `@orderedOperator` decorator | `src/plugin/decorators/orderedOperator.ts` |
| `@cachedOperator` decorator | `src/plugin/decorators/cachedOperator.ts` |
| `createOperator` | `src/plugin/registration/createOperator.ts` |
| `createGeneratorOperator` | `src/plugin/registration/createGeneratorOperator.ts` |
| `createTerminalOperator` | `src/plugin/registration/createTerminalOperator.ts` |
| `createOrderedOperator` | `src/plugin/registration/createOrderedOperator.ts` |
| `createCachedOperator` | `src/plugin/registration/createCachedOperator.ts` |
| `OperatorRegistry` | `src/core/registry/TyneqOperatorRegistry.ts` |
| `TyneqBaseEnumerator` (lifecycle) | `src/core/enumerators/TyneqBaseEnumerator.ts` |
| `TyneqEnumerator` (standard base) | `src/core/enumerators/TyneqEnumerator.ts` |
| `TyneqOrderedEnumerator` | `src/core/enumerators/TyneqOrderedEnumerator.ts` |
| `TyneqCachedEnumerator` | `src/core/enumerators/TyneqCachedEnumerator.ts` |
| `QueryPlanCompiler` | `src/queryplan/compiler/QueryPlanCompiler.ts` |
| All built-in operator imports | `src/core/TyneqEnumerableBase.ts` |
| `ArgumentUtility` facade | `src/utility/ArgumentUtility.ts` |
| Guard implementations | `src/utility/guards/` |
| Streaming operator enumerators | `src/enumerators/streaming/` |
| Buffer operator enumerators | `src/enumerators/buffer/` |
| Terminal operators | `src/operators/` |
| Tests | `tests/unit/` and `tests/integration/` |

---

## Adding a new operator -- checklist

1. Create the file in the right folder (see `LESSONS` -- "Where to put a new operator file").
2. Add a named import in `src/core/TyneqEnumerableBase.ts`.
3. Add the method signature to the correct interface in `src/types/core.ts`.
4. Add an export to `src/index.ts` if the class itself should be public (e.g., base class for plugins).
5. Write tests under `tests/unit/operators/`.
6. Run steps 4-6 from the workflow above.

---

## Code style rules (enforced by ESLint)

- Double quotes everywhere (`"string"`, not `'string'`).
- Explicit semicolons.
- `===` / `!==` only -- never `==` / `!=`.
- `const` / `let` only -- never `var`.
- Arrow function params always parenthesized: `(x) => x`, not `x => x`.
- Spaces inside object braces: `{ key: value }`.
- Every class member must declare `public`, `private`, or `protected` explicitly.
- ASCII-only in all text files -- no Unicode arrows (`->`), ellipses (`...` as U+2026), em-dashes, smart quotes.

---

## Validation contract (do not re-derive)

- `validate` callback in any registration API runs **eagerly at the call site**.
- Enumerator constructors validate only `sourceEnumerator` (infrastructure). Never user args.
- `@terminal` validate runs before construction and `process()`.
- Putting user-arg validation in constructors defers errors until iteration -- a silent failure.

---

## Review agent prompt template

Use this exact prompt when spawning the review agent (step 7):

```
Review the changes on branch [BRANCH] in c:/Users/jochc/Documents/repos/tyneq.

Specifically check:
1. Correctness -- are there edge cases the implementation misses?
2. Test coverage -- are there scenarios not covered by the new/changed tests?
3. Code clarity -- naming, comments, doc examples accurate?
4. Performance -- unnecessary allocations, redundant work, missed short-circuits?
5. ASCII compliance -- any Unicode arrows/ellipses/em-dashes/smart quotes in text files?
6. ESLint style -- double quotes, explicit access modifiers, arrow parens, semicolons?
7. Consistency with tasks/lessons.md patterns.
8. README, guide docs, and JSDoc -- do they describe the changed behavior accurately?

Report as a numbered list of findings. For each finding include: file, line range, and a
concrete suggestion. If there are no issues, say exactly: "No issues found."
```
