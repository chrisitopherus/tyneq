# Contributing

This page explains how to contribute to Tyneq — adding new operators, writing tests, documenting changes, and keeping the codebase consistent.

## Repository Setup

```bash
git clone <repo>
cd tyneq
npm install
npm run build       # compile once
npm test            # run the test suite
```

Other useful commands:

```bash
npm run lint        # ESLint
npm run docs:api    # regenerate API docs from TSDoc
npm run docs:build  # build the documentation site
npm run docs:dev    # serve docs locally with hot reload
```

## Project Structure

```
src/
  core/               — base classes, enumerators, errors, ordering
  enumerators/
    streaming/        — streaming enumerator implementations (@builtinOperator)
    buffer/           — buffering enumerator implementations (@builtinOperator)
  operators/          — terminal operator implementations (@builtinTerminal) — flat, no subdirectory
  extensions/         — public registration API (@operator, createOperator, OperatorRegistry)
  queryplan/          — QueryNode, QueryPlanPrinter
  types/              — public TypeScript interfaces (TyneqSequence, IQueryNode, …)
  utility/            — internal argument validation helpers

tests/
  unit/               — per-operator and per-subsystem unit tests
  integration/        — end-to-end pipeline tests

docs/guide/           — this documentation site
```

## Adding a New Operator

### Step 1 — Choose a category

| Category | Description | Memory |
|---|---|---|
| **Streaming** | Yields one element at a time from a source enumerator | O(1) |
| **Buffering** | Materializes all or part of the source before yielding | O(n) |
| **Terminal** | Consumes the source and returns a value, not a sequence | — |

Use streaming unless sorting, set operations, or full-source knowledge is required. Use terminal when the result is a scalar (`number`, `boolean`, etc.) or a materialized collection.

### Step 2 — Choose a registration API

