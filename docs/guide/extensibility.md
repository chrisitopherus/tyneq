# Custom Operators

Tyneq has a first-class plugin system. You can add custom operators that appear on every sequence at import time, behave exactly like built-ins, and show up in query plans. No forking, no monkey-patching - just register and go.

There are two styles: **functional** (quick, minimal boilerplate) and **class-based** (decorators with full lifecycle control). This guide covers both in depth, with real examples you can copy and adapt.

---

## When to write a custom operator

The built-in operators handle most situations. Custom operators make sense when you want to:

- **Encapsulate domain logic** as a reusable pipeline step (`smoothSeries`, `clampToRange`, `parseLogLine`)
- **Distribute shared behavior** as a package others import once
- **Add type-specific operators** for ordered or cached sequences
- **Control execution precisely** - stateful cursors, multi-source operators, custom buffering strategies

Custom operators are full citizens: they live in `OperatorRegistry`, participate in query plans, and compile with `QueryPlanCompiler`.

---

## Choosing an approach

| You want to... | Use |
|---|---|
| Simple streaming transform, no state | `createGeneratorOperator` |
| Streaming transform with complex cursor state | `@operator` + `TyneqEnumerator`, or `createOperator` with a custom factory |
| Buffering operator (needs full source) | `@operator` with `"buffer"` category, or `createOperator` |
| Terminal operator (returns a value) | `createTerminalOperator` or `@terminal` + `TyneqTerminalOperator` |
| Operator only on ordered sequences | `createOrderedOperator` / `@orderedOperator` |
| Operator only on cached sequences | `createCachedOperator` / `@cachedOperator` |

If you are not sure, start with the functional API. If you outgrow it, switching to a decorator is straightforward.

---

## Functional API

### `createGeneratorOperator`

The simplest way to add a streaming operator. Write a generator function - Tyneq handles the rest.

```ts
import { createGeneratorOperator } from "tyneq";

createGeneratorOperator({
  name: "repeatEach",
  category: "streaming",
  *generator(source: Iterable<unknown>, times: number) {
    for (const item of source) {
      for (let i = 0; i < times; i++) yield item;
    }
  },
  validate(times) {
    if (times < 1) throw new RangeError("times must be >= 1");
  },
});

declare module "tyneq" {
  interface TyneqSequence<T> {
    repeatEach(times: number): TyneqSequence<T>;
  }
}

Tyneq.from([1, 2, 3]).repeatEach(2).toArray();
// [1, 1, 2, 2, 3, 3]
```

A few things to notice:

- **`source` is `Iterable<unknown>`** - the generator receives the upstream as a plain iterable. Use `for...of` to consume it.
- **`validate` runs eagerly** at the call site, before any lazy factory is created. Errors surface immediately, not during iteration.
- **`declare module "tyneq"`** makes TypeScript aware of the new method. Without it, the method exists at runtime but TypeScript does not know about it.

::: warning Validate at the call site
Do not put argument validation inside the generator body. Errors thrown inside a generator are deferred until iteration - the user gets a confusing stack trace pointing at `toArray()` instead of the call that passed bad arguments.
:::

```ts
// validate runs here - before any iteration
Tyneq.from([1, 2, 3]).repeatEach(-1);
// -> RangeError: times must be >= 1
```

---

### `createTerminalOperator`

For operators that consume the sequence and return a scalar value.

```ts
import { createTerminalOperator } from "tyneq";
import type { Enumerable } from "tyneq";

createTerminalOperator({
  name: "product",
  execute(source: Enumerable<number>, initial: number = 1): number {
    let result = initial;
    for (const item of source) result *= item;
    return result;
  },
  validate(initial) {
    if (initial !== undefined && typeof initial !== "number") {
      throw new TypeError("initial must be a number");
    }
  },
});

declare module "tyneq" {
  interface TyneqSequence<T> {
    product(initial?: number): number;
  }
}

Tyneq.from([2, 3, 4]).product();     // 24
Tyneq.from([2, 3, 4]).product(10);   // 240
```

The `execute` function receives the source as an `Enumerable` (re-iterable). Iterate it with `for...of` - whichever fits your logic.

---

### `createOperator`

