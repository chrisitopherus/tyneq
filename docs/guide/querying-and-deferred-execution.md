# Querying and Deferred Execution

## Definition

**Deferred execution** means a query is defined now and evaluated later — only when the sequence is iterated. No source data is read at operator composition time.

**Immediate execution** means evaluation occurs at method call time. All terminal operators are immediate.

## The Execution Contract

| Operator kind | When source is read | Memory impact |
|---|---|---|
| Streaming | On the first `next()` call of the result iterator | O(1) additional |
| Buffering | On the first `next()` call of the result iterator (reads full source first) | O(n) additional |
| Terminal | Immediately, at the call site | None additional |

## Query Lifecycle

```
Build source ──→ Compose operators ──→ Iterate (terminal or for-of)
    ↑                  ↑                          ↑
  no I/O            no I/O               all work happens here
```

1. `Tyneq.from(data)` — create a source node (no iteration).
2. `.where(pred).select(fn)` — compose deferred stages (no iteration).
3. `.toArray()` — pull the first element, which pulls through all upstream stages.

## Example

```ts
import { Tyneq } from "tyneq";

const query = Tyneq
  .range(1, 10)
  .where(n => n % 2 === 0)
  .select(n => n * n)
  .take(3);

// No source enumeration has happened yet.

const result = query.toArray();
console.log(result);
// [4, 16, 36]
```

## Streaming and Buffering Behavior

Streaming stages (`where`, `select`, `take`) pass elements through incrementally — they cannot produce output before receiving input, but they also do not buffer.

Buffering stages (`orderBy`, `groupBy`, `distinct`) must inspect a larger portion of the source before producing any output. An `orderBy` immediately before `take(1)` still reads the entire source, because the minimum value might be the last element.

```ts
// This reads ALL items — orderBy must see everything before yielding the first sorted result.
Tyneq.from(largeCollection)
    .orderBy(x => x.score)
    .first(x => x.score > 50);
```

Pipeline shape directly determines memory pressure and time-to-first-result.

## Re-Enumeration Semantics

Iterating a deferred query multiple times re-executes the full pipeline from root to leaf on each pass.

```ts
import { Tyneq } from "tyneq";

const q = Tyneq.range(1, 3).tap(x => console.log("seen", x));

q.toArray();
// seen 1 / seen 2 / seen 3

q.toArray();
// seen 1 / seen 2 / seen 3  (pipeline runs again)
```

This is correct and expected. Use `memoize()` to cache results across repeated enumerations if re-execution is expensive:

```ts
const expensive = Tyneq
  .range(1, 1_000_000)
  .where(x => isPrime(x))
  .memoize();

const first10 = expensive.take(10).toArray();    // reads source until 10 primes found
const next10  = expensive.skip(10).take(10).toArray(); // replays cache for first 10, then continues
```

Call `refresh()` to invalidate the cache and force re-evaluation on the next enumeration.

## Placement Guidance

1. Filter and project early with streaming operators — they reduce the elements that downstream stages see.
2. Introduce buffering operators only when the semantics require it (sorting, distinct, set operations).
3. Keep terminal operators near application boundaries — they are the execution triggers.
4. Avoid side effects in predicates and selectors; re-enumeration will re-execute them.
5. Never assume a specific execution order within a single pass unless the operator guarantees it in its documentation.

## Related Pages

- [Core Concepts](/guide/concepts)
- [Operators Overview](/guide/operators-overview)
- [Examples](/guide/examples)
