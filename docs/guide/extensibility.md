# Extensibility

Tyneq has a first-class API for registering custom operators at runtime. Importing the registration call is the only setup required - the operator is immediately available on all sequences.

## Registration APIs

| API | Output | Use when |
|---|---|---|
| `createGeneratorOperator` | `TyneqSequence<T>` | Streaming operator expressible as a generator |
| `createOperator` | `TyneqSequence<T>` | Streaming/buffering with a custom enumerator factory |
| `createTerminalOperator` | Concrete value | Returns a scalar or collection, not a sequence |
| `createOrderedOperator` | `TyneqOrderedSequence<T>` | Operator available only on ordered sequences |
| `createCachedOperator` | `TyneqCachedSequence<T>` | Operator available only on cached sequences |
| `@operator` decorator | `TyneqSequence<T>` | Class-based streaming/buffering (TypeScript 5.0+) |
| `@terminal` decorator | Concrete value | Class-based terminal (TypeScript 5.0+) |

---

## `createGeneratorOperator`

The simplest path for stateless, streaming transformations.

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

Tyneq.from([1, 2, 3]).joinString(", "); // -> "1, 2, 3"
```

---

## `createOperator`

Use when you need `Enumerable` access (for re-iteration) or a fully custom enumerator factory.

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
    if (typeof step !== "number" || step < 1) throw new RangeError("step must be >= 1");
  },
});

declare module "tyneq" {
  interface TyneqSequence<T> {
    stride(step: number): TyneqSequence<T>;
  }
}
```

---

## Class-Based Operators (`@operator`)

Extend `TyneqEnumerator<TSource, TOut>` for operators with complex internal state.

### Streaming

Override `handleNext()` to process elements one at a time:

```ts
import { operator, TyneqEnumerator } from "tyneq";
import type { Enumerator } from "tyneq";

@operator("everyOther", "streaming")
class EveryOtherEnumerator<T> extends TyneqEnumerator<T, T> {
  private skip = false;

  public constructor(source: Enumerator<T>) {
    super(source);
  }

  protected override handleNext(): IteratorResult<T> {
    while (true) {
      const result = this.sourceEnumerator.next();
      if (result.done) return result;
      this.skip = !this.skip;
      if (this.skip) return result;
    }
  }
}

declare module "tyneq" {
  interface TyneqSequence<T> {
    everyOther(): TyneqSequence<T>;
  }
}
```

### Buffering

Pass `"buffer"` as the category. Override `initialize()` to fill an internal buffer before `handleNext()` is called:

```ts
@operator("cap", "buffer")
class CapEnumerator<T> extends TyneqEnumerator<T, T> {
  private buffer: T[] = [];
  private index = 0;

  public constructor(source: Enumerator<T>) {
    super(source);
  }

  protected override initialize(): void {
    let result = this.sourceEnumerator.next();
    while (!result.done) {
      this.buffer.push(result.value);
      result = this.sourceEnumerator.next();
    }
  }

  protected override handleNext(): IteratorResult<T> {
    if (this.index >= this.buffer.length) return { done: true, value: undefined };
    return { done: false, value: this.buffer[this.index++] };
  }
}
```

---

## Class-Based Terminals (`@terminal`)

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

---

## Validation Contract

`validate` (functional APIs) or the third argument to `@operator`/`@terminal` runs synchronously **before any lazy factory is created**:

```ts
const query = Tyneq.from([1, 2, 3]).stride(-1);
// throws here, before any iteration
```

Do not put argument validation in a constructor or `handleNext()` - errors would be deferred until iteration begins.

---

## Module Augmentation

The `declare module "tyneq"` block adds the operator to the TypeScript type system. Without it, TypeScript will not know the method exists. Place it in the same file as the registration call:

```ts
declare module "tyneq" {
  interface TyneqSequence<T> {
    myOp(arg: string): TyneqSequence<T>;
  }
}
```

---

## OperatorRegistry

All registration paths route through `OperatorRegistry`. Use it for introspection and test isolation.

```ts
import { OperatorRegistry } from "tyneq";

OperatorRegistry.list();                    // all registered operators
OperatorRegistry.listByKind("terminal");    // only terminals
OperatorRegistry.listBySource("internal");  // built-in operators
OperatorRegistry.listBySource("external");  // plugin operators
OperatorRegistry.has("myOp");
OperatorRegistry.get("select");             // OperatorEntry | undefined
OperatorRegistry.count();
```

### Guards

Run synchronously before every external registration. Throw to block:

```ts
const remove = OperatorRegistry.addGuard(entry => {
  if (entry.metadata.source === "external" && !entry.metadata.name.startsWith("mylib_")) {
    throw new Error("External operators must be prefixed with 'mylib_'");
  }
});

remove(); // detach the guard
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

Remove a plugin operator in `afterEach` to avoid cross-test contamination:

```ts
import { OperatorRegistry, createGeneratorOperator } from "tyneq";
import { afterEach, it } from "vitest";

let registered: string | null = null;

afterEach(() => {
  if (registered) { OperatorRegistry.unregister(registered); registered = null; }
});

it("custom op works", () => {
  registered = `testOp_${Date.now()}`;
  createGeneratorOperator({
    name: registered,
    category: "streaming",
    *generator(source) { yield* source as any; }
  });
  // ...
});
```

---

## Sharing as a Module

Register as a side-effect of import so consumers do not have to call anything:

```ts
// my-lib/sliding-percentile.ts
import { createGeneratorOperator } from "tyneq";

createGeneratorOperator({
  name: "slidingPercentile",
  category: "streaming",
  *generator(source: Iterable<unknown>, windowSize: number, p: number) {
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

Consumer:

```ts
import "my-lib/sliding-percentile"; // once, typically in entry point

Tyneq.from(readings).slidingPercentile(10, 0.9).toArray();
```
