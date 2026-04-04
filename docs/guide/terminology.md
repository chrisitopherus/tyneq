# Terminology

This page defines the types and concepts used throughout the Tyneq source code and documentation.

## Type Hierarchy

```
Iterable<T>          <-- native JavaScript protocol
  └── Enumerable<T>  <-- Tyneq's re-iterable contract
        └── TyneqSequence<T>  <-- the public fluent API (what you work with)

Iterator<T>          <-- native JavaScript protocol
  └── Enumerator<T>  <-- Tyneq's single-pass cursor
```

---

## `TyneqSequence<T>`

The type returned by every Tyneq operator method and factory. This is the interface you interact with directly.

```ts
import { Tyneq } from "tyneq";

const seq: TyneqSequence<number> = Tyneq.range(1, 5);
//                    ^ every operator returns this
```

`TyneqSequence<T>` extends `Enumerable<T>` and carries all operator methods (`where`, `select`, `toArray`, etc.) plus the `[tyneqQueryNode]` query plan symbol.

---

## `Enumerable<T>`

The re-iterable contract. An `Enumerable<T>` can produce an independent `Enumerator<T>` on demand via `getEnumerator()` or `[Symbol.iterator]()`. Each call starts from the beginning with no shared mutable state.

```ts
import type { Enumerable } from "tyneq";

// Appears in custom operator signatures - e.g. createOperator factory:
factory(source: Enumerable<unknown>, step: number): EnumeratorFactory<unknown>
//             ^ Enumerable, not Enumerator - so the factory can re-iterate the source
```

`Enumerable<T>` extends both `Iterable<T>` (native JS) and `EnumeratorFactory<T>`.

---

## `Enumerator<T>`

A single, stateful, forward-only cursor over a sequence - one active enumeration in progress. Extends the native `Iterator<T>` protocol with two additions:

- `return()` - terminates the cursor early and releases resources (idempotent)
- `throw()` - not supported; throws `NotSupportedError` if called

```ts
import type { Enumerator } from "tyneq";

// Appears in class-based operator constructors and handleNext():
constructor(source: Enumerator<T>) { ... }
const result: IteratorResult<T> = this.sourceEnumerator.next();
```

You create `Enumerator<T>` instances when writing class-based operators. Regular library users never handle them directly.

---

## `EnumeratorFactory<T>`

An object with a single method: `getEnumerator(): Enumerator<T>`. Calling it produces a fresh cursor.

```ts
import type { EnumeratorFactory } from "tyneq";

// createOperator expects you to return one of these:
factory(source: Enumerable<unknown>): EnumeratorFactory<unknown> {
  return {
    getEnumerator() {
      return myCustomIterator(source[Symbol.iterator]());
    }
  };
}
```

`Enumerable<T>` extends `EnumeratorFactory<T>` - every `Enumerable` is also an `EnumeratorFactory`.

---

## Operator Categories

| Term | What it means |
|---|---|
| **Streaming operator** | Returns a new `TyneqSequence`. Deferred. Processes one element at a time. O(1) memory. |
| **Buffering operator** | Returns a new `TyneqSequence`. Deferred. Reads the full source into memory before yielding. O(n) memory. |
| **Terminal operator** | Returns a concrete value (not a sequence). Executes the pipeline immediately. |
| **Source / factory** | Creates the root `TyneqSequence` (`Tyneq.from`, `Tyneq.range`, `Tyneq.empty`, etc.). |

---

## Deferred vs Immediate Execution

| Term | Meaning |
|---|---|
| **Deferred** | The source is not touched until the returned sequence is iterated. All streaming and buffering operators are deferred. |
| **Immediate** | The source is iterated at the point of the method call. All terminal operators are immediate. |

---

## Re-iteration

Enumerating a `TyneqSequence` multiple times re-runs the pipeline from the root on each pass. This is correct and expected - each call to `toArray()`, `count()`, etc. is independent.

Exception: sources that are one-shot (e.g. a generator *object*) do not support re-iteration regardless of what operators wrap them. See [Common Pitfalls](/guide/pitfalls#one-shot-sources).

---

## Memoization

`memoize()` wraps a sequence in a `TyneqCachedSequence`. After the first enumeration, results are stored in an internal buffer and replayed on subsequent enumerations without re-executing the pipeline.

`refresh()` on a memoized sequence invalidates the buffer and forces re-evaluation on the next enumeration.

---

## Query Plan

Every sequence built by a Tyneq operator carries an `IQueryNode` - a linked list node describing that operator (name, category, arguments) with a reference to the upstream node. The chain from the outermost operator back to the source root is the **query plan**.

Accessible via `seq[tyneqQueryNode]`. Print with `QueryPlanPrinter`. Traverse with `QueryPlanVisitor<T>`. See [Query Plan Inspection](/guide/query-plan).

---

## Plugin / Extensibility API

The `src/plugin/` directory contains the public registration API for custom operators:

| Export | Purpose |
|---|---|
| `createGeneratorOperator` | Register a generator-based streaming operator |
| `createOperator` | Register a streaming/buffering operator with a custom factory |
| `createTerminalOperator` | Register a terminal operator |
| `@operator` | Class-based streaming/buffering decorator |
| `@terminal` | Class-based terminal decorator |
| `OperatorRegistry` | Introspect, guard, and observe all registered operators |
| `TyneqEnumerator` | Base class for class-based streaming/buffering operators |
| `TyneqBaseEnumerator` | Base class for source generators (not for pipeline operators) |
| `TyneqTerminalOperator` | Base class for class-based terminal operators |

In documentation and user-facing language this is called the **extensibility API** or **custom operators**. The directory is named `plugin` in source.
