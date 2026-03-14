# Core Concepts

This page defines the semantic model used throughout Tyneq documentation.

## Sequence

A sequence is any value that implements `IEnumerable<T>` — the base re-iterable contract in Tyneq. Each call to `Symbol.iterator` (or `getEnumerator()`) creates a fresh, independent iterator. No mutable state is shared across enumerations.

Key properties:

- Sequences are re-iterable: the same sequence object can be enumerated any number of times.
- Each enumeration starts from the beginning of the pipeline.
- Re-enumeration is safe as long as callbacks are pure and the underlying source supports repeated iteration.

## Source and Pipeline

Every query has three parts:

1. A **source** — the input sequence passed to `Tyneq.from`, `Tyneq.range`, `Tyneq.empty`, or any other factory.
2. An **operator chain** — a series of transformations composed in method-call order.
3. An optional **terminal operation** — a final call that evaluates the pipeline and returns a concrete result.

Operators are composed as a pipeline, not executed as standalone steps. Calling `.where(pred).select(fn)` produces a new sequence description; no iteration happens yet.

## Operator Categories

Tyneq operators are grouped by execution behavior.

| Category | Space | Execution |
|---|---|---|
| **Streaming** | O(1) additional | Deferred — elements flow one at a time |
| **Buffering** | O(n) additional | Deferred — full or partial source materialized before yielding |
| **Terminal** | — | Immediate — evaluates and returns a value |

See [Operators Overview](/guide/operators-overview) for category details and the full operator list.

## Deferred and Immediate Execution

**Deferred execution** means the source is not iterated until the returned sequence is iterated. Building a chain of streaming operators does not touch the source data at all.

**Immediate execution** means the source is fully iterated at the point of the method call. All terminal operators are immediate.

Practical implications:

- Calling `.where(pred)` is instantaneous regardless of source size.
- Calling `.toArray()` iterates the pipeline from root to leaf, processing each element through every operator in turn.
- Side effects in predicates or selectors execute during iteration, not during operator composition.

See [Querying and Deferred Execution](/guide/querying-and-deferred-execution) for deeper examples.

## Execution Model Guarantees

- **Streaming** operators are guaranteed O(1) additional memory and begin yielding before the source is exhausted.
- **Buffering** operators may hold up to O(n) elements in memory before yielding any output. The source is read fully (or substantially) before the first result appears.
- **Terminal** operators are immediate: calling them is the materialization boundary.

## Ordering and Stability

- `orderBy` and `orderByDescending` perform a **stable** sort. Elements with equal keys remain in their original relative order.
- `thenBy` and `thenByDescending` append tie-breaking rules to an existing ordering without re-sorting.
- Subsequent operators observe the order produced by upstream stages exactly as emitted.

## Re-Enumeration

Enumerating a deferred query multiple times replays the full pipeline from the source on each pass. This is correct and expected behavior.

Use `memoize()` when you need repeatable results from an expensive pipeline across multiple terminal calls without re-executing the full chain.

Call `refresh()` on the memoized sequence to invalidate the cache and force re-evaluation on the next enumeration.

## Query Plan

Every sequence produced by a Tyneq operator carries a **query plan node** (`IQueryNode`) that describes the operator and its arguments. Nodes are linked into a chain from the most recent operator back to the root source.

Access the plan via the `tyneqQueryNode` symbol:

```ts
import { Tyneq, tyneqQueryNode, QueryPlanPrinter } from 'tyneq';

const seq = Tyneq.from([1, 2, 3])
    .where(x => x > 1)
    .select(x => x * 2);

const plan = QueryPlanPrinter.print(seq[tyneqQueryNode]!);
console.log(plan);
// from([1, 2, 3])
//   → where(<fn>)
//   → select(<fn>)
```

The query plan is metadata only — it does not participate in iteration. See [Extensibility and Query Plans](/guide/extensibility) for traversal and visitor patterns.

## Practical Rule Set

1. Keep transformation callbacks pure when possible — re-enumeration will re-execute them.
2. Place buffering operators intentionally — they materialize memory at the point they appear in the chain.
3. Treat terminal methods as clear execution boundaries.
4. Reach for `memoize()` only when the cost of re-enumeration is measurable and repeated.
