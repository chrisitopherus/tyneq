# Operators Overview

Tyneq operators are documented by execution behavior because execution behavior determines performance and timing semantics.

## Categories

### Streaming Operators

Streaming operators transform elements one by one and can yield output as input is consumed.

Common operators:

- `where` — filter by predicate
- `select` — project each element
- `selectMany` — flatten projected sequences
- `take` / `takeWhile` — limit from the start or while a condition holds
- `skip` / `skipLast` / `skipWhile` — discard from start, end, or condition
- `append` / `prepend` — add elements at the tail or head
- `concat` — append another sequence
- `zip` — pair elements from two sequences
- `pairwise` — yield adjacent `[prev, curr]` tuples
- `tap` / `tapIf` — side-effect pass-through
- `populate` — replace each element with a constant value
- `split` — split on delimiter elements
- `chunk` — split into fixed-size batches
- `throttle` — sample every Nth element
- `scan` — running accumulation (prefix scan)
- `cast` — assert each element satisfies a type (throws on mismatch)
- `ofType` — filter elements using a type guard
- `defaultIfEmpty` — fall back to a default if source is empty
- `pipe` — apply a one-off custom factory

Typical characteristics:

- Deferred execution
- O(1) additional space in common cases
- Good for early filtering and projection

### Buffering Operators

Buffering operators accumulate source data before yielding all or part of the output.

Common operators:

- `orderBy`, `orderByDescending`, `thenBy`, `thenByDescending` — sort with stable multi-key ordering
- `groupBy`, `groupJoin`, `join` — relational grouping and joining
- `distinct`, `distinctBy` — deduplicate
- `union`, `unionBy` — set union
- `intersect`, `intersectBy` — set intersection
- `except`, `exceptBy` — set difference
- `shuffle` — randomize order
- `reverse` — reverse order
- `backsert` — insert at a position from the end
- `memoize` — cache results for repeated enumeration

Typical characteristics:

- Deferred execution
- O(n) additional space for full-buffer cases
- Needed when semantics depend on full-sequence knowledge

### Terminal Operators

Terminal operators consume the query and return a concrete value or collection.

Common operators:

- `toArray`, `toSet`, `toMap`, `toRecord` — materialize to a collection
- `toAsync` — bridge to `AsyncIterable<T>`
- `count`, `countBy` — element counts
- `sum`, `average` — numeric aggregations
- `min`, `max`, `minBy`, `maxBy`, `minMax` — extrema
- `first`, `firstOrDefault` — first matching element
- `last`, `lastOrDefault` — last matching element
- `single`, `singleOrDefault` — exactly one matching element
- `elementAt`, `elementAtOrDefault` — element by index
- `any`, `all` — predicate tests over the whole sequence
- `contains` — membership test
- `sequenceEqual` — element-by-element comparison
- `startsWith` — prefix comparison
- `indexOf` — first matching index
- `aggregate` — general fold with a result selector
- `isNullOrEmpty` — null or empty check
- `consume` — drain the sequence for side effects

Typical characteristics:

- Immediate execution
- Defines a clear materialization boundary

## Selection Guidance

1. Start with streaming operators for filtering and projection.
2. Add buffering operators only where required (sorting, grouping, set semantics).
3. End with terminal operators at application boundaries.
4. Use `memoize()` only for repeated expensive enumerations.

## Example Pipeline by Category

```ts
import { Tyneq } from "tyneq";

const top = Tyneq
  .from(users)
  .where(u => u.active)                          // streaming
  .select(u => ({ id: u.id, score: u.score }))   // streaming
  .orderByDescending(u => u.score)               // buffering
  .take(10)                                      // streaming (over sorted result)
  .toArray();                                    // terminal
```

## Related Pages

- [Core Concepts](/guide/concepts)
- [Querying and Deferred Execution](/guide/querying-and-deferred-execution)
- [Examples](/guide/examples)
