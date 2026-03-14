<div align="center">
  <br />
  <a href="https://github.com/chrisitopherus/tyneq">
    <img src="./docs/public/logo.svg" alt="Tyneq" width="100" height="100" />
  </a>
  <h1>tyneq</h1>
  <p><strong>Typed Enumerable Queries for TypeScript</strong></p>
  <p>A LINQ-inspired query library with lazy pipelines, re-iterable sequences, and 50+ typed operators.</p>

  <p>
    <a href="https://www.npmjs.com/package/tyneq">
      <img src="https://img.shields.io/npm/v/tyneq?style=flat-square&color=0ea5e9" alt="npm version" />
    </a>
    <a href="https://www.npmjs.com/package/tyneq">
      <img src="https://img.shields.io/npm/dm/tyneq?style=flat-square&color=38bdf8" alt="npm downloads" />
    </a>
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/dependencies-zero-22c55e?style=flat-square" alt="zero dependencies" />
    <a href="./LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-a78bfa?style=flat-square" alt="MIT license" />
    </a>
  </p>

  <p>
    <a href="https://chrisitopherus.github.io/tyneq/guide/">Documentation</a>
    ·
    <a href="https://chrisitopherus.github.io/tyneq/api/">API Reference</a>
    ·
    <a href="https://github.com/chrisitopherus/tyneq/issues">Report an Issue</a>
  </p>
  <br />
</div>

---

## Overview

**Tyneq** models data queries as **typed, composable pipelines** over any iterable source. Inspired by LINQ, it brings lazy evaluation, re-iterable sequences, and relational operators to modern TypeScript — without a single runtime dependency.

```ts
import { Tyneq } from "tyneq";

const topScorers = Tyneq
  .from([
    { id: 1, name: "Ada",   team: "core",  score: 84 },
    { id: 2, name: "Linus", team: "infra", score: 92 },
    { id: 3, name: "Grace", team: "core",  score: 97 },
  ])
  .where(p => p.team === "core")
  .orderByDescending(p => p.score)
  .select(p => `${p.name} (${p.score})`)
  .toArray();

// ["Grace (97)", "Ada (84)"]
```

---

## Table of Contents

