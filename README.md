<div align="center">
  <br />
  <a href="https://github.com/chrisitopherus/tyneq">
    <img src="./docs/public/logo.svg" alt="Tyneq" width="180" height="180" />
  </a>
  <h1>tyneq</h1>
  <p><strong>Typed Enumerable Queries for TypeScript</strong></p>
  <p>A LINQ-inspired query library with lazy pipelines, re-iterable sequences, and 60+ typed operators.</p>

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
    <a href="https://chrisitopherus.github.io/tyneq/guide/">Documentation</a>
    ·
    <a href="https://chrisitopherus.github.io/tyneq/api/">API Reference</a>
    ·
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
  .where(p => p.team === "core")
  .orderByDescending(p => p.score)
  .select(p => `${p.name} (${p.score})`)
  .toArray();
// -> ["Grace (97)", "Ada (84)"]
```

---

## Why Tyneq

Tyneq is built for teams that want LINQ-style expressiveness in TypeScript without giving up control of execution behavior.

- Predictable execution model: streaming and buffering are explicit, so performance characteristics are easier to reason about.
- Re-iterable by default: one query can power multiple terminals without accidental one-shot iterator surprises.
- Strong TypeScript ergonomics: generic operators, module augmentation support, and strict typing throughout the API.
- Extensible architecture: add custom operators and terminals through decorators or registration APIs.
- Runtime introspection: inspect and debug pipelines with query plan tools.

### At a glance

| Capability | Tyneq | Many generic iterator libs |
|---|---|---|
| Deferred query pipelines | yes | yes |
| Re-iterable sequences | yes | often no |
| Streaming vs buffering operator model | yes | usually implicit |
| Multi-key ordering (`orderBy` + `thenBy`) | yes | varies |
| Joins and group joins | yes | rare |
| Built-in memoization | yes | rare |
| Operator plugin API | yes | rare |
| Query plan tooling | yes | rare |
| Zero runtime dependencies | yes | varies |

---

## Installation

```bash
npm install tyneq
```

Requires TypeScript 5.x with `"strictNullChecks": true`. No separate `@types` package.

---

## Quick Start

```ts
import { Tyneq } from "tyneq";

// Wrap any iterable
const seq = Tyneq.from([1, 2, 3, 4, 5]);
Tyneq.range(1, 5);          // [1, 2, 3, 4, 5]
Tyneq.from(new Set([1, 2]));

// Nothing runs until a terminal is called
const evens = Tyneq.range(1, 100)
  .where(n => n % 2 === 0)
  .select(n => n * n)
  .take(5);

evens.toArray(); // -> [4, 16, 36, 64, 100]
```

Sequences are re-iterable. Call terminals on the same query as many times as you want:

```ts
evens.toArray(); // -> [4, 16, 36, 64, 100] - independent state, no re-build required
evens.count();   // -> 5
```

Standard iteration protocols work out of the box:

```ts
for (const n of evens) console.log(n);
const arr = [...evens];
```

---

## Core Concepts

**Deferred execution.** Operators do not run when you call them - they describe what to do. The source is not touched until a terminal operator (`toArray`, `first`, `count`, etc.) forces evaluation.

**Streaming vs. buffering.** Streaming operators (`where`, `select`, `take`, ...) process one element at a time with O(1) memory. Buffering operators (`orderBy`, `groupBy`, `distinct`, ...) must read the entire source before producing output.

**Re-iteration.** Every `TyneqSequence` is re-iterable: each iteration is independent and starts from the source. Use `memoize()` to cache results across iterations when re-evaluating from the source is expensive.

**Query plan.** Every sequence carries a linked chain of `QueryPlanNode` instances describing the pipeline. Inspect it at runtime, print it for debugging, walk it with a `QueryPlanWalker`, or compile it back into a live sequence with `QueryPlanCompiler`.

---

## Operators

### Factories

| | |
|---|---|
| `Tyneq.from(source)` | Any `Iterable<T>` |
| `Tyneq.range(start, count)` | Integer sequence |
| `Tyneq.empty<T>()` | Empty sequence |
| `Tyneq.enumerate(source)` | Pair each element with its zero-based index as `[number, T]` |
| `Tyneq.random(count, fn)` | Sequence from a callback |

### Streaming

| | |
|---|---|
| `select(fn)` | Project each element |
| `selectMany(fn)` | Project and flatten |
| `where(pred)` | Filter |
| `take(n)` | First `n` elements |
| `takeWhile(pred)` | Take while predicate holds |
| `skip(n)` | Skip first `n` |
| `skipWhile(pred)` | Skip while predicate holds |
| `skipLast(n)` | Skip last `n` |
| `append(item)` | Append a single element |
| `prepend(item)` | Prepend a single element |
| `concat(other)` | Concatenate two sequences |
| `zip(other, selector)` | Pair elements from two sequences; stops at the shorter |
| `scan(seed, fn)` | Emit running accumulator after each element |
| `pairwise()` | Overlapping `[prev, curr]` pairs |
| `chunk(size)` | Fixed-size chunks |
| `split(pred)` | Split on matching elements |
| `defaultIfEmpty(value)` | Yield source, or `value` if empty |
| `populate(value)` | Replace every element with `value` |
| `cast<U>()` | Compile-time type assertion (no runtime check) |
| `ofType<U>(guard)` | Filter and narrow by type guard |
| `tap(fn)` | Side-effect per element, pass-through |
| `tapIf(fn, pred)` | `tap` gated by a condition |
| `throttle(n)` | Emit every `n`th element |
| `pipe(factory)` | Custom one-off transformation |

### Buffering

| | |
|---|---|
| `orderBy(key, cmp?)` | Sort ascending |
| `orderByDescending(key, cmp?)` | Sort descending |
| `thenBy(key, cmp?)` | Secondary ascending sort |
| `thenByDescending(key, cmp?)` | Secondary descending sort |
| `groupBy(key, value, result)` | Group by key |
| `distinct()` | Remove duplicates |
| `distinctBy(key)` | Remove duplicates by key |
| `reverse()` | Reverse |
| `shuffle()` | Random permutation |
| `union(other)` | Union with deduplication |
| `unionBy(other, key)` | Union deduplicated by key |
| `intersect(other)` | Elements in both sequences |
| `intersectBy(other, key)` | Intersection by key |
| `except(other)` | Elements not in `other` |
| `exceptBy(other, key)` | Difference by key |
| `join(inner, outerKey, innerKey, result)` | Inner join |
| `groupJoin(inner, outerKey, innerKey, result)` | Left outer join with grouped inner |
| `backsert(index, other)` | Insert `other` counting from the end |
| `memoize()` | Cache across re-enumerations |

### Terminal

| | |
|---|---|
| `toArray()` | `T[]` |
| `toSet()` | `Set<T>` |
| `toMap(selector)` | `Map<K, V>` |
| `toRecord(selector)` | `Record<K, V>` |
| `toAsync()` | `AsyncIterable<T>` |
| `first(pred)` | First match (throws if none) |
| `firstOrDefault(pred, default)` | First match or default |
| `last(pred)` | Last match (throws if none) |
| `lastOrDefault(pred, default)` | Last match or default |
| `single(pred)` | Exactly one match (throws otherwise) |
| `singleOrDefault(pred, default)` | One match or default (throws if multiple) |
| `elementAt(index)` | Element at index (throws if out of range) |
| `elementAtOrDefault(index, default)` | Element at index or default |
| `count()` | Number of elements |
| `countBy(pred)` | Count matching elements |
| `sum(selector)` | Sum |
| `average(selector)` | Arithmetic mean |
| `min(cmp?)` | Minimum |
| `max(cmp?)` | Maximum |
| `minBy(key, cmp?)` | Element with minimum key |
| `maxBy(key, cmp?)` | Element with maximum key |
| `minMax(cmp?)` | Both min and max in one pass |
| `aggregate(seed, fn, result)` | General fold |
| `any(pred)` | `true` if any element matches |
| `all(pred)` | `true` if all elements match |
| `contains(value)` | `true` if value is present |
| `indexOf(pred, start?)` | Index of first match, or `-1` |
| `sequenceEqual(other, cmp?)` | Element-wise equality |
| `startsWith(other)` | `true` if sequence begins with `other` |
| `isNullOrEmpty()` | `true` if empty |
| `consume()` | Drain for side effects |

---

## Extensibility

Register custom operators with no source modifications. They become available on every sequence at import time.

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
// -> [1, 1, 2, 2, 3, 3]
```

