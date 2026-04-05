# Terminology

Definitions of every term used in the Tyneq documentation and source code.

---

## Type hierarchy

```
Iterable<T>                  <- native JavaScript iterable protocol
  |-- Enumerable<T>          <- Tyneq: re-iterable contract
        |-- TyneqSequence<T> <- Tyneq: public fluent API

Iterator<T>                  <- native JavaScript iterator protocol
  |-- Enumerator<T>          <- Tyneq: single-pass cursor
```

---

## `TyneqSequence<T>`

The type returned by every Tyneq factory and operator method. This is the interface you interact with directly.

It extends `Enumerable<T>` and carries all operator methods (`where`, `select`, `toArray`, ...) plus the `[tyneqQueryNode]` symbol for query plan access.

```ts
const seq: TyneqSequence<number> = Tyneq.range(1, 5);
```

---

## `Enumerable<T>`

The re-iterable contract. An `Enumerable<T>` can produce an independent `Enumerator<T>` on demand via `getEnumerator()` or `[Symbol.iterator]()`. Each call starts from the beginning with no shared mutable state.

Extends both `Iterable<T>` and `EnumeratorFactory<T>`.

You encounter this type in custom operator signatures:

```ts
factory(source: Enumerable<unknown>, step: number): EnumeratorFactory<unknown>
//             ^ Enumerable, not Enumerator - so the factory can re-iterate the source
```

---

## `Enumerator<T>`

A stateful, forward-only cursor - one active enumeration in progress. Extends the native `Iterator<T>` with:

- `return()` - terminates the cursor early and releases upstream resources (idempotent)
- `throw()` - not supported; throws `NotSupportedError` if called

You work with this inside class-based operators:

```ts
const result: IteratorResult<T> = this.sourceEnumerator.next();
```

---

## `EnumeratorFactory<T>`

An object with a single method: `getEnumerator(): Enumerator<T>`. Each call produces a fresh, independent cursor.

`Enumerable<T>` extends `EnumeratorFactory<T>` - every Enumerable is also a factory.

---

## `TyneqOrderedSequence<T>`

Returned by `orderBy` and `orderByDescending`. Extends `TyneqSequence<T>` with `thenBy` and `thenByDescending` for multi-key sorting. Custom ordered operators can be added via `createOrderedOperator`.

---

## `TyneqCachedSequence<T>`

Returned by `memoize()`. Extends `TyneqSequence<T>` with a `refresh()` method that invalidates the internal cache and forces re-evaluation on the next enumeration.

---

## Operator categories

| Term | Meaning |
|---|---|
| **streaming operator** | Returns a new `TyneqSequence`. Deferred. O(1) memory. Processes one element at a time. |
| **buffering operator** | Returns a new `TyneqSequence`. Deferred. O(n) memory. Reads the full source before yielding any output. |
| **terminal** | Returns a concrete value (not a sequence). Executes the pipeline immediately. |
| **source** | The upstream sequence passed into an operator. Also: a `QueryPlanNode` with `category === "source"` (the root of a plan). |
| **deferred** | The source is not iterated until the returned sequence is iterated. All streaming and buffering operators are deferred. |
| **immediate** | The source is iterated at the point of the method call. All terminal operators are immediate. |

---

## Callback types

| Term | Type |
|---|---|
| **predicate** | `(item: T) => boolean` |
| **selector** | `(item: T) => TResult` |
| **key selector** | `(item: T) => TKey` - extracts a comparison key |
| **accumulator** | `(acc: TResult, item: T) => TResult` |
| **comparer** | `Comparer<T>` = `(a: T, b: T) => number`; negative = a less than b, 0 = equal, positive = a greater than b |
| **equality comparer** | `EqualityComparer<T>` = `(a: T, b: T) => boolean` |

---

## Re-iteration

Enumerating a `TyneqSequence` multiple times re-runs the pipeline from the source on each pass. Each call to `toArray()`, `count()`, etc. is independent and produces a fresh `Enumerator<T>`.

**Exception:** sources that are inherently one-shot (e.g. a generator *object*, not a function) cannot be re-iterated.

---

## Memoization

`memoize()` wraps a sequence in a `TyneqCachedSequence`. After the first enumeration, results are stored in an internal buffer and replayed on subsequent enumerations without re-executing the pipeline.

`refresh()` on a memoized sequence invalidates the buffer and forces re-evaluation on the next enumeration.

---

## Query plan

Every sequence built by a Tyneq operator carries a `QueryPlanNode` - an immutable linked list node describing the operator (name, category, arguments) with a reference to the upstream node. The chain from the outermost operator back to the source root is the **query plan**.

Accessible via `seq[tyneqQueryNode]`. Tools:

| Tool | Purpose |
|---|---|
| `QueryPlanPrinter` | Render the plan as a human-readable string |
| `QueryPlanWalker` | Traverse the plan for side effects |
| `QueryPlanTransformer` | Rebuild the plan, optionally changing nodes |
| `QueryPlanOptimizer` | Built-in transformer that fuses redundant operators |
| `QueryPlanCompiler` | Compile a plan back into an executable sequence |
| `QueryPlanVisitor<T>` | Single-method interface for recursive visitors |

---

## Registration / extensibility

| Term | Meaning |
|---|---|
| **registration** | Adding an operator to `OperatorRegistry` and patching it onto `TyneqEnumerableBase.prototype` |
| **guard** | A callback added via `OperatorRegistry.addGuard` that runs before each registration and can block it by throwing |
| **module augmentation** | A `declare module "tyneq"` block that adds a custom operator to the TypeScript type system |
| **plugin** | A module that registers one or more custom operators as a side effect of import |

---

## walker / transformer / visitor

| Term | Meaning |
|---|---|
| **walker** | A `QueryPlanWalker` that traverses nodes in a configurable direction for side effects |
| **transformer** | A `QueryPlanTransformer` that traverses nodes and rebuilds the chain with optional structural changes |
| **visitor** | Any object implementing `QueryPlanVisitor<T>` - a single `visit(node)` method that returns a value |
