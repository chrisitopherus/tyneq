# Concepts

## Type Hierarchy

Three types form the core contract:

| Type | What it is |
|---|---|
| `TyneqSequence<T>` | The fluent API - what you work with. Returned by every operator. |
| `Enumerable<T>` | Re-iterable contract. Each call to `getEnumerator()` produces a fresh cursor. |
| `Enumerator<T>` | Single-pass cursor - one active enumeration in progress. |

`TyneqSequence<T>` extends `Enumerable<T>`. Regular users only interact with `TyneqSequence`. `Enumerable<T>` and `Enumerator<T>` appear in custom operator signatures.

See [Terminology](/guide/terminology) for full definitions of all types and terms.

## Sequences

A Tyneq sequence is a re-iterable `Enumerable<T>`. Each call to `Symbol.iterator` or `getEnumerator()` creates a fresh, independent enumerator. No mutable state is shared across enumerations.

```ts
const seq = Tyneq.range(1, 3).select(x => x * 10);

seq.toArray(); // [10, 20, 30]
seq.toArray(); // [10, 20, 30]  <-- independent traversal, same result
```

## Operator Categories

| Category | Memory | Execution | Examples |
|---|---|---|---|
| **Streaming** | O(1) | One element at a time, lazily | `where`, `select`, `take`, `scan` |
| **Buffering** | O(n) | Full source read before any output | `orderBy`, `groupBy`, `distinct` |
| **Terminal** | - | Immediately executes the pipeline | `toArray`, `count`, `first`, `sum` |

Every method on a sequence is one of these three. Knowing which category an operator belongs to tells you its memory footprint and when work happens.

## Deferred Execution

Composing operators does not touch the source. Execution begins when a terminal is called.

```ts
const query = Tyneq.range(1, 1_000_000)
  .where(n => n % 2 === 0)
  .select(n => n * n)
  .take(5);

// Nothing has run yet.

query.toArray(); // [4, 16, 36, 64, 100] - pipeline executes once, top-to-bottom
```

A `where().select().take(1)` on a million-element source processes only enough elements to find the first match.

## Buffering Operators

Buffering operators must read the full source before yielding any output.

```ts
const sorted = Tyneq.range(1, 100)
  .where(n => n % 3 === 0)  // streaming - O(1)
  .orderBy(n => -n)          // buffering - reads and sorts all matching elements
  .take(5)                   // streaming again
  .toArray();
```

`orderBy` marks the point where full materialization happens. Operators downstream of it receive a sorted sequence.

## Stable Sort

`orderBy` and `orderByDescending` are stable. Elements with equal keys keep their original relative order. Chain `thenBy`/`thenByDescending` for tie-breaking:

```ts
Tyneq.from(records)
  .orderBy(r => r.team)
  .thenByDescending(r => r.score)
  .toArray();
```

## Memoization

`memoize()` caches results after the first enumeration. Subsequent calls return the cached result without re-executing the pipeline.

```ts
const source = Tyneq.range(1, 5)
  .tap(n => console.log("computing", n))
  .shuffle()
  .memoize();

source.toArray(); // logs 5 times, caches
source.toArray(); // no logs - returns cache

source.refresh(); // invalidate
source.toArray(); // logs again
```

Use `memoize()` only when re-execution is measurable and avoidable. Keep transformation callbacks pure otherwise - re-enumeration is expected behavior.

## Query Plan

Every sequence produced by a Tyneq operator carries an immutable `IQueryNode` chain describing the operators applied to it.

```ts
import { Tyneq, tyneqQueryNode, QueryPlanPrinter } from "tyneq";

const seq = Tyneq.from([1, 2, 3]).where(x => x > 1).select(x => x * 2);

console.log(QueryPlanPrinter.print(seq[tyneqQueryNode]!));
// from([1, 2, 3])
//   -> where(<fn>)
//   -> select(<fn>)
```

See [Query Plan Inspection](/guide/query-plan) for traversal and visitor patterns.
