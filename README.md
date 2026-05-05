<div align="center">
  <br />
  <a href="https://github.com/chrisitopherus/tyneq">
    <img src="./docs/public/logo.svg" alt="Tyneq" width="180" height="180" />
  </a>
  <h1>tyneq</h1>
  <p><strong>Lazy query pipelines for TypeScript.</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/tyneq">
      <img src="https://img.shields.io/npm/v/tyneq?style=flat-square&color=0ea5e9" alt="npm version" />
    </a>
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/dependencies-zero-22c55e?style=flat-square" alt="zero dependencies" />
    <a href="./LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-a78bfa?style=flat-square" alt="MIT license" />
    </a>
  </p>

  <p>
    <a href="https://chrisitopherus.github.io/tyneq/guide/">Guide</a>
    &nbsp;&middot;&nbsp;
    <a href="https://chrisitopherus.github.io/tyneq/api/">API Reference</a>
    &nbsp;&middot;&nbsp;
    <a href="https://github.com/chrisitopherus/tyneq/issues">Issues</a>
  </p>
  <br />
</div>

---

```ts
import { Tyneq } from "tyneq";

const topScorers = Tyneq
  .from([
    { name: "Ada",   team: "core",  score: 84 },
    { name: "Linus", team: "infra", score: 92 },
    { name: "Grace", team: "core",  score: 97 },
  ])
  .where((p) => p.team === "core")
  .orderByDescending((p) => p.score)
  .select((p) => `${p.name} (${p.score})`)
  .toArray();
// ["Grace (97)", "Ada (84)"]
```

Nothing runs until `.toArray()`. Every operator is deferred, fully typed, and the same query can be re-evaluated as many times as you want.

---

## What is this?

Tyneq is a LINQ-style query pipeline library for TypeScript. You compose operators on a sequence, nothing executes until you call a terminal, and you can reuse the same query without rebuilding it.

It is not a thin wrapper around `Array.prototype`. It is a pipeline engine with a deliberate execution model, a real query plan system, and a plugin API that lets you ship custom operators as standalone packages.

---

## Why Tyneq?

### Sequences, not cursors

Most iterator libraries give you a one-shot cursor. Once you consume it, it is gone. Tyneq sequences are re-iterable by default - call any terminal as many times as you want, each gets independent state.

```ts
const active = Tyneq.from(users)
  .where((u) => u.active)
  .orderByDescending((u) => u.score);

active.count();                         // 3
active.first().name;                    // "Grace"
active.select((u) => u.email).toArray(); // ["g@...", "l@...", "a@..."]
```

No re-wrapping. No rebuilding. Same query, three independent evaluations.

### You always know what is happening

Every operator is explicitly **streaming** (O(1) memory, one element at a time) or **buffering** (reads the full source once, then serves from a buffer). There is no hidden materialization and no guessing about when data gets copied.

```ts
Tyneq.from(largeDataset)
  .where((x) => x.active)     // streaming
  .orderBy((x) => x.score)    // buffering - reads all matching, sorts once
  .take(10)                    // streaming - stops after 10
  .toArray();                  // terminal - kicks everything off
```

### Query plans you can actually use

Every sequence carries a live description of its pipeline. Print it, walk it with a visitor, rewrite it with a transformer, or compile it back into an executable sequence.

```ts
import { QueryPlanPrinter, QueryPlanCompiler, QueryPlanOptimizer, tyneqQueryNode } from "tyneq";

const seq = Tyneq.from(data)
  .where((x) => x > 0)
  .where((x) => x < 100)
  .select((x) => x * 2);

// Print the plan
console.log(QueryPlanPrinter.print(seq[tyneqQueryNode]!));
// from([...])
//   -> where(<fn>)
//   -> where(<fn>)
//   -> select(<fn>)

// Compile with optimization - fuses the two where nodes
const compiler = new QueryPlanCompiler([new QueryPlanOptimizer()]);
compiler.compile(seq[tyneqQueryNode]!).toArray();
```

The compiler turns plans into executable sequences. Store a pipeline as metadata, optimize it, swap the data source, replay it. Pipelines become data.

### Extensible to the core

Custom operators look and behave exactly like built-ins. They get registered at import time, appear on every sequence, and show up in query plans.

```ts
import { createGeneratorOperator } from "tyneq";

createGeneratorOperator({
  name: "repeatEach",
  category: "streaming",
  *generator(source: Iterable<unknown>, times: number) {
    for (const item of source) {
      for (let i = 0; i < times; i++) yield item;
    }
  },
  validate(times) {
    if (times < 1) throw new RangeError("times must be >= 1");
  },
});

declare module "tyneq" {
  interface TyneqSequence<T> {
    repeatEach(times: number): TyneqSequence<T>;
  }
}

Tyneq.from([1, 2, 3]).repeatEach(2).toArray();
// [1, 1, 2, 2, 3, 3]
```

Two registration styles: functional (generators, factories, terminals) and class-based (decorators with full lifecycle). Ship it as a package - consumers import once and every sequence gains the operator.

---

## Quick comparison

| | Tyneq | Typical iterator lib |
|---|---|---|
| Deferred execution | yes | yes |
| Re-iterable sequences | yes | often no |
| Explicit streaming vs. buffering | yes | usually implicit |
| Multi-key ordering (`thenBy`) | yes | varies |
| Joins and group joins | yes | rare |
| Built-in memoization | yes | rare |
| Custom operator plugin API | yes | rare |
| Query plan + compiler | yes | very rare |
| Zero runtime dependencies | yes | varies |

---

## Install

```bash
npm install tyneq
```

TypeScript 5.x with `"strictNullChecks": true`. No `@types` package needed.

---

## Quick tour

