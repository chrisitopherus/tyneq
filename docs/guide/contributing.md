# Contributing

## Setup

```bash
git clone https://github.com/chrisitopherus/tyneq
cd tyneq
npm install
npm run build
npm test
```

```bash
npm run lint          # ESLint
npm run lint:fix      # auto-fix
npm run docs:api      # regenerate API docs from TSDoc
npm run docs:build    # build docs site
npm run docs:dev      # local docs site with hot reload
```

## Project Structure

```
src/
  core/               - base classes, enumerators, errors, ordering
  enumerators/
    streaming/        - streaming enumerator implementations
    buffer/           - buffering enumerator implementations
  operators/          - terminal operator implementations (flat, no subdirectory)
  plugin/             - public extension API (@operator, createOperator, OperatorRegistry)
  queryplan/          - QueryNode, QueryPlanPrinter, QueryPlanCompiler, QueryPlanOptimizer
  types/              - public TypeScript interfaces
  utility/            - internal argument validation helpers

tests/
  unit/               - per-operator unit tests
  integration/        - end-to-end pipeline tests
```

## Adding a New Operator

### 1. Choose a category

| Category | When to use | Memory |
|---|---|---|
| **Streaming** | One element at a time from the source | O(1) |
| **Buffering** | Requires full or partial source before yielding | O(n) |
| **Terminal** | Returns a value, not a sequence | - |

### 2. Create the implementation file

**Streaming or buffering** - in `src/enumerators/streaming/` or `src/enumerators/buffer/`:

```ts
// src/enumerators/streaming/dropWhile.ts
import { builtinOperator } from "../../plugin/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import type { Enumerator } from "../../types/core";

@builtinOperator({ name: "dropWhile", kind: "streaming" })
export class DropWhileEnumerator<T> extends TyneqEnumerator<T, T> {
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

**Terminal** - in `src/operators/`:

```ts
// src/operators/product.ts
import { builtinTerminal } from "../plugin/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import type { Enumerator } from "../types/core";

@builtinTerminal({ name: "product" })
export class ProductOperator extends TyneqTerminalOperator<number, number> {
  process(enumerator: Enumerator<number>): number {
    let result = 1;
    let next = enumerator.next();
    while (!next.done) { result *= next.value; next = enumerator.next(); }
    return result;
  }
}
```

### 3. Register in `TyneqEnumerableBase`

Add a named import in `src/core/TyneqEnumerableBase.ts` so the decorator fires at load time:

```ts
import { DropWhileEnumerator } from "../enumerators/streaming/dropWhile";
```

Then add the method body:

```ts
public dropWhile(predicate: (item: TSource) => boolean): TyneqSequence<TSource> {
  ArgumentUtility.checkNotOptional({ predicate });
  const node = this.createOperatorNode(DropWhileEnumerator, [predicate]);
  return this.createEnumerable(
    { getEnumerator: () => new DropWhileEnumerator<TSource>(this.getEnumerator(), predicate) },
    node
  );
}
```

> **Validation placement:** Validate user-supplied arguments in the method body of `TyneqEnumerableBase` - before any lazy factory is created. Do not validate in enumerator constructors (deferred) or `handleNext()`.

### 4. Add the method signature to `TyneqSequence`

In `src/types/core.ts`:

```ts
/**
 * Skips elements while `predicate` holds, then yields the rest.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @throws {ArgumentNullError} if `predicate` is `null`
 * @throws {ArgumentError} if `predicate` is `undefined`
 */
dropWhile(predicate: (item: TSource) => boolean): TyneqSequence<TSource>;
```

Every declaration needs a `@remarks` line with the execution-model phrase and `@throws` for each argument error.

### 5. Write tests

Place tests under `tests/unit/operators/streaming/` or `tests/unit/operators/terminal/` etc.

```ts
// tests/unit/operators/streaming/dropWhile.spec.ts
import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("dropWhile", () => {
  describe("normal usage", () => {
    it("drops elements while predicate holds then yields the rest", () => {
      expect(Tyneq.from([1, 2, 3, 1]).dropWhile(x => x < 3).toArray()).toEqual([3, 1]);
    });
    it("yields all elements if predicate never holds", () => {
      expect(Tyneq.from([3, 4, 5]).dropWhile(x => x < 1).toArray()).toEqual([3, 4, 5]);
    });
    it("produces the same results on repeated iteration", () => {
      const seq = Tyneq.from([1, 2, 3]).dropWhile(x => x < 2);
      expect(seq.toArray()).toEqual(seq.toArray());
    });
  });
  describe("invalid arguments", () => {
    it("throws ArgumentNullError when predicate is null", () => {
      expect(() => Tyneq.from([1]).dropWhile(null as any)).toThrow(ArgumentNullError);
    });
    it("throws ArgumentError when predicate is undefined", () => {
      expect(() => Tyneq.from([1]).dropWhile(undefined as any)).toThrow(ArgumentError);
    });
  });
});
```

### 6. Verify

```bash
npx tsc --noEmit    # type-check first
npm test            # all tests pass
npm run docs:api    # TSDoc renders correctly
```

## Validation Utilities

Use `ArgumentUtility` in `src/utility/argumentUtility.ts`:

| Helper | Rejects | Error thrown |
|---|---|---|
| `ArgumentUtility.checkNotOptional({ arg })` | `null` and `undefined` | `ArgumentNullError` / `ArgumentError` |
| `ArgumentUtility.checkNotNull({ arg })` | `null` only | `ArgumentNullError` |
| `ArgumentUtility.checkPositive({ arg })` | `≤ 0` | `ArgumentOutOfRangeError` |
| `ArgumentUtility.checkNonNegative({ arg })` | `< 0` | `ArgumentOutOfRangeError` |
| `ArgumentUtility.checkSafeInteger({ arg })` | non-safe integers | `ArgumentError` |
| `ArgumentUtility.checkFunction({ arg })` | non-functions | `ArgumentTypeError` |

Pass a single-key object so the argument name appears automatically in error messages.

## Testing Guidelines

Each operator should cover:
- Empty source behavior
- Normal usage (single element, multiple elements)
- Edge cases (equal-length sequences, boundary indices, etc.)
- Re-iteration: enumerate the same sequence twice and assert both results are identical
- One test per error type for invalid arguments

## Code Conventions

- Error classes from `src/core/errors/` - never raw `Error`/`TypeError`/`RangeError`
- Operator implementations are `@internal` - `@remarks` with the execution-model phrase as the first sentence
- TSDoc on every `TyneqSequence` method: summary, `@remarks`, `@throws` per argument

## Bug Reports and Feature Requests

[github.com/chrisitopherus/tyneq/issues](https://github.com/chrisitopherus/tyneq/issues)
