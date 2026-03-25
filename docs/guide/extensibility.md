# Custom Operators

This page explains how to extend Tyneq with custom operators and how to use the `OperatorRegistry` for introspection and lifecycle management.

> **Query plan inspection** is covered separately — see [Query Plan Inspection](/guide/query-plan).

## What This Page Covers

| Section | What you will learn |
|---|---|
| [Registration APIs](#registration-apis) | The five registration paths and when to use each |
| [Validation Contract](#validation-contract) | How and when argument validation runs |
| [OperatorRegistry](#the-operatorregistry) | Introspect operators, add guards, observe registrations |
| [Custom Metadata](#custom-metadata) | Attaching domain-specific metadata to operators |
| [Packaging and Interop](#packaging-and-interop) | Sharing operators as modules; wrapping external iterables |

---

## Registration APIs

Tyneq exposes five registration paths. All route through `OperatorRegistry.register()` and patch the method onto every sequence instance at import time.

| API | Output | Use when |
|---|---|---|
| `createStreamingOperator` | `TyneqSequence<T>` | Streaming operator expressible as a generator function |
| `createOperator` | `TyneqSequence<T>` | Streaming or buffering operator with a custom enumerator factory |
| `createTerminalOperator` | A concrete value | Terminal — returns a scalar or collection, not a sequence |
| `@operator` decorator | `TyneqSequence<T>` | Class-based streaming/buffering (TypeScript 5.0+ required) |
| `@terminal` decorator | A concrete value | Class-based terminal (TypeScript 5.0+ required) |

Registration happens as a **side-effect of importing** the file. The operator is immediately available on all sequences; no further setup is needed.

---

### Streaming Operator — Generator Style

`createStreamingOperator` is the quickest path for stateless, streaming transformations.

```ts
import { createStreamingOperator } from "tyneq";

createStreamingOperator({
    name: "repeat",
    *generator(source: Iterable<unknown>, times: number): IterableIterator<unknown> {
        for (let i = 0; i < times; i++) {
            yield* source;
        }
    },
    validate(times) {
        if (typeof times !== "number" || times < 0) {
            throw new RangeError("repeat: times must be a non-negative integer");
        }
    },
});

// Augment the type so TypeScript knows about the new method
declare module "tyneq" {
    interface TyneqSequence<TSource> {
        repeat(times: number): TyneqSequence<TSource>;
    }
}
```

---

### Streaming Operator — Factory Style

Use `createOperator` when you need more control over the enumerator — for example, to maintain state between elements or to access the source as `Enumerable` rather than a plain `Iterable`.

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
        if (typeof step !== "number" || step < 1) {
            throw new RangeError("stride: step must be >= 1");
        }
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
    interface TyneqSequence<TSource> {
        stride(step: number): TyneqSequence<TSource>;
    }
}
```

---

### Terminal Operator

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
    interface TyneqSequence<TSource> {
        joinString(separator: string): string;
    }
}
```

```ts
Tyneq.from([1, 2, 3]).joinString(", ");
// → "1, 2, 3"
```

---

### Class-Based Operators

Use the `@operator` and `@terminal` decorators for operators with complex internal state. Requires TypeScript 5.0+ and `"experimentalDecorators": false` (TC39 decorators).

> **Deep dive:** [Building Custom Enumerators](/guide/custom-enumerators) walks through five operator patterns in detail — filter, early termination, type transform, buffer, and secondary resource — with the full lifecycle contract and common mistakes.

```ts
import { operator, TyneqEnumerator } from "tyneq";

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
    interface TyneqSequence<TSource> {
        everyOther(): TyneqSequence<TSource>;
    }
}
```

Buffer operators use `@operator("name", "buffer")` with `initialize()` to fill the internal buffer:

```ts
import { operator, TyneqEnumerator } from "tyneq";

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
        // e.g. sort in place here
    }

    protected override handleNext(): IteratorResult<T> {
        if (this.index >= this.buffer.length) return this.done();
        return this.yield(this.buffer[this.index++]);
    }
}
```

---

## Validation Contract

`validate` (or the second argument to `@operator`) runs **eagerly at the call site**, before any deferred factory is created. This means argument errors are thrown immediately when the user calls the method — not during iteration.

```ts
const query = Tyneq.from([1, 2, 3]).stride(-1);
// ↑ throws RangeError here, before any iteration
```

Keep validation runtime-defensive where needed. TypeScript infers argument types from the `factory`/`generator`/`execute` signature, so the `validate` body gets fully-typed parameters with no extra annotations.

---

## The OperatorRegistry

`OperatorRegistry` is the central registry for all operators. Use it for introspection, lifecycle hooks, and test isolation.

### Introspection

```ts
import { OperatorRegistry } from "tyneq";

// All registered operators
OperatorRegistry.list();
// → OperatorMetadata[]

// Filter by kind
OperatorRegistry.listByKind("terminal");

// Filter by source — distinguish built-in from third-party
OperatorRegistry.listBySource("internal");   // all built-in operators
OperatorRegistry.listBySource("external");   // all third-party operators

// Check if an operator exists
OperatorRegistry.has("myCustomOp");

// Get metadata for a specific operator
const meta = OperatorRegistry.get("select");
// → OperatorMetadata { name: "select", kind: "streaming", source: "internal", extensions: {} }

// Total count
OperatorRegistry.count();
```

### Registration Guards

A guard runs synchronously before every registration and may throw to block it. Use guards to enforce naming conventions or prevent duplicate registrations in a plugin system.

```ts
import { OperatorRegistry } from "tyneq";

const removeGuard = OperatorRegistry.addGuard(entry => {
    if (entry.metadata.source === "external" && !entry.metadata.name.startsWith("mylib_")) {
        throw new Error(`External operators must be prefixed with 'mylib_'`);
    }
});

// Later — remove the guard
removeGuard();
```

`addGuard` returns an unsubscribe function. Call it to detach the guard.

### Post-Registration Hooks

Hooks fire after each successful registration. They are observation-only — they cannot block registration.

```ts
import { OperatorRegistry } from "tyneq";

const unsubscribe = OperatorRegistry.onRegister(entry => {
    console.log(`Registered: ${entry.metadata.name} (${entry.metadata.kind})`);
});

// Later — detach the hook
unsubscribe();
```

### Test Isolation

`OperatorRegistry.unregister` removes an operator from the registry and from the prototype. Use it in `afterEach` to avoid prototype pollution across tests.

```ts
import { OperatorRegistry, createStreamingOperator } from "tyneq";
import { afterEach, it } from "vitest";

let registeredName: string | null = null;

afterEach(() => {
    if (registeredName) {
        OperatorRegistry.unregister(registeredName);
        registeredName = null;
    }
});

it("custom operator", () => {
    registeredName = `testOp_${Date.now()}`;
    createStreamingOperator({
        name: registeredName,
        *generator(source) { yield* source as any; },
    });
    // ...
});
```

---

## Custom Metadata

`OperatorMetadata` has an `extensions` bag — a `Readonly<Record<string, unknown>>` that lets third-party authors attach arbitrary metadata to their operators. Built-in operators have an empty `extensions` object.

To attach custom metadata, use `OperatorRegistry.register()` directly with a constructed `OperatorMetadata`:

```ts
import { OperatorRegistry, OperatorMetadata } from "tyneq";

// Register using OperatorMetadata.streaming() with a custom extensions bag
OperatorRegistry.register({
    metadata: OperatorMetadata.streaming("myOp", {
        mylib_version: "1.0.0",
        stable: true,
    }),
    impl(this: any, ...args: any[]) {
        // implementation
    },
});

// Read back
const meta = OperatorRegistry.get("myOp");
console.log(meta?.extensions.mylib_version); // "1.0.0"
console.log(meta?.extensions.stable);        // true
```

---

## Packaging and Interop

### Sharing as a Module

The idiomatic pattern for a reusable operator library is a dedicated file that registers as a side-effect of import:

```ts
// my-extensions/sliding-percentile.ts
import { createStreamingOperator } from "tyneq";

createStreamingOperator({
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
        if (typeof windowSize !== "number" || windowSize < 1) throw new RangeError("windowSize must be >= 1");
        if (typeof p !== "number" || p < 0 || p > 1) throw new RangeError("p must be between 0 and 1");
    },
});

declare module "tyneq" {
    interface TyneqSequence<TSource> {
        slidingPercentile(windowSize: number, p: number): TyneqSequence<TSource>;
    }
}
```

Consumers import the file once — typically in an application entry point:

```ts
// app entry point
import "my-extensions/sliding-percentile";

// anywhere in the codebase — the method is available
import { Tyneq } from "tyneq";

const p90 = Tyneq.from(readings).slidingPercentile(10, 0.9).toArray();
```

### Wrapping External Iterables

`Tyneq.from` accepts any `Iterable<T>`, so results from other libraries wrap naturally:

```ts
import { from as ixFrom } from "ix/iterable";
import { filter, map } from "ix/iterable/operators";
import { Tyneq } from "tyneq";

const ixResult = ixFrom([1, 2, 3, 4, 5]).pipe(
    filter(x => x % 2 === 0),
    map(x => x * 3),
);

// Hand off to Tyneq for relational operators or custom extensions
const result = Tyneq
    .from(ixResult)
    .orderByDescending(x => x)
    .toArray();
// → [12, 6]
```

---

## Related Pages

- [Building Custom Enumerators](/guide/custom-enumerators) — class-based operator patterns and the full enumerator lifecycle
- [Common Pitfalls](/guide/pitfalls) — lazy evaluation traps and resource leak patterns
- [Query Plan Inspection](/guide/query-plan)
- [Core Concepts](/guide/concepts)
- [Contributor Guide](/guide/contributing)
- [API Reference](/api/reference/)