```ts
import { Tyneq } from "tyneq";

// Wrap any iterable
Tyneq.from([1, 2, 3]);
Tyneq.from(new Set(["a", "b"]));
Tyneq.range(1, 5);    // [1, 2, 3, 4, 5]
Tyneq.empty<number>();

// Compose operators - nothing runs yet
const query = Tyneq.range(1, 1_000_000)
  .where((n) => n % 2 === 0)
  .select((n) => n * n)
  .take(5);

// Execute with a terminal
query.toArray();  // [4, 16, 36, 64, 100]
query.count();    // 5 - same query, independent traversal
query.first();    // 4

// Standard iteration works too
for (const n of query) console.log(n);
const arr = [...query];
```

Multi-key sorting, grouping, joins - all built in:

```ts
Tyneq.from(employees)
  .where((e) => e.department === "engineering")
  .orderBy((e) => e.level)
  .thenByDescending((e) => e.yearsAtCompany)
  .groupBy(
    (e) => e.team,
    (e) => e.name,
    (team, members) => ({ team, members: members.toArray() })
  )
  .toArray();
```

---

## Operators

80+ operators across three categories.

### Streaming (O(1) memory)

`select` `where` `take` `takeWhile` `takeUntil` `skip` `skipWhile` `skipLast` `skipUntil` `slice` `selectMany` `flatten` `append` `prepend` `concat` `zip` `scan` `pairwise` `window` `chunk` `split` `repeat` `defaultIfEmpty` `populate` `ofType` `tap` `tapIf` `throttle` `pipe`

### Buffering (reads full source once)

`orderBy` `orderByDescending` `thenBy` `thenByDescending` `groupBy` `distinct` `distinctBy` `reverse` `shuffle` `union` `unionBy` `intersect` `intersectBy` `except` `exceptBy` `join` `groupJoin` `backsert` `memoize` `permutations`

### Terminal (executes the pipeline)

`toArray` `toSet` `toMap` `toRecord` `toAsync` `first` `firstOrDefault` `last` `lastOrDefault` `single` `singleOrDefault` `elementAt` `elementAtOrDefault` `count` `countBy` `sum` `average` `min` `max` `minBy` `maxBy` `minMax` `aggregate` `any` `all` `contains` `indexOf` `sequenceEqual` `startsWith` `endsWith` `isNullOrEmpty` `consume`

---

## Query plan

Every sequence carries a query plan tree. Access it, print it, walk it, transform it, or compile it back into an executable sequence.

```ts
import { QueryPlanPrinter, tyneqQueryNode } from "tyneq";

const seq = Tyneq.from([1, 2, 3])
  .where((x) => x > 1)
  .select((x) => x * 2)
  .take(5);

console.log(QueryPlanPrinter.print(seq[tyneqQueryNode]!));
// from([1, 2, 3])
//   -> where(<fn>)
//   -> select(<fn>)
//   -> take(5)
```

The `QueryPlanCompiler` takes any plan node and produces a fully executable sequence. Pass a `source` option to run the same pipeline against different data without rebuilding it:

```ts
const plan = Tyneq.from(data).where((x) => x > 0).select((x) => x * 2)[tyneqQueryNode]!;
const compiler = new QueryPlanCompiler();

compiler.compile(plan, { source: datasetA }).toArray();
compiler.compile(plan, { source: datasetB }).toArray();
```

Store pipelines as metadata, optimize them, replay them on any source. See the [Query Plan guide](https://chrisitopherus.github.io/tyneq/guide/query-plan) for the full picture.

---

## Docs

**[chrisitopherus.github.io/tyneq](https://chrisitopherus.github.io/tyneq/)**

| | |
|---|---|
| [Getting Started](https://chrisitopherus.github.io/tyneq/guide/getting-started) | Install, first query, sources, re-iteration |
| [Core Concepts](https://chrisitopherus.github.io/tyneq/guide/concepts) | Execution model, streaming vs. buffering, memoization |
| [Operators](https://chrisitopherus.github.io/tyneq/guide/operators) | All 80+ operators with examples |
| [Custom Operators](https://chrisitopherus.github.io/tyneq/guide/extensibility) | Functional API and decorators |
| [Plugin Internals](https://chrisitopherus.github.io/tyneq/guide/plugin-internals) | Registry, custom enumerators, utility helpers |
| [Query Plan](https://chrisitopherus.github.io/tyneq/guide/query-plan) | Plan access, printing, walking, transforming, compiling |
| [Best Practices](https://chrisitopherus.github.io/tyneq/guide/best-practices) | Patterns, pitfalls, and performance guidance |
| [API Reference](https://chrisitopherus.github.io/tyneq/api/) | Full generated API docs |

---

## Stability

Tyneq follows [Semantic Versioning](https://semver.org/). The public API contract covers:

- All methods on `TyneqSequence`, `TyneqOrderedSequence`, and `TyneqCachedSequence`
- All symbols exported from the `tyneq`, `tyneq/plugin`, and `tyneq/utility` subpaths
- The `Tyneq` static factory class

Internal classes (`TyneqEnumerableBase`, `TyneqEnumerableCore`, and anything tagged `@internal`) are **not** part of the contract and may change between minor versions.

---

## Contributing

```bash
git clone https://github.com/chrisitopherus/tyneq
npm install
npm run build    # compile CJS + ESM + types
npm test         # run test suite
npm run lint     # check style
npm run docs:dev # local docs site
```

See the [Contributing guide](https://chrisitopherus.github.io/tyneq/guide/contributing) for the full workflow, including how to add operators, run the test suite, and submit a PR.

Bug reports and feature requests: [github.com/chrisitopherus/tyneq/issues](https://github.com/chrisitopherus/tyneq/issues)

---

## License

[MIT](./LICENSE) Copyright (c) 2026 [chrisitopherus](https://github.com/chrisitopherus)
