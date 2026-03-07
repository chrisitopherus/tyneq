# Querying and Deferred Execution

## Definition

Deferred execution means a query is defined now and evaluated later when enumerated.

Immediate execution means evaluation occurs at method call time.

## Query Lifecycle

1. Build source and operator chain
2. Hold query as a reusable sequence
3. Trigger enumeration through a terminal operator
4. Produce a value or collection

## Example

```ts
import { Tyneq } from "tyneq";

const query = Tyneq
  .range(1, 10)
  .where(n => n % 2 === 0)
  .select(n => n * n)
  .take(3);

// No source enumeration yet.

const result = query.toArray();
console.log(result);
// [4, 16, 36]
```

## Streaming and Buffering Behavior

- Streaming stages (`where`, `select`, `take`) can produce results incrementally.
- Buffering stages (`orderBy`, `groupBy`, `distinct`) may need to inspect larger portions of the source first.

Pipeline shape impacts when values become available and how much memory is used.

## Re-Enumeration Semantics

If a query is enumerated twice, deferred stages run twice.

```ts
import { Tyneq } from "tyneq";

const q = Tyneq.range(1, 3).tap(x => console.log("seen", x));

q.toArray();
q.toArray();
// "seen" logs twice per element across two enumerations.
```

Use `memoize()` to cache results across repeated enumerations, then call `refresh()` to invalidate that cache.

## Placement Guidance

1. Prefer streaming operators early in the chain.
2. Introduce buffering operators only when required by semantics.
3. Keep terminal operators near application boundaries.
4. Avoid hidden side effects in predicates and selectors.

## Related Pages

- [Core Concepts](/guide/concepts)
- [Operators Overview](/guide/operators-overview)
- [Examples](/guide/examples)