Use when you need full control over the enumeration cursor - non-trivial state machines, multi-source operators, or custom buffering.

```ts
import { createOperator } from "tyneq";
import type { Enumerable, Enumerator, EnumeratorFactory } from "tyneq";

createOperator({
  name: "stride",
  category: "streaming",
  factory(source: Enumerable<unknown>, step: number): EnumeratorFactory<unknown> {
    return {
      getEnumerator(): Enumerator<unknown> {
        let index = 0;
        const iter = source[Symbol.iterator]();
        return {
          next() {
            while (true) {
              const r = iter.next();
              if (r.done) return r;
              if (index++ % step === 0) return r;
            }
          },
        };
      },
    };
  },
  validate(step) {
    if (step < 1) throw new RangeError("step must be >= 1");
  },
});

declare module "tyneq" {
  interface TyneqSequence<T> {
    stride(step: number): TyneqSequence<T>;
  }
}

Tyneq.range(0, 10).stride(3).toArray(); // [0, 3, 6, 9]
```

Why `factory` instead of a generator? Because `factory` receives an `Enumerable` (re-iterable) rather than an iterator. Each call to `getEnumerator()` starts a fresh traversal, which is what makes the resulting sequence re-iterable.

---

### Specialized variants

For operators that should only appear on ordered or cached sequences:

```ts
import { createOrderedOperator, createCachedOperator } from "tyneq";

// Only callable on the result of orderBy / orderByDescending
createOrderedOperator({ name: "myOrderedOp", /* ... */ });

// Only callable on the result of memoize()
createCachedOperator({ name: "myCachedOp", /* ... */ });

// Terminal variants
import { createOrderedTerminalOperator, createCachedTerminalOperator } from "tyneq";
```

TypeScript enforces this at compile time - the method only shows up on `TyneqOrderedSequence` or `TyneqCachedSequence`.

---

## Decorator API (class-based)

Decorators are the right choice when your operator has:

- **Non-trivial state** - private fields in a class are cleaner than captured variables in closures
- **A lifecycle** - streaming operators have `handleNext()`, buffering operators add `initialize()`, and the base class calls them in the right order
- **Shared logic** - inherit from a common base to share behavior across multiple operators
- **Consistency with built-ins** - all internal Tyneq operators use this pattern

The signature is `@operator(name, category, validate?)`. `category` is required and must be `"streaming"` or `"buffer"`. It is not just metadata - it determines how the `QueryPlanOptimizer` classifies and fuses nodes, and it controls the `category` field on each `QueryPlanNode` produced by your operator.

### Streaming operator with `@operator`

Extend `TyneqEnumerator<TInput, TOutput>` and override `handleNext()`. The decorator registers the class, patches the method onto all sequences, and wires up the query plan node.

```ts
import { operator, TyneqEnumerator } from "tyneq";
import type { Enumerator } from "tyneq";

@operator("everyOther", "streaming")
class EveryOtherEnumerator<T> extends TyneqEnumerator<T, T> {
  private emit = false;

  public constructor(source: Enumerator<T>) {
    super(source);
  }

  protected override handleNext(): IteratorResult<T> {
    while (true) {
      const next = this.sourceEnumerator.next();
      if (next.done) return next;
      this.emit = !this.emit;
      if (this.emit) return next;
    }
  }
}

declare module "tyneq" {
  interface TyneqSequence<T> {
    everyOther(): TyneqSequence<T>;
  }
}

Tyneq.from([1, 2, 3, 4, 5]).everyOther().toArray(); // [1, 3, 5]
```

Let's break down what `handleNext()` does:

1. Pull the next element from upstream with `this.sourceEnumerator.next()`
2. If the source is exhausted (`done: true`), return that - your operator is done too
3. Otherwise, decide whether to yield the element or skip it and pull again
4. Return `{ done: false, value }` to yield, or loop to skip

The base class (`TyneqEnumerator`) handles the state machine for you: it calls `initialize()` once before the first `handleNext()`, tracks completion, and disposes the source enumerator when done.

### The enumerator lifecycle

Every enumerator built on `TyneqBaseEnumerator` follows this lifecycle:

```
Created -> [initialize()] -> Running -> [earlyComplete() or source exhausted] -> Done
```