- [Why Tyneq](#why-tyneq)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Operator Reference](#operator-reference)
- [Advanced Recipes](#advanced-recipes)
- [Execution Model](#execution-model)
- [Extensibility](#extensibility)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Why Tyneq

Many iterator utilities in the JS ecosystem are thin wrappers over single-use generators. Tyneq is designed as a **query system**.

| Feature | Tyneq | Generic iterator libs |
|---|---|---|
| Lazy evaluation | ✅ | ✅ |
| Re-iterable sequences | ✅ | ❌ (one-shot) |
| Buffering vs streaming distinction | ✅ | ❌ |
| Relational joins / group joins | ✅ | ❌ |
| Multi-key ordering pipeline | ✅ | ❌ |
| Built-in memoization | ✅ | ❌ |
| Custom operator registration | ✅ | ❌ |
| TypeScript-first generics | ✅ | varies |
| Zero dependencies | ✅ | varies |

---

## Installation

```bash
npm install tyneq
```

```bash
yarn add tyneq
```

```bash
pnpm add tyneq
```

> Requires TypeScript 5.x and `"strictNullChecks": true`.

---

## Quick Start

### Create sequences

```ts
import { Tyneq } from "tyneq";

const fromArray = Tyneq.from([1, 2, 3]);
const range     = Tyneq.range(10, 5);     // [10, 11, 12, 13, 14]
const empty     = Tyneq.empty<number>();

const indexed = Tyneq.enumerate(["a", "b", "c"])
  .select(([i, value]) => `${i}: ${value}`)
  .toArray();
// ["0: a", "1: b", "2: c"]
```

### Compose lazily, execute explicitly

Nothing runs until you call a terminal operator.

```ts
const query = Tyneq.range(1, 100)
  .where(n => n % 2 === 0)
  .select(n => n * n)
  .take(5);

// Pipeline is defined — no iteration yet.
query.toArray(); // [4, 16, 36, 64, 100]
```

### Re-iterate safely

Tyneq sequences are **re-iterable** — unlike raw generators, they can be consumed multiple times.

```ts
const q = Tyneq.range(1, 3).select(x => x * 10);

q.toArray(); // [10, 20, 30]
q.toArray(); // [10, 20, 30]  ← same result, no side effects
```

---

## Core Concepts

### Operator kinds

| Kind | When it runs | Memory | Examples |
|---|---|---|---|
| **Streaming** | One element at a time, lazily | O(1) | `where`, `select`, `take`, `skip` |
| **Buffering** | Materializes internally before yielding | O(n) | `orderBy`, `groupBy`, `distinct`, `shuffle` |
| **Terminal** | Executes the pipeline, returns a value | — | `toArray`, `first`, `count`, `sum` |

Understanding the kind of each operator lets you reason about performance upfront — no surprises as pipelines grow.

### Re-iteration vs memoization

```ts
// Re-iterable: re-executes source each time (safe with pure sources)
const q = Tyneq.range(1, 1000).where(n => n % 3 === 0);
q.toArray(); // runs the pipeline
q.toArray(); // runs the pipeline again

// Memoized: caches results after first iteration
const m = q.memoize();
m.toArray(); // runs + caches
m.toArray(); // returns cached result

m.refresh(); // clear cache
m.toArray(); // runs again
```

---

## Operator Reference

### Terminal operators

> Return a concrete value and execute the pipeline.

`any` · `all` · `contains` · `count` · `defaultIfEmpty` · `elementAt` · `elementAtOrDefault` · `first` · `firstOrDefault` · `indexOf` · `last` · `lastOrDefault` · `max` · `maxBy` · `min` · `minBy` · `sequenceEqual` · `single` · `singleOrDefault` · `startsWith` · `sum` · `toArray` · `toMap` · `toRecord` · `toSet`

### Streaming operators

> Process one element at a time without buffering.

`append` · `concat` · `prepend` · `select` · `selectMany` · `skip` · `skipWhile` · `take` · `takeWhile` · `tap` · `tapIf` · `throttle` · `where` · `zip`

### Buffering operators

> Materialize data internally when the operation requires it.

`chunk` · `skipLast` · `split` · `distinct` · `distinctBy` · `except` · `exceptBy` · `intersect` · `intersectBy` · `join` · `groupJoin` · `groupBy` · `orderBy` · `orderByDescending` · `reverse` · `shuffle` · `union` · `unionBy` · `memoize`

### Custom operators

`pipe` lets you attach custom operator logic that still returns a typed Tyneq sequence. See [Extensibility](#extensibility).

---

## Advanced Recipes

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

const result = users
  .join(
    posts,
    u => u.id,
    p => p.userId,
    (u, p) => ({ author: u.name, title: p.title })
  )
  .toArray();
// [
//   { author: "Ada",   title: "Type Systems" },
//   { author: "Ada",   title: "Compilers" },
//   { author: "Grace", title: "Distributed Systems" },
// ]
```

### Multi-key ordering

```ts
const sorted = Tyneq.from([
  { team: "core",  score: 10, name: "Ada" },
  { team: "core",  score: 10, name: "Grace" },
  { team: "infra", score: 12, name: "Linus" },
])
  .orderByDescending(x => x.score)
  .thenBy(x => x.team)
  .thenBy(x => x.name)
  .toArray();
```

### Grouping

```ts
const byTeam = Tyneq.from([
  { name: "Ada",   team: "core" },
  { name: "Grace", team: "core" },
  { name: "Linus", team: "infra" },
])
  .groupBy(p => p.team)
  .select(g => ({ team: g.key, members: g.toArray() }))
  .toArray();
```

### Memoized pipelines

```ts
const source = Tyneq.range(1, 5)
  .tap(n => console.log("computing", n))
  .shuffle()
  .memoize();

source.toArray(); // logs "computing" 5 times, caches result
source.toArray(); // returns cached — no logs
source.refresh();
source.toArray(); // recomputes — logs again
```

### Set operations

```ts
const a = Tyneq.from([1, 2, 3, 4]);
const b = Tyneq.from([3, 4, 5, 6]);

a.intersect(b).toArray(); // [3, 4]
a.except(b).toArray();    // [1, 2]
a.union(b).toArray();     // [1, 2, 3, 4, 5, 6]
```

---

## Execution Model

Tyneq makes execution timing **explicit**:

- **Streaming operators** defer work per element. A `where().select().take(1)` on a million-element source only processes elements until the first match — no full scan.
- **Buffering operators** must see the full input before producing output. `orderBy`, `groupBy`, `distinct`, `shuffle` all fall into this category.
- **Terminal operators** trigger execution and return a concrete value. The pipeline runs top-to-bottom exactly once per terminal call (unless memoized).

This model makes it straightforward to reason about when work happens and how much memory a query will use.

---

## Extensibility

Tyneq has a public API for registering custom operators — no source modifications required.

```ts
import { createOperator } from "tyneq";

// Register a streaming operator
const double = createOperator("double", source =>
  source.select(x => x * 2)
);

Tyneq.from([1, 2, 3]).double().toArray(); // [2, 4, 6]
```

You can also use the `@operator` and `@terminal` decorators for class-based enumerators. See the [Extensibility guide](https://chrisitopherus.github.io/tyneq/guide/extensibility) for the full API.

---

## Documentation

Full documentation, operator guides, and the API reference are available at:

**[chrisitopherus.github.io/tyneq](https://chrisitopherus.github.io/tyneq/)**

| | |
|---|---|
| [Guide: Getting Started](https://chrisitopherus.github.io/tyneq/guide/getting-started) | Install and write your first query |
| [Guide: Core Concepts](https://chrisitopherus.github.io/tyneq/guide/concepts) | Sequences, operators, and the execution model |
| [Guide: Extensibility](https://chrisitopherus.github.io/tyneq/guide/extensibility) | Custom operators and query plans |
| [API Reference](https://chrisitopherus.github.io/tyneq/api/) | Full generated API docs |

---

## Contributing

Contributions are welcome. See the [Contributor Guide](https://chrisitopherus.github.io/tyneq/guide/contributing) for the operator addition workflow, test conventions, and code style.

- **Bug reports / feature requests:** [github.com/chrisitopherus/tyneq/issues](https://github.com/chrisitopherus/tyneq/issues)
- **Repository:** [github.com/chrisitopherus/tyneq](https://github.com/chrisitopherus/tyneq)

### Development

```bash
npm run build          # compile
npm run test           # run test suite
npm run test:coverage  # coverage report
npm run docs:dev       # local docs site
```

---

## License

[MIT](./LICENSE) © [chrisitopherus](https://github.com/chrisitopherus)
