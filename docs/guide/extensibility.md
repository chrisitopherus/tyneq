# Custom Operators

Tyneq has a first-class API for registering custom operators at runtime. Importing the registration file is the only setup required - the operator is immediately available on all sequences.

## Registration APIs

| API | Output | Use when |
|---|---|---|
| `createGeneratorOperator` | `TyneqSequence<T>` | Streaming operator expressible as a generator |
| `createOperator` | `TyneqSequence<T>` | Streaming/buffering with a custom enumerator factory |
| `createTerminalOperator` | Concrete value | Returns a scalar or collection, not a sequence |
| `@operator` decorator | `TyneqSequence<T>` | Class-based streaming/buffering (TS 5.0+ required) |
| `@terminal` decorator | Concrete value | Class-based terminal (TS 5.0+ required) |

---

## `createGeneratorOperator`

The simplest path for stateless, streaming transformations.

```ts
import { createGeneratorOperator } from "tyneq";

createGeneratorOperator({
  name: "repeatEach",
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

`validate` runs **eagerly at the call site** - before any lazy work begins. Argument errors are thrown immediately, not during iteration.

---

## `createTerminalOperator`

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
});

declare module "tyneq" {
  interface TyneqSequence<T> {
    joinString(separator: string): string;
  }
}

Tyneq.from([1, 2, 3]).joinString(", "); // "1, 2, 3"
```

---

## `createOperator`

Use when you need `Enumerable` access (for re-iteration) or a custom enumerator factory.

```ts
import { createOperator } from "tyneq";
import type { Enumerable, EnumeratorFactory } from "tyneq";

createOperator({
  name: "stride",
  factory(source: Enumerable<unknown>, step: number): EnumeratorFactory<unknown> {
    return {
      getEnumerator() {
        return strideGenerator(source[Symbol.iterator](), step) as any;
      },
    };
  },
  validate(step) {
    if (typeof step !== "number" || step < 1) throw new RangeError("step must be >= 1");
  },
});

function* strideGenerator<T>(iter: Iterator<T>, step: number): IterableIterator<T> {
  let index = 0;
  let result = iter.next();
  while (!result.done) {
    if (index % step === 0) yield result.value;
    result = iter.next();
    index++;
  }
}

declare module "tyneq" {
  interface TyneqSequence<T> {
    stride(step: number): TyneqSequence<T>;
  }
}
```

---

## Class-Based Operators (`@operator`)

Extend `TyneqEnumerator<TSource, TOut>` for operators with complex internal state. Requires TypeScript 5.0+ and TC39 decorators (`"experimentalDecorators": false`).

### Streaming

Override `handleNext()` to process elements one at a time:

```ts
import { operator, TyneqEnumerator } from "tyneq";
import type { Enumerator } from "tyneq";

@operator("everyOther")
class EveryOtherEnumerator<T> extends TyneqEnumerator<T, T> {
  private skip = false;

  protected override handleNext(): IteratorResult<T> {
    while (true) {
      const result = this.sourceEnumerator.next();
      if (result.done) return this.done();
      this.skip = !this.skip;
      if (this.skip) return this.yield(result.value);
    }
  }
}

declare module "tyneq" {
  interface TyneqSequence<T> {
    everyOther(): TyneqSequence<T>;
  }
}
```

`this.yield(value)` emits a value. `this.done()` marks the sequence as finished. Call `this.earlyComplete()` when stopping before the source is exhausted - it propagates `dispose()` upstream to release any held resources.

### Buffering

Pass `"buffer"` as the second argument to `@operator`. Override `initialize()` to fill an internal buffer before `handleNext()` is called:

