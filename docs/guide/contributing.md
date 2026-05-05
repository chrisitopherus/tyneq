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
  core/               - base classes, enumerators, errors, ordering, registry
    enumerators/      - TyneqBaseEnumerator, TyneqEnumerator, cached/ordered variants
    errors/           - error class hierarchy
    generators/       - RangeEnumerator, RandomEnumerator
    ordering/         - TyneqOrderedEnumerable, TyneqEnumerableSorter
    registry/         - TyneqOperatorRegistry
    terminal/         - TyneqTerminalOperator base classes
  enumerators/
    streaming/        - streaming enumerator implementations
    buffer/           - buffering enumerator implementations
    conversion/       - cast, ofType enumerators
  operators/          - terminal operator implementations
  plugin/             - public extension API (@operator, createOperator, OperatorRegistry)
    decorators/       - @operator, @terminal, @orderedOperator, @cachedOperator, ...
    registration/     - createOperator, createGeneratorOperator, createTerminalOperator, ...
  queryplan/          - QueryNode, QueryPlanPrinter, QueryPlanWalker,
                        QueryPlanTransformer, QueryPlanOptimizer, compiler/
  types/              - public TypeScript interfaces and type aliases
  utility/            - ArgumentUtility, TypeGuardUtility, ValidationBuilder, ...
    guards/           - NullGuards, NumericGuards, StringGuards, TypeGuards

tests/
  unit/               - per-operator unit tests
  integration/        - end-to-end pipeline tests
```

## Adding a New Operator

::: tip Plugin authors
This recipe is for adding a new **built-in** operator to the Tyneq codebase itself. For writing operators in your own package without modifying Tyneq, see [Custom Operators](./extensibility.md).
:::

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
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import type { Enumerator } from "../../types/core";

export class DropWhileEnumerator<T> extends TyneqEnumerator<T, T> {
  private dropping = true;

  public constructor(
    source: Enumerator<T>,
    private readonly predicate: (item: T) => boolean
  ) {
    super(source);
  }

  protected override handleNext(): IteratorResult<T> {
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
import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import type { Enumerable } from "../types/core";

export class ProductOperator extends TyneqTerminalOperator<number, number> {
  public constructor(source: Enumerable<number>) {
    super(source);
  }

  public process(): number {
    let result = 1;
    for (const item of this.source) result *= item;
    return result;
  }
}
```

### 3. Register and wire up in `TyneqEnumerableBase`

Import the class in `src/core/TyneqEnumerableBase.ts` and add the method body:

```ts
// import at the top of TyneqEnumerableBase.ts
import { DropWhileEnumerator } from "../enumerators/streaming/dropWhile";

// ...inside the class body:
@builtin({ kind: "streaming" })
public dropWhile(predicate: (item: TSource) => boolean): TyneqSequence<TSource> {
  ArgumentUtility.checkNotOptional({ predicate });
  const node = new QueryNode("dropWhile", [predicate], this[tyneqQueryNode], "streaming");
  return this.createEnumerable(
    { getEnumerator: () => new DropWhileEnumerator<TSource>(this.getEnumerator(), predicate) },
    node
  );
}
```

> **Validation placement:** Validate user-supplied arguments in the method body of `TyneqEnumerableBase` - before the lazy factory is created. Never validate in enumerator constructors (deferred) or `handleNext()`.

### 4. Add the method signature to `TyneqSequence`

In `src/types/core.ts`:

```ts
/**
 * Skips elements while `predicate` holds, then yields the rest.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @throws {ArgumentNullError} When `predicate` is null.
 * @throws {ArgumentError} When `predicate` is undefined.
 */
dropWhile(predicate: (item: TSource) => boolean): TyneqSequence<TSource>;
```

Every declaration needs the execution-model phrase in `@remarks` and a `@throws` entry per argument error.

### 5. Write tests

Place tests under `tests/unit/operators/streaming/`, `tests/unit/operators/buffer/`, or `tests/unit/operators/terminal/`:

```ts
// tests/unit/operators/streaming/dropWhile.spec.ts
import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("dropWhile", () => {
  it("drops elements while predicate holds then yields the rest", () => {
    expect(Tyneq.from([1, 2, 3, 1]).dropWhile(x => x < 3).toArray()).toEqual([3, 1]);
  });

  it("yields all elements if predicate never holds", () => {
    expect(Tyneq.from([3, 4, 5]).dropWhile(x => x < 1).toArray()).toEqual([3, 4, 5]);
  });

  it("returns empty for empty source", () => {
    expect(Tyneq.from([]).dropWhile(() => false).toArray()).toEqual([]);
  });

  it("produces the same results on repeated iteration", () => {
    const seq = Tyneq.from([1, 2, 3]).dropWhile(x => x < 2);
    expect(seq.toArray()).toEqual(seq.toArray());
  });

  it("throws ArgumentNullError when predicate is null", () => {
    expect(() => Tyneq.from([1]).dropWhile(null as any)).toThrow(ArgumentNullError);
  });

  it("throws ArgumentError when predicate is undefined", () => {
    expect(() => Tyneq.from([1]).dropWhile(undefined as any)).toThrow(ArgumentError);
  });
});
```

### 6. Verify

```bash
npx tsc --noEmit    # type-check first
npm test            # all tests pass
npm run lint        # no lint errors
```

## Validation Utilities

Use `ArgumentUtility` in `src/utility/ArgumentUtility.ts`:

| Helper | Rejects | Error thrown |
|---|---|---|
| `ArgumentUtility.checkNotOptional({ arg })` | `null` and `undefined` | `ArgumentNullError` / `ArgumentError` |
| `ArgumentUtility.checkNotNull({ arg })` | `null` only | `ArgumentNullError` |
| `ArgumentUtility.checkPositive({ arg })` | `<= 0` | `ArgumentOutOfRangeError` |
| `ArgumentUtility.checkNonNegative({ arg })` | `< 0` | `ArgumentOutOfRangeError` |
| `ArgumentUtility.checkInteger({ arg })` | non-integers | `ArgumentError` |
| `ArgumentUtility.checkSafeInteger({ arg })` | non-safe integers | `ArgumentError` |
| `ArgumentUtility.checkFunction({ arg })` | non-functions | `ArgumentTypeError` |

Pass a single-key object so the argument name appears automatically in error messages.

## Testing Guidelines

Each operator should cover:

- Empty source behavior
- Normal usage (single element, multiple elements)
- Edge cases (equal-length sequences, boundary indices, etc.)
- Re-iteration: enumerate the same sequence twice, assert identical results
- One test per error type for invalid arguments (null, undefined, out-of-range)

## Documentation Guidelines

See `.claude/DOCUMENTATION_GUIDELINES.md` for the full reference. Quick summary:

- **Public API** (`TyneqSequence` methods, exported types): full TSDoc with summary, `@remarks` execution phrase, `@throws` per argument.
- **Operator classes** (enumerator and terminal implementations): `@internal`, summary, execution phrase, `@group Operators`, `@category`.
- **ASCII only** - no Unicode arrows, em-dashes, or special characters in any comment or doc string.

## Code Conventions

- Error classes from `src/core/errors/` - never raw `Error`, `TypeError`, or `RangeError`.
- All members have explicit access modifiers (`public`, `protected`, `private`).
- Strings use double quotes (enforced by ESLint).
- Operator implementations are `@internal`.

## Bug Reports and Feature Requests

[github.com/chrisitopherus/tyneq/issues](https://github.com/chrisitopherus/tyneq/issues)