| API | When to use |
|---|---|
| `createStreamingOperator` | Streaming operators that fit cleanly in a generator function |
| `createOperator` | Streaming/buffering operators with custom enumerator factory |
| `createTerminalOperator` | Terminal operators expressed as a plain function |
| `@operator` decorator | Class-based streaming/buffering (used for the library's own operators) |
| `@terminal` decorator | Class-based terminal (used for the library's own operators) |

For external/plugin operators, `createStreamingOperator` and `createTerminalOperator` require the least ceremony. For operators complex enough to warrant a class, use the decorator approach.

### Step 3a — Functional streaming operator

```ts
// src/enumerators/streaming/everyOther.ts
import { createStreamingOperator } from '../../extensions/createStreamingOperator';

createStreamingOperator({
    name: 'everyOther',
    *generator(source: Iterable<unknown>): IterableIterator<unknown> {
        let skip = false;
        for (const item of source) {
            if (!skip) yield item;
            skip = !skip;
        }
    }
});
```

No validation needed here (no user arguments). For operators with arguments, add a `validate` function:

```ts
import { ArgumentUtility } from '../../utility/argumentUtility';

createStreamingOperator({
    name: 'takeEvery',
    *generator(source: Iterable<unknown>, step: number): IterableIterator<unknown> {
        let index = 0;
        for (const item of source) {
            if (index % step === 0) yield item;
            index++;
        }
    },
    validate(step) {    // step: number — TypeScript infers from generator signature
        ArgumentUtility.checkPositive({ step });
    }
});
```

### Step 3b — Functional terminal operator

```ts
// src/operators/product.ts
import { createTerminalOperator } from '../../extensions/createTerminalOperator';
import { Enumerable } from '../../types/core';

createTerminalOperator({
    name: 'product',
    execute(source: Enumerable<number>): number {
        let result = 1;
        for (const item of source) result *= item;
        return result;
    }
});
```

### Step 3c — Class-based operator with `@operator`

Class-based operators extend `TyneqEnumerator`. For buffering operators, pass `"buffer"` as the second argument to `@operator`. The decorator registers the class and patches the method onto all sequences.

```ts
import { TyneqEnumerator } from '../../core/enumerators/TyneqEnumerator';
import { operator } from '../../extensions/operator';
import { ArgumentUtility } from '../../utility/argumentUtility';
import type { Enumerator } from '../../types/core';

@operator<[predicate: unknown]>('dropWhile', (predicate) => {
    ArgumentUtility.checkNotOptional({ predicate });
})
export class DropWhileEnumerator<T> extends TyneqEnumerator<T> {
    private dropping = true;
    private readonly predicate: (item: T) => boolean;

    constructor(source: Enumerator<T>, predicate: (item: T) => boolean) {
        super(source);
        this.predicate = predicate;
    }

    protected handleNext(): IteratorResult<T> {
        while (true) {
            const next = this.sourceEnumerator.next();
            if (next.done) return next;
            if (this.dropping && this.predicate(next.value)) continue;
            this.dropping = false;
            return next;
        }
    }
}
```

### Step 4 — Register the implementation

Add a **named import** to `src/core/TyneqEnumerableBase.ts` in the appropriate section so the class module is loaded (and its decorator fires) when the library loads:

```ts
// src/core/TyneqEnumerableBase.ts — streaming enumerators section
import { EveryOtherEnumerator } from '../enumerators/streaming/everyOther';
```

Then add the method body that delegates to the enumerator:

```ts
public everyOther(): TyneqSequence<TSource> {
    const node = this.createOperatorNode(EveryOtherEnumerator, []);
    return this.createEnumerable(
        { getEnumerator: () => new EveryOtherEnumerator<TSource>(this.getEnumerator()) },
        node
    );
}
```

### Step 5 — Declare the method signature on `TyneqSequence`

Runtime registration alone does not teach the TypeScript type system about the new method. Add a declaration to `src/types/core.ts` in the correct section:

```ts
// In the STREAMING OPERATORS section of TyneqSequence<TSource>:

/**
 * Yields every other element, discarding the in-between ones.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 */
everyOther(): TyneqSequence<TSource>;
```

Follow the `DOCUMENTATION_GUIDELINES.md` in the repo root — every operator declaration needs the execution-model `@remarks`, and `@throws` where applicable.

### Step 6 — Write tests

Place tests under `tests/unit/operators/` or `tests/integration/` depending on scope.

```ts
// tests/unit/operators/product.spec.ts
import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../src";

describe("product", () => {
    it("returns 1 for an empty sequence", () => {
        expect(Tyneq.from<number>([]).product()).toBe(1);
    });

    it("multiplies all elements", () => {
        expect(Tyneq.from([2, 3, 4]).product()).toBe(24);
    });
});
```

### Step 7 — Verify

```bash
npx tsc --noEmit    # type-check
npm test            # all tests pass
npm run docs:api    # confirm TSDoc renders correctly
```

## Code Conventions

### Argument Validation

All user-supplied function arguments must be validated eagerly (before any deferred factory is created). Use the helpers in `src/utility/argumentUtility.ts`:

| Helper | Rejects |
|---|---|
| `ArgumentUtility.checkNotOptional({ arg })` | `null` and `undefined` |
| `ArgumentUtility.checkNotNull({ arg })` | `null` only |
| `ArgumentUtility.checkPositive({ arg })` | `≤ 0` |
| `ArgumentUtility.checkNonNegative({ arg })` | `< 0` |

Pass a single-property object so the error message includes the argument name automatically.

### Validation placement

- **Decorator-based operators (`@operator`, `@terminal`)**: validate in the decorator's second argument, not in the constructor.
- **Functional operators (`createOperator*`)**: validate in `config.validate`.
- **Direct base-class methods**: validate at the top of the method before creating any lazy factory.

### Error classes

Use Tyneq's specific error classes rather than the native `Error`:

- `ArgumentNullError` — for `null` arguments
- `ArgumentError` — for `undefined` arguments  
- `ArgumentOutOfRangeError` — for out-of-range numerics
- `InvalidOperationError` — for invalid sequence states
- `SequenceContainsNoElementsError` — when a non-empty sequence is required

All are importable from `src/core/errors/`.

### TSDoc on operator implementations

Operator enumerator/operator classes should be marked `@internal` and document:

- A one-line summary.
- `@remarks` with the standard execution-model phrase as the **first sentence**.
- Any non-obvious behavioral guarantees beyond what the public interface declares.
- `@see {@link TyneqSequence.operatorName}` linking to the public API.

```ts
/**
 * Yields every other element, discarding the in-between ones.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.everyOther} for the public API.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
@operator("everyOther")
export class EveryOtherEnumerator<T> extends TyneqEnumerator<T> { ... }
```

## Documentation Requirements

Every change to the public API surface requires:

1. **TSDoc** on the `TyneqSequence` interface member — execution model, `@throws`, edge cases.
2. **Operators Overview update** — add the operator to the correct category list.
3. **TSDoc update** at the implementation call-site — mark as `@internal` with execution model.

See [Documentation Maintenance](/guide/documentation-maintenance) for the full maintenance workflow.

## Testing Guidelines

- Each operator should have at minimum: empty-sequence behavior, single-element, multiple-elements, and exact-error-type tests for thrown errors.
- Validate re-iteration: enumerate the same sequence object twice and confirm both results are identical.
- For large or stateful tests, use `afterEach` + `OperatorRegistry.unregister` to clean up dynamically registered operators.

> See `tests/unit/extensions/createOperator.spec.ts` for real examples of test isolation with unique operator names per test run.

## Related Pages

- [Extensibility and Query Plans](/guide/extensibility)
- [Core Concepts](/guide/concepts)
- [Documentation Maintenance](/guide/documentation-maintenance)
