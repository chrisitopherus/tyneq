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
// ["Grace (97)", "Ada (84)"]
```

---

## Installation

```bash
npm install tyneq
```

Requires TypeScript 5.x with `"strictNullChecks": true`. No separate `@types` package.

---

## Why Tyneq

| Feature | Tyneq | Generic iterator libs |
|---|---|---|
| Lazy evaluation | ✅ | ✅ |
| Re-iterable sequences | ✅ | ❌ one-shot |
| Streaming vs buffering distinction | ✅ | ❌ |
| Relational joins / group joins | ✅ | ❌ |
| Multi-key ordering pipeline | ✅ | ❌ |
| Built-in memoization | ✅ | ❌ |
| Running aggregates (`scan`) | ✅ | ❌ |
| Async bridge (`toAsync`) | ✅ | ❌ |
| Custom operator registration | ✅ | ❌ |
| Query plan introspection | ✅ | ❌ |
| TypeScript-first generics | ✅ | varies |
| Zero dependencies | ✅ | varies |

---

## Quick Start

```ts
import { Tyneq } from "tyneq";

// From any iterable
Tyneq.from([1, 2, 3]);
Tyneq.from(new Set([1, 2, 3]));
Tyneq.range(1, 5);     // [1, 2, 3, 4, 5]
Tyneq.empty<number>();

// Nothing runs until a terminal operator is called
const query = Tyneq.range(1, 100)
  .where(n => n % 2 === 0)
  .select(n => n * n)
  .take(5);

query.toArray(); // [4, 16, 36, 64, 100]

// Sequences are re-iterable — call as many times as you want
query.toArray(); // [4, 16, 36, 64, 100]  ← same result, independent state

// Standard iteration protocols
for (const n of query) console.log(n);
const arr = [...query]; // spread works
```

---

## Operators

Every operator falls into one of three categories:

| Kind | Memory | When it runs |
|---|---|---|
| **Streaming** | O(1) | One element at a time, lazily |
| **Buffering** | O(n) | Materializes full source before yielding |
| **Terminal** | — | Executes the pipeline, returns a value |

### Factories

| | |
|---|---|
| `Tyneq.from(source)` | Any `Iterable<T>` |
| `Tyneq.range(start, count)` | Integer sequence |
| `Tyneq.empty<T>()` | Empty sequence |
| `Tyneq.enumerate(source)` | Pair each element with its zero-based index as `[number, T]` |
| `Tyneq.random(count, randomizer)` | Sequence from a callback |

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
| `zip(other, selector)` | Pair elements from two sequences; stops at shorter |
| `scan(seed, fn)` | Emit running accumulator after each element |
| `pairwise()` | Overlapping `[prev, curr]` pairs |
| `chunk(size)` | Fixed-size chunks |
| `split(pred)` | Split on matching elements |
| `defaultIfEmpty(value)` | Yield source, or `value` if empty |
| `populate(value)` | Replace every element with `value` |
| `cast<U>()` | Compile-time type assertion |
| `ofType<U>(guard)` | Filter and narrow by type guard |
| `tap(fn)` | Side-effect per element, pass-through |
| `tapIf(fn, pred)` | `tap` guarded by a condition |
| `throttle(n)` | Emit every `n`th element |
| `pipe(factory)` | Custom transformation |

### Buffering

| | |
|---|---|
| `orderBy(key, cmp?)` | Sort ascending |
| `orderByDescending(key, cmp?)` | Sort descending |
| `thenBy(key, cmp?)` | Secondary ascending sort |
| `thenByDescending(key, cmp?)` | Secondary descending sort |
| `groupBy(key, value, result)` | Group by key, map each group |
| `distinct()` | Remove duplicates |
| `distinctBy(key)` | Remove duplicates by projected key |
| `reverse()` | Reverse |
| `shuffle()` | Random permutation |
| `union(other)` | Union with deduplication |
| `unionBy(other, key)` | Union deduplicated by key |
| `intersect(other)` | Elements in both sequences |
| `intersectBy(other, key)` | Intersection by key |
| `except(other)` | Elements not in `other` |
| `exceptBy(other, key)` | Difference by key |
| `join(inner, outerKey, innerKey, result)` | Inner join |
| `groupJoin(inner, outerKey, innerKey, result)` | Left outer join with grouped inner results |
| `backsert(index, other)` | Insert `other` from-end at `index` |
| `memoize()` | Cache across re-enumerations |

### Terminal

| | |
|---|---|
| `toArray()` | `Array<T>` |
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

Register custom operators with no source modifications. They are available on all sequences at import time.

```ts
import { createStreamingOperator } from "tyneq";

createStreamingOperator({
  name: "repeatEach",
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

See the [Custom Operators guide](https://chrisitopherus.github.io/tyneq/guide/extensibility) for all five registration APIs, validation patterns, class-based operators, and the `OperatorRegistry`.

---

## Query Plan Inspection

Every sequence carries a query plan tree describing the operators applied to it.

```ts
import { Tyneq, tyneqQueryNode, QueryPlanPrinter } from "tyneq";

const seq = Tyneq.from([1, 2, 3])
  .where(x => x > 1)
  .select(x => x * 2)
  .take(5);

console.log(QueryPlanPrinter.print(seq[tyneqQueryNode]!));
// from([1, 2, 3])
//   → where(<fn>)
//   → select(<fn>)
//   → take(5)
```

Plans can also be traversed with a `QueryPlanVisitor<T>`. See the [Query Plan guide](https://chrisitopherus.github.io/tyneq/guide/query-plan).

---

## Documentation

**[chrisitopherus.github.io/tyneq](https://chrisitopherus.github.io/tyneq/)**

| | |
|---|---|
| [Getting Started](https://chrisitopherus.github.io/tyneq/guide/getting-started) | Install and first query |
| [Concepts](https://chrisitopherus.github.io/tyneq/guide/concepts) | Sequences, operators, deferred execution |
| [Operators Overview](https://chrisitopherus.github.io/tyneq/guide/operators-overview) | Full operator list |
| [Extensibility](https://chrisitopherus.github.io/tyneq/guide/extensibility) | Custom operators |
| [Query Plan](https://chrisitopherus.github.io/tyneq/guide/query-plan) | Introspection and visitors |
| [API Reference](https://chrisitopherus.github.io/tyneq/api/) | Full generated API docs |

---

## Contributing

See the [Contributor Guide](https://chrisitopherus.github.io/tyneq/guide/contributing).

```bash
git clone https://github.com/chrisitopherus/tyneq
npm install
npm run build    # compile CJS + ESM + types
npm test         # run test suite
npm run lint     # check style
npm run docs:dev # local docs site
```

Bug reports and feature requests: [github.com/chrisitopherus/tyneq/issues](https://github.com/chrisitopherus/tyneq/issues)

---

## License

[MIT](./LICENSE) © [chrisitopherus](https://github.com/chrisitopherus)