| Phase | What happens | When to override |
|---|---|---|
| **Created** | Constructor has run. `initialize()` has not been called yet. | Always - set up fields. |
| **`initialize()`** | Called once, before the first `handleNext()`. | For buffering operators: read the full source here. For streaming: setup work if needed. |
| **`handleNext()`** | Called for each element requested. | Always - this is where your operator logic lives. |
| **Done** | Either `handleNext()` returned `{ done: true }` or `earlyComplete()` was called. | No more calls to `handleNext()`. |

Helper methods available inside `handleNext()`:

| Method | What it does |
|---|---|
| `this.yield(value)` | Shorthand for `{ done: false, value }` |
| `this.done()` | Shorthand for `{ done: true, value: undefined }` |
| `this.earlyComplete()` | Disposes the source and marks this enumerator as done. Call this when you stop consuming before the source is exhausted (like `take`). |

### Adding argument validation

Pass a validation function as the third argument to `@operator`:

```ts
@operator("takeEvery", "streaming", (step: number) => {
  if (step < 1) throw new RangeError("step must be >= 1");
})
class TakeEveryEnumerator<T> extends TyneqEnumerator<T, T> {
  private counter = 0;

  public constructor(source: Enumerator<T>, private readonly step: number) {
    super(source);
  }

  protected override handleNext(): IteratorResult<T> {
    while (true) {
      const next = this.sourceEnumerator.next();
      if (next.done) return next;
      if (++this.counter % this.step === 0) return next;
    }
  }
}
```

The validate function runs **at the call site** - before the class is even instantiated. This is a core design rule: argument errors surface immediately, never during deferred iteration.

### Buffering operator with `@operator`

Pass `"buffer"` as the category. Override `initialize()` to read the full source into an internal buffer before `handleNext()` is called. The framework guarantees `initialize()` runs once before the first `handleNext()`.

```ts
@operator("stableChunk", "buffer")
class StableChunkEnumerator<T> extends TyneqEnumerator<T, T[]> {
  private readonly items: T[] = [];
  private index = 0;

  public constructor(source: Enumerator<T>, private readonly size: number) {
    super(source);
  }

  protected override initialize(): void {
    // Read the entire source into this.items
    let next = this.sourceEnumerator.next();
    while (!next.done) {
      this.items.push(next.value);
      next = this.sourceEnumerator.next();
    }
  }

  protected override handleNext(): IteratorResult<T[]> {
    if (this.index >= this.items.length) return this.done();
    const chunk = this.items.slice(this.index, this.index + this.size);
    this.index += this.size;
    return this.yield(chunk);
  }
}
```

The pattern is always the same for buffering operators:
1. `initialize()` - drain the source into a local data structure
2. `handleNext()` - serve from that data structure

### Early completion

If your operator stops consuming the source before it is exhausted (like `take`), call `this.earlyComplete()` before returning done. This propagates `return()` to the source enumerator, releasing upstream resources.

```ts
protected override handleNext(): IteratorResult<T> {
  if (this.emitted >= this.limit) {
    this.earlyComplete(); // release the upstream cursor
    return this.done();
  }

  const next = this.sourceEnumerator.next();
  if (next.done) return this.done();

  this.emitted++;
  return this.yield(next.value);
}
```

Returning `{ done: true }` without `earlyComplete()` marks your enumerator as finished but leaks the upstream enumerator.

### Disposal hooks

If your operator holds additional resources beyond the source enumerator (file handles, timers, secondary iterators), release them in `disposeAdditional()`:

```ts
protected override disposeAdditional(): void {
  this.secondaryIterator?.return?.();
  this.buffer.length = 0;
}
```

The base class calls `disposeSource()` first (which releases the upstream enumerator), then `disposeAdditional()`. Both are called automatically when the enumerator completes normally or is disposed early via `return()`.

---

### Class-based terminal with `@terminal`

Extend `TyneqTerminalOperator<TSource, TResult>` and implement `process()`:

```ts
import { terminal, TyneqTerminalOperator } from "tyneq";
import type { Enumerable } from "tyneq";

@terminal("product")
class ProductOperator extends TyneqTerminalOperator<number, number> {
  private readonly initial: number;

  public constructor(source: Enumerable<number>, initial: number = 1) {
    super(source);
    this.initial = initial;
  }

  public process(): number {
    let result = this.initial;
    for (const item of this.source) result *= item;
    return result;
  }
}

declare module "tyneq" {
  interface TyneqSequence<T> {
    product(initial?: number): number;
  }
}

Tyneq.from([1, 2, 3, 4]).product(); // 24
```

The terminal receives the source as `this.source` (an `Enumerable`). Iterate it with `for...of`.

Add validation as the second argument:

```ts
@terminal("nth", (n: number) => {
  if (!Number.isInteger(n) || n < 0) throw new RangeError("n must be a non-negative integer");
})
class NthOperator<T> extends TyneqTerminalOperator<T, T | undefined> {
  private readonly n: number;

  public constructor(source: Enumerable<T>, n: number) {
    super(source);
    this.n = n;
  }

  public process(): T | undefined {
    let i = 0;
    for (const item of this.source) {
      if (i++ === this.n) return item;
    }
    return undefined;
  }
}
```

---

## Module augmentation

Every custom operator needs a `declare module "tyneq"` block so TypeScript knows the method exists. Without it, the operator works at runtime but the compiler reports an error at the call site.

Place the augmentation in the same file as the registration:

```ts
// my-ops/repeatEach.ts
import { createGeneratorOperator } from "tyneq";

createGeneratorOperator({ name: "repeatEach", /* ... */ });

declare module "tyneq" {
  interface TyneqSequence<T> {
    repeatEach(times: number): TyneqSequence<T>;
  }
}
```

For ordered/cached variants, augment the matching interface:

```ts
declare module "tyneq" {
  interface TyneqOrderedSequence<T> {
    myOrderedOp(): TyneqSequence<T>;
  }

  interface TyneqCachedSequence<T> {
    myCachedOp(): TyneqSequence<T>;
  }
}
```

---

## Sharing operators as a package

Registration happens as a side effect of import. Consumers import your package once - usually in their app entry point - and every sequence gains the operators.

```ts
// my-lib/src/operators/slidingAverage.ts
import { createGeneratorOperator } from "tyneq";

createGeneratorOperator({
  name: "mylib_slidingAverage",
  category: "streaming",
  *generator(source: Iterable<unknown>, windowSize: number) {
    const buffer: number[] = [];
    for (const item of source as Iterable<number>) {
      buffer.push(item);
      if (buffer.length > windowSize) buffer.shift();
      yield buffer.reduce((a, b) => a + b, 0) / buffer.length;
    }
  },
  validate(windowSize) {
    if (windowSize < 1) throw new RangeError("windowSize must be >= 1");
  },
});

declare module "tyneq" {
  interface TyneqSequence<T> {
    mylib_slidingAverage(windowSize: number): TyneqSequence<T>;
  }
}
```

```ts
// my-lib/src/index.ts
export * from "./operators/slidingAverage";
export * from "./operators/slidingPercentile";
```

Consumer:

```ts
import "@my-org/tyneq-plugin-analytics"; // once, in app entry point

Tyneq.from(readings).mylib_slidingAverage(10).toArray();
```

**Naming convention:** prefix all operator names with a library identifier to avoid conflicts with built-ins or other plugins. Use `OperatorRegistry.addGuard` to enforce this in tests.

---

## Validation contract

The timing rules apply everywhere, no exceptions:

| Where | When it runs |
|---|---|
| `validate` in functional APIs | Eagerly at the call site |
| Third argument to `@operator` / `@terminal` | Eagerly at the call site |
| Enumerator constructor | At iteration time - do **not** put argument validation here |
| `handleNext()` | At iteration time - do **not** put argument validation here |

This is a deliberate design choice. Argument errors should surface at the point where the user wrote the bad call, with a clean stack trace pointing right at the problem. Deferring them to iteration time produces confusing errors that point at `toArray()` or a `for...of` loop instead.

```ts
// throws immediately - stack trace points at the call site
const query = Tyneq.from([1, 2, 3]).stride(-1);

// this would be wrong: error deferred until iteration
// constructor(source, step) {
//   if (step < 1) throw ...; // <-- deferred! confusing!
// }
```

For complex validation involving multiple arguments, use `ValidationBuilder`:

