# Core Concepts

This page explains the mental model behind Tyneq. Understanding it will make every operator, every error, and every design decision click into place.

---

## The type hierarchy

Three types form the core contract. You interact with them at different levels:

```
Iterable<T>                  <- native JavaScript protocol
  |-- Enumerable<T>          <- Tyneq: re-iterable contract
        |-- TyneqSequence<T> <- Tyneq: the fluent API (what you work with)

Iterator<T>                  <- native JavaScript protocol
  |-- Enumerator<T>          <- Tyneq: single-pass cursor
```

**`TyneqSequence<T>`** is what you see every day. Every operator returns one. It carries all the fluent methods (`where`, `select`, `orderBy`, etc.) and the `[tyneqQueryNode]` symbol for query plan access.

**`Enumerable<T>`** is the re-iteration contract. It can produce a fresh, independent `Enumerator<T>` on demand via `getEnumerator()`. You encounter this when writing custom operators.

**`Enumerator<T>`** is a stateful, forward-only cursor - one active traversal in progress. The native `Iterator<T>` with two additions: `return()` to release resources early, and `throw()` which is not supported. You work with this inside class-based custom operators.

For everyday usage, you only ever touch `TyneqSequence<T>`. The others appear when you extend the library.

### Specialized sequence types

Two sequence types extend `TyneqSequence<T>` with additional capabilities:

**`TyneqOrderedSequence<T>`** -- returned by `orderBy()` and `orderByDescending()`. Adds `thenBy()` and `thenByDescending()` for multi-key sorting, plus `asc()` and `desc()` for fluent direction changes. Custom operators can be added via `createOrderedOperator` or `@orderedOperator`.

**`TyneqCachedSequence<T>`** -- returned by `memoize()`. Adds `refresh()` to invalidate the internal cache. Custom operators can be added via `createCachedOperator` or `@cachedOperator`.

Both carry all the standard operators too. The extra methods only appear when you are in the right context:

```ts
Tyneq.from(data)
  .orderBy((x) => x.name)     // TyneqOrderedSequence -- thenBy() is available
  .thenBy((x) => x.age)       // still TyneqOrderedSequence
  .where((x) => x.active)     // back to TyneqSequence -- thenBy() no longer available
  .toArray();
```

---

## Operator categories

Every operator on a sequence belongs to exactly one of three categories:

| Category | Memory | When work happens | Examples |
|---|---|---|---|
| **Streaming** | O(1) | One element at a time, lazily | `where`, `select`, `take`, `scan` |
| **Buffering** | O(n) | Full source is read before any output | `orderBy`, `groupBy`, `distinct` |
| **Terminal** | - | Immediately executes the full pipeline | `toArray`, `count`, `first`, `sum` |

This categorization is explicit and stable. Knowing which category an operator belongs to tells you its memory footprint and when it will execute.

---

## Deferred execution

Composing operators does not touch the source. They build a description of work. Execution begins when a terminal operator is called.

```ts
const query = Tyneq.range(1, 1_000_000)
  .where(n => n % 2 === 0)   // streaming - describes a filter
  .select(n => n * n)         // streaming - describes a projection
  .take(5);                   // streaming - describes a limit

// Nothing has run. No elements processed. No memory allocated.

query.toArray();
// Now the pipeline executes:
// - range produces 1, 2, 3 ...
// - where checks each; passes 2, 4, 6 ...
// - select squares each; passes 4, 16, 36 ...
// - take stops after 5
// -> [4, 16, 36, 64, 100]
```

Because `take` is downstream of streaming operators, the pipeline stops as soon as it has 5 results. The remaining 999,995 elements are never generated.

---

## Streaming vs. buffering in depth

**Streaming operators** are O(1). They process one element at a time and pass it downstream before pulling the next.

```ts
Tyneq.range(1, 10)
  .where(n => n % 2 === 0)  // O(1): checks each element, passes matching ones
  .select(n => n * 10)       // O(1): transforms each passing element
  .take(3)                   // O(1): stops after receiving 3
  .toArray();                // -> [20, 40, 60]
```

**Buffering operators** must read the entire upstream before yielding any output. This is unavoidable for operators like `orderBy` - you cannot produce the first sorted element without knowing all the elements.

```ts
Tyneq.from(largeArray)
  .where(x => x.active)     // streaming: O(1) per element
  .orderBy(x => x.score)    // buffering: reads ALL active elements, sorts them
  .take(5)                   // streaming: takes first 5 sorted elements
  .toArray();
```

The `orderBy` is the materialization boundary. Everything upstream of it runs fully before any output appears. Everything downstream runs lazily on the sorted results.

**Why this matters:** if you place `take` before `orderBy`, you sort a smaller set:

```ts
// Sorts only the first 100 elements - faster, different semantics
Tyneq.from(largeArray).take(100).orderBy(x => x.score).take(5).toArray();

// Sorts everything - slower, correct if you need the global top-5
Tyneq.from(largeArray).orderBy(x => x.score).take(5).toArray();
```

Neither is wrong - they have different meanings. Understanding buffering lets you make the right choice.

---

## Re-iteration

Every `TyneqSequence` is re-iterable. Calling a terminal does not exhaust the sequence. Each call starts a fresh independent traversal.

```ts
const query = Tyneq.from([1, 2, 3, 4, 5])
  .where(n => n % 2 === 0);

query.toArray();  // -> [2, 4]
query.count();    // -> 2   - same sequence, new traversal
query.toArray();  // -> [2, 4] again
```

This is because `TyneqSequence` implements `Enumerable<T>` - each `Symbol.iterator` call produces a new `Enumerator<T>` from the beginning. There is no shared mutable cursor.