Five registration APIs are available: `createGeneratorOperator`, `createOperator`, `createTerminalOperator`, and their ordered/cached variants. Class-based operators can use the `@operator` and `@terminal` decorators instead.

See the [Extensibility guide](https://chrisitopherus.github.io/tyneq/guide/extensibility) for full details.

---

## Query Plan

Every sequence carries a query plan tree describing the operators applied to it.

```ts
import { Tyneq, tyneqQueryNode, QueryPlanPrinter } from "tyneq";

const seq = Tyneq.from([1, 2, 3])
  .where(x => x > 1)
  .select(x => x * 2)
  .take(5);

console.log(QueryPlanPrinter.print(seq[tyneqQueryNode]!));
// from([1, 2, 3])
//   -> where(<fn>)
//   -> select(<fn>)
//   -> take(5)
```

Walk the plan with `QueryPlanWalker`, rewrite it with `QueryPlanTransformer`, optimize it with `QueryPlanOptimizer`, or compile it back to a live sequence with `QueryPlanCompiler`. See the [Query Plan guide](https://chrisitopherus.github.io/tyneq/guide/query-plan).

---

## Documentation

**[chrisitopherus.github.io/tyneq](https://chrisitopherus.github.io/tyneq/)**

| | |
|---|---|
| [Getting Started](https://chrisitopherus.github.io/tyneq/guide/getting-started) | Install and first query |
| [Concepts](https://chrisitopherus.github.io/tyneq/guide/concepts) | Sequences, operators, deferred execution |
| [Operators](https://chrisitopherus.github.io/tyneq/guide/operators) | Full operator reference |
| [Extensibility](https://chrisitopherus.github.io/tyneq/guide/extensibility) | Custom operators and plugins |
| [Plugin Internals](https://chrisitopherus.github.io/tyneq/guide/plugin-internals) | Custom enumerators, registry workflow, utility helpers |
| [Query Plan](https://chrisitopherus.github.io/tyneq/guide/query-plan) | Introspection and visitors |
| [Best Practices](https://chrisitopherus.github.io/tyneq/guide/best-practices) | Patterns and pitfalls |
| [API Reference](https://chrisitopherus.github.io/tyneq/api/) | Full generated API docs |

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

### Docs Publishing (GitHub Pages)

Recommended workflow:

1. Commit only docs source (`docs/guide`, `docs/.vitepress`, generated API markdown if you intentionally version it).
2. Let GitHub Actions build and deploy Pages on push to `main` via `.github/workflows/docs-pages.yml`.
3. Keep branch-based publishing (`npm run docs:publish`) only as a fallback/manual path.

Bug reports and feature requests: [github.com/chrisitopherus/tyneq/issues](https://github.com/chrisitopherus/tyneq/issues)

---

## License

[MIT](./LICENSE) (c) [chrisitopherus](https://github.com/chrisitopherus)