```ts
import { ValidationBuilder, ArgumentUtility } from "tyneq";

validate(windowSize: number, overlap: number) {
  new ValidationBuilder()
    .check(() => ArgumentUtility.checkPositive({ windowSize }))
    .check(() => ArgumentUtility.checkNonNegative({ overlap }))
    .check(() => {
      if (overlap >= windowSize) {
        throw new RangeError("overlap must be less than windowSize");
      }
    })
    .throwIfAny(); // throws a single ValidationError with all messages
}
```

---

## Choosing the right enumerator base class

There are four base classes. Which one you extend depends on the operator's context:

| Base class | Source type | Use when |
|---|---|---|
| `TyneqEnumerator<TInput, TOutput>` | `Enumerator<TInput>` | Operator on any sequence (`@operator`) |
| `TyneqOrderedEnumerator<TSource>` | `OrderedEnumerable<TSource>` | Operator only on ordered sequences (`@orderedOperator`) |
| `TyneqCachedEnumerator<TSource>` | `CachedEnumerable<TSource>` | Operator only on cached sequences (`@cachedOperator`) |
| `TyneqBaseEnumerator<TOutput>` | (none - bring your own) | Enumerator with no upstream, or fully custom source wiring |

**`TyneqEnumerator`** is the standard choice. It holds the upstream as `this.sourceEnumerator` and disposes it automatically.

**`TyneqOrderedEnumerator`** and **`TyneqCachedEnumerator`** receive the full sequence object (not just an enumerator) as `this.orderedSource` or `this.cachedSource`. This is necessary because ordered and cached sequences manage their own lifecycle - the enumerator must not dispose them. It also gives access to sequence-level properties like the sort key chain.

**`TyneqBaseEnumerator`** is the raw foundation. Use it when you need total control - for example, an enumerator that generates values without a source, or one that holds multiple heterogeneous sources. You are responsible for disposal.

---

## Putting it all together: a real-world example

Here is a complete, non-trivial example - a `deltaMap` operator that emits the difference between consecutive elements, with an optional transform applied to each delta:

```ts
import { operator, TyneqEnumerator, ArgumentUtility } from "tyneq";
import type { Enumerator } from "tyneq";

@operator<[transform: (delta: number) => number]>(
  "deltaMap",
  "streaming",
  (transform) => {
    ArgumentUtility.checkNotOptional({ transform });
  }
)
class DeltaMapEnumerator<T extends number> extends TyneqEnumerator<T, number> {
  private prev: T | undefined = undefined;
  private readonly transform: (delta: number) => number;

  public constructor(source: Enumerator<T>, transform: (delta: number) => number) {
    super(source);
    this.transform = transform;
  }

  protected override handleNext(): IteratorResult<number> {
    while (true) {
      const next = this.sourceEnumerator.next();
      if (next.done) return this.done();
      if (this.prev === undefined) {
        this.prev = next.value;
        continue; // skip the first element - no previous to diff against
      }
      const delta = next.value - this.prev;
      this.prev = next.value;
      return this.yield(this.transform(delta));
    }
  }
}

declare module "tyneq" {
  interface TyneqSequence<T> {
    deltaMap(transform: (delta: number) => number): TyneqSequence<number>;
  }
}
```

Usage:

```ts
Tyneq.from([10, 13, 9, 14]).deltaMap(d => d).toArray();
// [3, -4, 5]  (13-10, 9-13, 14-9)

// Apply a transform to normalize deltas
Tyneq.from([10, 13, 9, 14]).deltaMap(d => Math.abs(d)).toArray();
// [3, 4, 5]

// Empty or single-element source produces no output
Tyneq.from([42]).deltaMap(d => d).toArray();
// []
```

What this demonstrates:
- Argument validation with `ArgumentUtility` in the validate callback
- Internal state across calls (`prev`) via a class field
- Streaming behavior - O(1) memory, one element at a time
- Skipping the first element without exiting (using `continue` rather than early return)
- Correct handling of edge cases (single element, empty source)

---

## Next steps

- [Plugin Internals](./plugin-internals.md) - the registry, custom sequence types, bridge methods, and how registration works under the hood
- [Best Practices & Pitfalls](./best-practices.md) - naming, test isolation, packaging patterns