**Exception:** sources that are inherently one-shot (like a generator *object*, not a generator function) cannot be re-iterated regardless of what operators wrap them. See [Best Practices & Pitfalls](./best-practices.md).

---

## Memoization

Sometimes re-executing the pipeline is expensive: the source involves I/O, heavy computation, or randomness you want to fix in place. `memoize()` solves this.

```ts
const source = Tyneq.from(fetchExpensiveData())
  .where(x => x.active)
  .shuffle()   // random - different result each evaluation
  .memoize();

source.toArray(); // executes once: fetches data, filters, shuffles, caches
source.toArray(); // returns cache - no fetch, no shuffle
source.count();   // returns cache count

source.refresh(); // invalidate - next call re-executes
source.toArray(); // executes again
```

`memoize()` returns a `TyneqCachedSequence<T>` with an additional `refresh()` method. After the first enumeration, results live in an internal buffer. Mutations to cached objects affect future reads (it stores references, not deep clones).

**Rule of thumb:** do not memoize unless you have a measured reason. In-memory pipelines on plain arrays are fast to re-execute and simpler to reason about without a cache.

---

## Query plans

Every sequence produced by a Tyneq operator carries an immutable `QueryPlanNode` chain - a linked list that describes the full pipeline from source to the outermost operator.

```ts
import { Tyneq, tyneqQueryNode, QueryPlanPrinter } from "tyneq";

const seq = Tyneq.from([1, 2, 3])
  .where(x => x > 1)
  .select(x => x * 2);

console.log(QueryPlanPrinter.print(seq[tyneqQueryNode]!));
// from([1, 2, 3])
//   -> where(<fn>)
//   -> select(<fn>)
```

The plan is metadata only - it does not participate in iteration. But it is live and useful: you can walk it, transform it, and **compile it back into an executable sequence** via `QueryPlanCompiler`.

See [Query Plan & Compiler](./query-plan.md) for the full guide.

---

## Inside the enumerator

You do not need to understand enumerators to use Tyneq. But if you write custom operators or want to know what happens under the hood, here is the model.

Every operator is backed by an enumerator -- a stateful cursor that knows how to produce one element at a time. When you call a terminal like `toArray()`, the pipeline creates a chain of enumerators from source to terminal, and pulls elements through them.

### The state machine

Every enumerator follows this lifecycle:

```
Created --> [initialize()] --> Running --> [done or earlyComplete()] --> Done
```

1. **Created** -- the constructor ran, but no elements have been produced yet.
2. **`initialize()`** -- called once, before the first element is requested. Streaming operators usually do nothing here. Buffering operators read the full source into an internal buffer.
3. **Running** -- `handleNext()` is called repeatedly. Each call either yields an element (`{ done: false, value }`) or signals completion (`{ done: true }`).
4. **Done** -- no more elements. The source enumerator is disposed. Further calls to `next()` return `{ done: true }` immediately.

### Streaming vs. buffering in the enumerator

The difference between streaming and buffering operators comes down to where the work happens:

**Streaming:** `handleNext()` pulls one element from the source, processes it, and either yields or skips it. O(1) memory.

```ts
// Conceptual model of a "where" enumerator
handleNext() {
  while (true) {
    const next = this.sourceEnumerator.next();
    if (next.done) return { done: true };
    if (this.predicate(next.value)) return { done: false, value: next.value };
    // skip -- loop again
  }
}
```

**Buffering:** `initialize()` drains the entire source into a local data structure. Then `handleNext()` serves from that buffer. O(n) memory.

```ts
// Conceptual model of an "orderBy" enumerator
initialize() {
  this.buffer = Array.from(this.source);
  this.sorted = this.sort(this.buffer);
  this.index = 0;
}

handleNext() {
  if (this.index >= this.sorted.length) return { done: true };
  return { done: false, value: this.sorted[this.index++] };
}
```

### Early completion

When an operator stops consuming before the source is exhausted (like `take`), it calls `earlyComplete()`. This propagates `return()` to the source enumerator, releasing any upstream resources. Without it, the upstream enumerator is leaked.

### The base class hierarchy

There are four enumerator base classes, each for a different context:

| Base class | Source | Used by |
|---|---|---|
| `TyneqEnumerator<TIn, TOut>` | `Enumerator<TIn>` | Standard operators (most common) |
| `TyneqOrderedEnumerator<T>` | `OrderedEnumerable<T>` | Ordered-specific operators |
| `TyneqCachedEnumerator<T>` | `CachedEnumerable<T>` | Cached-specific operators |
| `TyneqBaseEnumerator<T>` | (none) | Source enumerators, fully custom |

`TyneqEnumerator` is what you use 99% of the time when writing custom operators. See [Custom Operators](./extensibility.md) for the full guide.

---

## Stable sort

`orderBy` and `orderByDescending` are stable. Elements with equal keys keep their original relative order. Chain `thenBy`/`thenByDescending` for multi-key sorting:

```ts
Tyneq.from(employees)
  .orderBy(e => e.department)
  .thenBy(e => e.level)
  .thenByDescending(e => e.yearsAtCompany)
  .toArray();
```

See [Ordering](./ordering.md) for comparers and full multi-key sort details.

---

## Summary

| Concept | What to remember |
|---|---|
| `TyneqSequence<T>` | What operators return; carries all fluent methods |
| `Enumerable<T>` | Re-iterable contract; appears in custom operator signatures |
| `Enumerator<T>` | Single-pass cursor; appears inside class-based operators |
| Streaming | O(1) memory, lazy, one element at a time |
| Buffering | Reads full source before yielding; O(n) memory |
| Terminal | Executes the pipeline immediately; returns a value |
| Deferred | Operators build a description; terminals run it |
| Re-iterable | Same query, independent traversals, no exhaustion |
| Query plan | Immutable metadata chain; compilable back to a sequence |
