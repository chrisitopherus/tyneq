# Operators Overview

Tyneq operators are documented by execution behavior because execution behavior determines performance and timing semantics.

## Categories

### Streaming Operators

Streaming operators transform elements one by one and can yield output as input is consumed.

Common operators:

- `where`
- `select`
- `selectMany`
- `take`
- `skip`
- `zip`
- `concat`

Typical characteristics:

- Deferred execution
- O(1) additional space in common cases
- Good for early filtering and projection

### Buffering Operators

Buffering operators accumulate source data before yielding all or part of the output.

Common operators:

- `orderBy`, `orderByDescending`, `thenBy`, `thenByDescending`
- `groupBy`, `groupJoin`, `join`
- `distinct`, `union`, `intersect`, `except`
- `shuffle`, `reverse`, `chunk`

Typical characteristics:

- Deferred execution
- O(n) additional space for full-buffer cases
- Needed when semantics depend on full-sequence knowledge

### Terminal Operators

Terminal operators consume the query and return a concrete value or collection.

Common operators:

- `toArray`, `toSet`, `toMap`, `toRecord`
- `count`, `sum`, `min`, `max`
- `first`, `last`, `single`, `elementAt`
- `any`, `all`, `contains`, `sequenceEqual`

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
  .where(u => u.active)              // streaming
  .select(u => ({ id: u.id, score: u.score })) // streaming
  .orderByDescending(u => u.score)   // buffering
  .take(10)                          // streaming over buffered result
  .toArray();                        // terminal
```

## Related Pages

- [Core Concepts](/guide/concepts)
- [Querying and Deferred Execution](/guide/querying-and-deferred-execution)
- [Examples](/guide/examples)
