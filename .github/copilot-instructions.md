# Project Guidelines

## Build and Test

- Install dependencies with `npm install`.
- Build the library with `npm run build`.
- Run the test suite with `npm test` or `npm run test:coverage` when coverage matters.
- Use `npm run docs:api` for API docs and `npm run docs:build` when changes affect docs.
- There is no lint script in this repo. Do not assume ESLint or Prettier are part of the required workflow.

## Architecture

- `src/core/` is the runtime kernel: enumerable base types, ordering, caching, errors, and query-node plumbing.
- `src/enumerators/streaming/`, `src/enumerators/buffer/`, and `src/operators/terminal/` separate operator implementations by execution model.
- `src/extensibility/` owns operator registration via decorators and functional factories. Route new operator registration through that layer instead of patching prototypes manually.
- `src/queryplan/` contains query introspection types and printers. Preserve `QueryNode` threading when changing operator creation paths.
- `tests/unit/operators/` contains per-operator tests. `tests/integration/pipeline.spec.ts` covers composed pipelines and re-iterability.

## Conventions

- Preserve the library's lazy, re-iterable semantics. Every enumeration must obtain a fresh enumerator with independent state.
- Choose an operator category before implementing anything: streaming first, buffering only when full-source state is required, terminal only when the result is a concrete value.
- For new operators, follow `HOWTO.md`. Register the operator and add its method declaration to `src/core/TyneqEnumerableBase.ts`.
- Keep validation in decorator or factory `validate` functions, not in enumerator constructors. The first constructor argument is infrastructure and should not be user-validated.
- Import new operator modules through the existing barrel exports so registration executes at module load time.
- Respect the query-plan model. Decorator and factory registration usually handles nodes automatically; direct methods such as ordering or caching require explicit `QueryNode` creation.

## Documentation

- Follow `DOCUMENTATION_GUIDELINES.md` for all TSDoc changes. Comments must add information the signature does not already convey.
- Use Tyneq terminology consistently: sequence, source, element, predicate, selector, comparer, streaming, buffering, terminal, deferred, immediate.
- Document execution model, empty-sequence behavior, ordering or stability guarantees, and exact thrown error types whenever they are relevant.

## Pitfalls

- The `any[]` constructor constraints in operator decorators are intentional. Do not replace them with `unknown[]`; see `ATTENTION.md`.
- The repo intentionally supports both decorator-based and functional operator registration. Do not duplicate operator names across both paths.
- `orderBy`, `orderByDescending`, `thenBy`, `thenByDescending`, and `memoize` are special cases that build `QueryNode` instances directly.
- `QueryPlanPrinter` uses Node.js `fs`; avoid assuming it is browser-safe.

## Key References

- Read `HOWTO.md` before adding or reshaping operators.
- Read `DOCUMENTATION_GUIDELINES.md` before making broad TSDoc edits.