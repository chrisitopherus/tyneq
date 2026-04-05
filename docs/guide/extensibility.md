# Custom Operators

Tyneq has a first-class plugin system. You can add custom operators that appear on every sequence at import time, behave exactly like built-ins, and show up in query plans. No forking required.

There are two styles: **functional** and **class-based (decorators)**. This guide explains both, when to use each, and how to wire everything together.

---

## Why extend Tyneq?

The built-in operators cover most use cases, but custom operators let you:

- **Encapsulate domain logic** as a reusable pipeline step (`smoothSeries`, `clampToRange`, `parseLogLine`)
- **Distribute shared behavior** as a package others import once
- **Add type-specific operators** for ordered or cached sequences
- **Control execution precisely** for stateful or multi-source operators

Custom operators are real citizens: they are registered in `OperatorRegistry`, participate in query plans, and can be compiled by `QueryPlanCompiler`.

---

## Choosing an approach

| You want to... | Use |
|---|---|
| Simple streaming transform, stateless | `createGeneratorOperator` |
| Streaming transform with complex cursor state | `createOperator` with a custom factory |
| Buffering operator (needs full source) | `createOperator` with `"buffer"` category |
| Terminal operator (returns a value) | `createTerminalOperator` |
| Class-based operator with lifecycle hooks | `@operator` + `TyneqEnumerator` |
| Class-based terminal | `@terminal` + `TyneqTerminalOperator` |
| Operator only on ordered sequences | `createOrderedOperator` / `@orderedOperator` |
| Operator only on cached sequences | `createCachedOperator` / `@cachedOperator` |

---

## Functional API

### `createGeneratorOperator`

The simplest path. Use a generator function to define streaming behavior. No class, no boilerplate.

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
// -> [1, 1, 2, 2, 3, 3]
```

The `validate` callback runs **eagerly at the call site**, before any lazy factory is created:

```ts
Tyneq.from([1, 2, 3]).repeatEach(-1);
// throws RangeError here - before any iteration begins
```

This is important: do not put argument validation in the generator body. Errors in there are deferred until iteration, which is confusing.

---

### `createTerminalOperator`

For operators that return a scalar value instead of a sequence.

```ts
import { createTerminalOperator } from "tyneq";
import type { Enumerable } from "tyneq";

createTerminalOperator({
  name: "joinString",
  execute(source: Enumerable<unknown>, separator: string): string {
    const parts: string[] = [];
    for (const item of source) parts.push(String(item));
    return parts.join(separator);
  },
  validate(separator) {
    if (typeof separator !== "string") throw new TypeError("separator must be a string");
  },
});

declare module "tyneq" {
  interface TyneqSequence<T> {
    joinString(separator: string): string;
  }
}

Tyneq.from([1, 2, 3]).joinString(", "); // -> "1, 2, 3"
```

Note the `source` parameter is `Enumerable<unknown>`, not `Iterable`. This gives you `getEnumerator()` for structured traversal if needed, and also `[Symbol.iterator]` for plain `for...of`.

---

### `createOperator`

Use when you need full control over the enumeration cursor - for example, non-trivial state machines, multi-source operators, or buffering behavior.

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
          }
        };
      }
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

Tyneq.range(0, 10).stride(3).toArray(); // -> [0, 3, 6, 9]
```

Why `factory` instead of a generator? Because `factory` receives an `Enumerable` (re-iterable) rather than an iterator. Each call to `getEnumerator()` can start a fresh traversal - which is what makes the sequence re-iterable.

---

### Specialized variants

For operators that should only appear on ordered or cached sequences:

```ts
import { createOrderedOperator, createCachedOperator } from "tyneq";

// Only callable on the result of orderBy/orderByDescending
createOrderedOperator({ name: "myOrderedOp", ... });

// Only callable on the result of memoize()
createCachedOperator({ name: "myCachedOp", ... });

// Terminal variants
import { createOrderedTerminalOperator, createCachedTerminalOperator } from "tyneq";
```

TypeScript enforces this at compile time - the method only appears on `TyneqOrderedSequence` or `TyneqCachedSequence`.

---

## Decorator API (class-based)

Decorators are the right choice when your operator has non-trivial state, needs a lifecycle (`initialize`), or when you want reusable enumerator classes (e.g. multiple operators sharing a base).

### Why decorators?

- **Explicit lifecycle:** streaming operators have `handleNext()`, buffering operators add `initialize()`. The base class calls them in the right order.
- **Encapsulated state:** private fields in the class, not captured variables in closures.
- **Inheritance:** share logic across multiple operators via class hierarchy.
- **Consistent with built-ins:** all internal operators use this pattern.

### Streaming operator with `@operator`

Extend `TyneqEnumerator<TSource, TOut>` and override `handleNext()`:

