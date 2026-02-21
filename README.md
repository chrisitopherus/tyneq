# tyneq

Typed Enumerable Queries for TypeScript.

Tyneq is a LINQ-inspired query library for modern TypeScript and JavaScript projects. It gives you a fluent, strongly typed API for filtering, projecting, joining, grouping, sorting, and materializing data from any iterable source.

If you like the ergonomics of LINQ but want idiomatic TypeScript with lazy execution, re-iterable pipelines, and rich operator coverage, Tyneq is built for that use case.

## Why Tyneq

- **LINQ-style expressiveness** with TypeScript-first typing
- **Lazy by default** pipelines with deferred execution
- **Re-iterable sequences** (not one-shot generator chains)
- **Clear operator model**: streaming, buffering, and terminal operators
- **Strong set + relational support**: distinct/except/intersect/union, join/groupJoin/groupBy
- **Ordering pipeline** with `orderBy`, `orderByDescending`, `thenBy`, `thenByDescending`
- **Built-in memoization** with `memoize()` + `refresh()` for repeatable expensive queries
- **Zero runtime dependencies**

## Installation

```bash
npm install tyneq
```

## Quick Start

```ts
import { Tyneq } from "tyneq";

const result = Tyneq
	.from([
		{ id: 1, name: "Ada", team: "core", score: 84 },
		{ id: 2, name: "Linus", team: "infra", score: 92 },
		{ id: 3, name: "Grace", team: "core", score: 97 },
	])
	.where(p => p.team === "core")
	.orderByDescending(p => p.score)
	.select(p => `${p.name} (${p.score})`)
	.toArray();

// ["Grace (97)", "Ada (84)"]
```

## What Makes It Different

Many iterator libraries stop at lightweight map/filter helpers over single-use iterators.

Tyneq is designed as a **query system**:

- It models **enumerables, ordered enumerables, and cached enumerables** as first-class concepts.
- It supports **relational-style operations** (`join`, `groupJoin`, `groupBy`) in a fluent pipeline.
- It keeps API semantics explicit through **streaming vs buffering vs terminal** operators.
- It focuses on **predictable type propagation** across complex chains.
- It supports **re-execution control** via `memoize()` when you want repeatable results without recomputation.

## Core Concepts

### 1) Create sequences

```ts
import { Tyneq } from "tyneq";

const fromArray = Tyneq.from([1, 2, 3]);
const range = Tyneq.range(10, 5); // 10..14
const empty = Tyneq.empty<number>();

const indexed = Tyneq.enumerate(["a", "b", "c"])
	.select(([i, value]) => `${i}: ${value}`)
	.toArray();
// ["0: a", "1: b", "2: c"]
```

### 2) Compose lazily, execute with terminal operators

```ts
const query = Tyneq.range(1, 100)
	.where(n => n % 2 === 0)
	.select(n => n * n)
	.take(5);

// No execution yet
const topFiveSquares = query.toArray(); // [4, 16, 36, 64, 100]
```

### 3) Re-iterate safely

```ts
const q = Tyneq.range(1, 3).select(x => x * 10);

q.toArray(); // [10, 20, 30]
q.toArray(); // [10, 20, 30]
```

## Operator Overview

Tyneq currently includes broad operator support across query scenarios.

### Terminal operators

`any`, `all`, `contains`, `count`, `defaultIfEmpty`, `elementAt`, `elementAtOrDefault`, `first`, `firstOrDefault`, `indexOf`, `last`, `lastOrDefault`, `max`, `maxBy`, `min`, `minBy`, `sequenceEqual`, `single`, `singleOrDefault`, `startsWith`, `sum`, `toArray`, `toMap`, `toRecord`, `toSet`

### Streaming operators

`append`, `concat`, `prepend`, `select`, `selectMany`, `skip`, `skipWhile`, `take`, `takeWhile`, `tap`, `tapIf`, `throttle`, `where`, `zip`

### Buffering operators

`chunk`, `skipLast`, `split`, `distinct`, `distinctBy`, `except`, `exceptBy`, `intersect`, `intersectBy`, `join`, `groupJoin`, `groupBy`, `orderBy`, `orderByDescending`, `reverse`, `shuffle`, `union`, `unionBy`, `memoize`

### Extension point

`pipe` lets you build custom operators while still returning Tyneq sequences.

## Advanced Examples

### Relational joins

```ts
const users = Tyneq.from([
	{ id: 1, name: "Ada" },
	{ id: 2, name: "Grace" },
]);

const posts = Tyneq.from([
	{ userId: 1, title: "Type Systems" },
	{ userId: 1, title: "Compilers" },
	{ userId: 2, title: "Distributed Systems" },
]);

const joined = users
	.join(
		posts,
		u => u.id,
		p => p.userId,
		(u, p) => `${u.name}: ${p.title}`
	)
	.toArray();
```

### Ordered pipelines

```ts
const leaderboard = Tyneq.from([
	{ team: "core", score: 10, name: "Ada" },
	{ team: "core", score: 10, name: "Grace" },
	{ team: "infra", score: 12, name: "Linus" },
])
	.orderByDescending(x => x.score)
	.thenBy(x => x.team)
	.thenBy(x => x.name)
	.toArray();
```

### Memoized enumerables

```ts
const source = Tyneq.range(1, 5)
	.tap(n => console.log("expensive", n))
	.shuffle()
	.memoize();

source.toArray(); // triggers source pipeline
source.toArray(); // uses cache

source.refresh(); // clear cache
source.toArray(); // recompute
```

## Execution Model

- **Streaming operators** process one element at a time and keep memory overhead low.
- **Buffering operators** materialize data internally when needed (sorting, grouping, set ops, shuffle).
- **Terminal operators** execute the pipeline and return concrete results.

This model makes performance characteristics more predictable as your query chains grow.

## Error Handling

Tyneq validates inputs and provides domain-specific errors (for example: invalid arguments, null/undefined where not allowed, out-of-range values, invalid operations on empty/non-matching sequences).

## Roadmap

Tyneq is actively evolving. More operators and query capabilities are planned, with a focus on:

- broader LINQ parity
- ergonomic TypeScript signatures
- predictable performance semantics
- documentation and examples for production use

## Development

```bash
npm run build
npm run test
npm run test:coverage
```

## Contributing

Issues and PRs are welcome.

- Bug reports: https://github.com/chrisitopherus/tyneq/issues
- Repository: https://github.com/chrisitopherus/tyneq

## License

MIT