```ts
@operator("cap", "buffer")
class CapEnumerator<T> extends TyneqEnumerator<T, T> {
  private buffer: T[] = [];
  private index = 0;

  protected override initialize(): void {
    let result = this.sourceEnumerator.next();
    while (!result.done) {
      this.buffer.push(result.value);
      result = this.sourceEnumerator.next();
    }
    // sort, deduplicate, etc. here
  }

  protected override handleNext(): IteratorResult<T> {
    if (this.index >= this.buffer.length) return this.done();
    return this.yield(this.buffer[this.index++]);
  }
}
```

### Completion Helpers

| Method | When to use |
|---|---|
| `this.done()` | Source is exhausted |
| `this.earlyComplete()` | Stopping before source is exhausted - releases upstream |
| `this.yield(value)` | Emit an element |

Always use `earlyComplete()` when the custom operator exits early (e.g. after emitting `n` elements). Using `done()` in this case leaks upstream resources.

---

## Validation Contract

`validate` (functional APIs) or the second argument to `@operator`/`@terminal` runs synchronously **before any lazy factory is created**. This means:

```ts
const query = Tyneq.from([1, 2, 3]).stride(-1);
// ↑ throws here, before any iteration
```

Do not put argument validation in a constructor or `handleNext()` - errors would be deferred until iteration begins.

---

## OperatorRegistry

All registration paths route through `OperatorRegistry`. Use it for introspection and test isolation.

```ts
import { OperatorRegistry } from "tyneq";

OperatorRegistry.list();                    // all registered operators
OperatorRegistry.listByKind("terminal");
OperatorRegistry.listBySource("internal");  // built-in operators
OperatorRegistry.listBySource("external");  // third-party operators
OperatorRegistry.has("myOp");
OperatorRegistry.get("select");             // OperatorMetadata
OperatorRegistry.count();
```

### Guards

Run synchronously before every registration. Throw to block:

```ts
const remove = OperatorRegistry.addGuard(entry => {
  if (entry.metadata.source === "external" && !entry.metadata.name.startsWith("mylib_")) {
    throw new Error("External operators must be prefixed with 'mylib_'");
  }
});

remove(); // detach
```

### Post-Registration Hooks

Observe-only. Cannot block registration.

```ts
const unsubscribe = OperatorRegistry.onRegister(entry => {
  console.log(`Registered: ${entry.metadata.name} (${entry.metadata.kind})`);
});

unsubscribe(); // detach
```

### Test Isolation

Remove an operator from the registry and prototype in `afterEach`:

```ts
import { OperatorRegistry, createGeneratorOperator } from "tyneq";
import { afterEach, it } from "vitest";

let registered: string | null = null;

afterEach(() => {
  if (registered) { OperatorRegistry.unregister(registered); registered = null; }
});

it("custom op", () => {
  registered = `testOp_${Date.now()}`;
  createGeneratorOperator({ name: registered, *generator(source) { yield* source as any; } });
  // ...
});
```

---

## Sharing as a Module

Register as a side-effect of import:

```ts
// my-extensions/sliding-percentile.ts
import { createGeneratorOperator } from "tyneq";

createGeneratorOperator({
  name: "slidingPercentile",
  *generator(source: Iterable<unknown>, windowSize: number, p: number): IterableIterator<unknown> {
    const buf: number[] = [];
    for (const val of source as Iterable<number>) {
      buf.push(val);
      if (buf.length > windowSize) buf.shift();
      const sorted = [...buf].sort((a, b) => a - b);
      yield sorted[Math.floor(p * (sorted.length - 1))];
    }
  },
  validate(windowSize, p) {
    if (windowSize < 1) throw new RangeError("windowSize must be >= 1");
    if (p < 0 || p > 1) throw new RangeError("p must be between 0 and 1");
  },
});

declare module "tyneq" {
  interface TyneqSequence<TSource> {
    slidingPercentile(windowSize: number, p: number): TyneqSequence<TSource>;
  }
}
```

Consumers import once - typically in an entry point:

```ts
import "my-extensions/sliding-percentile";

// available everywhere
Tyneq.from(readings).slidingPercentile(10, 0.9).toArray();
```
