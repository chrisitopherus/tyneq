# What Is Tyneq

Tyneq is a typed query library for TypeScript and JavaScript that brings LINQ-style pipeline composition to any iterable data source.

## The Problem It Solves

As query logic grows, plain array methods become harder to reason about:

```ts
// This is fine for 3 operations...
const result = users
  .filter(u => u.active)
  .map(u => u.score)
  .sort((a, b) => b - a)
  .slice(0, 10);

// ...but when pipelines grow, execution timing becomes opaque:
// When does filter run? Does sort read everything before slice? What is the memory cost?
// These questions don't have obvious answers from looking at the code.
```

Tyneq's design makes these questions answerable from the pipeline shape itself.

## How Tyneq Works

Queries are built in three explicit stages:

```
Source  ──→  Operator chain  ──→  Terminal
  ↑                ↑                  ↑
Tyneq.from()   where, select,    toArray, count,
Tyneq.range()  orderBy, ...      first, sum, ...
Tyneq.empty()
```

**Stage 1 — Source**: wrap any iterable (array, Set, Map, generator, custom iterator) in a re-iterable sequence.

**Stage 2 — Operators**: compose transformations as a pipeline. No data is read at this stage — the pipeline is a description, not a computation.

**Stage 3 — Terminal**: call a terminal method to evaluate the pipeline and get a concrete result.

```ts
import { Tyneq } from "tyneq";

const result = Tyneq
  .from([
    { name: "Ada",   team: "core",  score: 84 },
    { name: "Grace", team: "infra", score: 92 },
    { name: "Linus", team: "core",  score: 97 }
  ])
  .where(p => p.team === "core")        // streaming — no data read yet
  .orderByDescending(p => p.score)      // buffering — sorts on enumeration
  .select(p => `${p.name}: ${p.score}`) // streaming
  .toArray();                           // terminal — pipeline executes here

console.log(result);
// → ["Linus: 97", "Ada: 84"]
```

Every operator in the chain is labeled in the source with its execution kind (streaming / buffering / terminal), so the memory and timing cost is always visible.

## Why Use Tyneq

### Explicit execution semantics

With arrays, it isn't always obvious whether an operation is eager or lazy, or how much memory it uses. Tyneq's operator categories (streaming / buffering / terminal) are documented contracts, not implementation details.

```ts
// In Tyneq — execution timing is part of the operator category, not a guess.
Tyneq.from(largeDataset)
  .where(x => x.active)      // O(1) — streaming
  .orderBy(x => x.name)      // O(n) — buffering: reads full source before yielding
  .take(10)                  // O(1) — streaming over sorted result
  .toArray();                // terminal: triggers execution
```

### Re-iterable queries

A query built with Tyneq is a re-iterable value. You can evaluate it multiple times without rebuilding it:

```ts
const activeUsers = Tyneq.from(users).where(u => u.active);

const count  = activeUsers.count();         // evaluates once
const names  = activeUsers.select(u => u.name).toArray(); // evaluates again, independently
```

This is unlike most generator-based approaches where consuming the iterator exhausts it.

### Relational operators out of the box

Tyneq ships with `join`, `groupJoin`, `groupBy`, `distinct`, and set operators (`union`, `intersect`, `except`) — operations that arrays and most utility libraries don't provide without verbose manual implementation.

```ts
const userOrders = Tyneq
  .from(users)
  .groupJoin(
    orders,
    u => u.id,
    o => o.userId,
    (user, userOrders) => ({ user, orderCount: userOrders.count() })
  )
  .orderByDescending(x => x.orderCount)
  .toArray();
```

### Strong types across complex pipelines

TypeScript's type inference follows the pipeline through projections, joins, and groupings — the result type is always correct.

```ts
// TypeScript knows the result is string[], not any[] or unknown[]
const names: string[] = Tyneq
  .from([{ id: 1, name: "Ada" }, { id: 2, name: "Grace" }])
  .select(u => u.name)
  .toArray();
```

## What Tyneq Is Not

- Not an ORM or SQL translation layer — it operates on in-memory data only.
- Not an async stream library — all operations are synchronous.
- Not a replacement for every utility library — it focuses on query composition, not general object/string/function utilities.

If you need async data pipelines, look at [IxJS](https://github.com/ReactiveX/IxJS) or RxJS. For general-purpose utility breadth, Lodash is the go-to. Tyneq is focused specifically on **synchronous, typed, composable queries over iterable data**.

## Typical Use Cases

- **Read-model shaping** in services or controllers — filter, project, sort, paginate API response data
- **Relational joins** over in-memory collections — build reports by joining tables without a database
- **Ordered analytics** — groupBy → aggregate → sort → limit workflows with deterministic behavior
- **Reusable query definitions** — compose a query once, evaluate it in multiple contexts or with different terminal operators
- **Custom query tooling** — inspect, analyze, and rewrite queries via the query plan visitor API

## Next Steps

- [Getting Started](/guide/getting-started) — install and write your first query
- [Core Concepts](/guide/concepts) — understand sequences, operator categories, and re-enumeration
- [vs. Other Libraries](/guide/differences) — detailed comparison with code examples