```ts
import { operator, TyneqEnumerator } from "tyneq";
import type { Enumerator } from "tyneq";

@operator("everyOther", "streaming")
class EveryOtherEnumerator<T> extends TyneqEnumerator<T, T> {
  private emit = false;

  public constructor(source: Enumerator<T>) {
    super(source);
    // Only validate infrastructure here (source is null, etc.)
    // Never validate user arguments in the constructor
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

Tyneq.from([1, 2, 3, 4, 5]).everyOther().toArray(); // -> [1, 3, 5]
```

The `@operator("everyOther", "streaming")` decorator registers the class, patches the method onto all sequences, and sets up the query plan node automatically.

### Adding argument validation to a decorator operator

Pass a validation function as the third argument:

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

The validate function runs at the call site - before the class is even instantiated.

### Buffering operator with `@operator`

Pass `"buffer"` as the category. Override `initialize()` to read the full source before `handleNext()` is called. The framework guarantees `initialize()` runs once before the first `handleNext()`.

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
    if (this.index >= this.items.length) return { done: true, value: undefined };
    const chunk = this.items.slice(this.index, this.index + this.size);
    this.index += this.size;
    return { done: false, value: chunk };
  }
}
```

### Early completion

If your operator stops consuming the source before it is exhausted (like `take`), call `this.earlyComplete()` before returning `{ done: true }`. This propagates `return()` to the source enumerator, releasing upstream resources correctly.

```ts
protected override handleNext(): IteratorResult<T> {
  if (this.emitted >= this.limit) {
    this.earlyComplete(); // release the upstream cursor
    return { done: true, value: undefined };
  }
  // ...
}
```

Returning `{ done: true }` without `earlyComplete()` marks the enumerator finished but leaks the upstream.

---

### Class-based terminal with `@terminal`

Extend `TyneqTerminalOperator<TSource, TResult>` and implement `process()`:

```ts
import { terminal, TyneqTerminalOperator } from "tyneq";
import type { Enumerable } from "tyneq";

@terminal("product")
class ProductOperator extends TyneqTerminalOperator<number, number> {
  public constructor(source: Enumerable<number>) {
    super(source);
  }

  public process(): number {
    let result = 1;
    for (const item of this.source) result *= item;
    return result;
  }
}

declare module "tyneq" {
  interface TyneqSequence<T> {
    product(): number;
  }
}

Tyneq.from([1, 2, 3, 4]).product(); // -> 24
```

Add validation as the second argument to `@terminal`:

```ts
@terminal("nth", (n: number) => {
  if (!Number.isInteger(n) || n < 0) throw new RangeError("n must be a non-negative integer");
})
class NthOperator<T> extends TyneqTerminalOperator<T, T | undefined> {
  public constructor(source: Enumerable<T>, private readonly n: number) {
    super(source);
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

Every custom operator needs a `declare module "tyneq"` block to make TypeScript aware of the new method. Without it, TypeScript will not know the method exists and will give a type error at the call site.

Place the augmentation in the same file as the registration:

```ts
// my-ops/repeatEach.ts
import { createGeneratorOperator } from "tyneq";

createGeneratorOperator({ name: "repeatEach", ... });

declare module "tyneq" {
  interface TyneqSequence<T> {
    repeatEach(times: number): TyneqSequence<T>;
  }
}
```

For ordered/cached variants, augment the appropriate interface:

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

Register as a side effect of import. Consumers import once - usually in their app entry point - and every sequence gains the operator.

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
// ...
```

Consumer:

```ts
import "@my-org/tyneq-plugin-analytics"; // once, in app entry point

Tyneq.from(readings).mylib_slidingAverage(10).toArray();
```

**Naming convention:** prefix all operator names with a library identifier to avoid conflicts with built-ins or other plugins. Use `OperatorRegistry.addGuard` in tests to enforce this.

---

## Validation contract

The validation timing rules apply to all registration APIs:

| Where | When it runs |
|---|---|
| `validate` in functional APIs | Eagerly at the call site, before the lazy factory is created |
| Third argument to `@operator`/`@terminal` | Eagerly at the call site |
| Enumerator constructor | At iteration time (do NOT put argument validation here) |
| `handleNext()` | At iteration time (do NOT put argument validation here) |

```ts
// This throws immediately - at the call site
const query = Tyneq.from([1, 2, 3]).stride(-1);

// This would be wrong: error deferred until someone calls toArray()
// @operator("stride", "streaming")
// class StrideEnumerator extends TyneqEnumerator<T, T> {
//   constructor(source, step) {
//     if (step < 1) throw ...; // <-- deferred! bad!
//   }
// }
```

---

## Next steps

- [Plugin Internals](./plugin-internals.md) - the registry, custom enumerator architecture, utility helpers, and how registration works internally
- [Best Practices & Pitfalls](./best-practices.md) - naming, test isolation, packaging patterns
