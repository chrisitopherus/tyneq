# Getting Started

## Installation

```bash
npm install tyneq
```

Tyneq is written in TypeScript and ships with type definitions. No separate `@types` package is needed.

## Requirements

- TypeScript 5.x (with `"strictNullChecks": true`)
- Any iterable data source — arrays, Sets, Maps, generators, custom iterators

## First Query

```ts
import { Tyneq } from "tyneq";

const people = [
  { id: 1, name: "Ada",   team: "core",  score: 84 },
  { id: 2, name: "Linus", team: "infra", score: 92 },
  { id: 3, name: "Grace", team: "core",  score: 97 }
];

const topCore = Tyneq
  .from(people)
  .where(p => p.team === "core")
  .orderByDescending(p => p.score)
  .select(p => `${p.name} (${p.score})`)
  .toArray();

console.log(topCore);
// → ["Grace (97)", "Ada (84)"]
```

## Reading This Example

Each method call falls into one of three categories:

| Call | Category | What it does |
|---|---|---|
| `Tyneq.from(people)` | Source | Wraps the array as a re-iterable sequence |
| `.where(pred)` | Streaming operator | Filters elements one at a time — deferred, O(1) memory |
| `.orderByDescending(key)` | Buffering operator | Sorts all elements — deferred, O(n) memory |
| `.select(fn)` | Streaming operator | Projects each element — deferred, O(1) memory |
| `.toArray()` | Terminal | Triggers execution and materializes the result |

Nothing happens until `.toArray()` is called. The operators above it are a pipeline description, not computations.

## Working with Any Iterable

`Tyneq.from` accepts arrays, Sets, Maps, generators, and any object implementing the iterable protocol:

```ts
// From a Set
Tyneq.from(new Set([3, 1, 4, 1, 5]))
  .orderBy(x => x)
  .toArray();
// → [1, 3, 4, 5]

// From a Map
Tyneq.from(new Map([["a", 1], ["b", 2], ["c", 3]]))
  .where(([key, val]) => val > 1)
  .select(([key, val]) => `${key}=${val}`)
  .toArray();
// → ["b=2", "c=3"]

// From a range
Tyneq.range(1, 5).toArray();
// → [1, 2, 3, 4, 5]

// From a generator
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) { yield a; [a, b] = [b, a + b]; }
}
Tyneq.from(fibonacci()).take(7).toArray();
// → [0, 1, 1, 2, 3, 5, 8]
```

## Re-evaluating a Query

A Tyneq query is a re-iterable value. You can call multiple terminal operators on the same query object:

```ts
const active = Tyneq.from(people).where(p => p.score >= 90);

const count = active.count();                                          // → 2
const names = active.select(p => p.name).toArray();                    // → ["Linus", "Grace"]
const best  = active.orderByDescending(p => p.score).elementAt(0);    // → { name: "Grace", ... }
```

Each terminal call re-runs the pipeline independently from the source. Use `memoize()` if re-execution is expensive.

## The Mental Model

1. **Compose first, execute later.** Adding operators to a pipeline costs nothing until you iterate.
2. **Terminal operators are execution boundaries.** `toArray`, `count`, `first`, `sum`, etc. trigger a pass through the pipeline.
3. **Operator categories tell you the cost.** Streaming = O(1); Buffering = O(n); Terminal = immediate.
4. **Queries are values.** Store them, pass them, call multiple terminals on the same query.

## What's Next

- [Core Concepts](/guide/concepts) — sequences, re-enumeration, query plans
- [Operators Overview](/guide/operators-overview) — the full operator list by category
- [Querying & Deferred Execution](/guide/querying-and-deferred-execution) — deep dive into the execution model
- [Examples](/guide/examples) — production-style pipeline patterns
- [API Reference](/api/reference/) — full method signatures
