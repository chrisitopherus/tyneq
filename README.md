<div align="center">
  <br />
  <a href="https://github.com/chrisitopherus/tyneq">
    <img src="./docs/public/logo.svg" alt="Tyneq" width="100" height="100" />
  </a>
  <h1>tyneq</h1>
  <p><strong>Typed Enumerable Queries for TypeScript</strong></p>
  <p>A LINQ-inspired query library with lazy pipelines, re-iterable sequences, and 60+ typed operators.</p>

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
- [Query Plan Inspection](#query-plan-inspection)
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
| Running aggregates (`scan`) | ✅ | ❌ |
| Async bridge (`toAsync`) | ✅ | ❌ |
| Custom operator registration | ✅ | ❌ |
| Query plan introspection | ✅ | ❌ |
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
const fromRange = Tyneq.range(10, 5);       // [10, 11, 12, 13, 14]
const random    = Tyneq.random(5, () => Math.floor(Math.random() * 101)); // 5 random integers in [0, 100]
const empty     = Tyneq.empty<number>();

// Indexed enumeration
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

// Pipeline is defined — no iteration has happened.
query.toArray(); // [4, 16, 36, 64, 100]
```

### Re-iterate safely

Tyneq sequences are **re-iterable** — unlike raw generators, they can be consumed multiple times.

```ts
const q = Tyneq.range(1, 3).select(x => x * 10);

q.toArray(); // [10, 20, 30]
q.toArray(); // [10, 20, 30]  ← same result, independent state
```

---

## Core Concepts

### Operator kinds

| Kind | When it runs | Memory | Examples |
|---|---|---|---|
| **Streaming** | One element at a time, lazily | O(1) | `where`, `select`, `take`, `scan` |
| **Buffering** | Materializes full input before yielding | O(n) | `orderBy`, `groupBy`, `distinct`, `shuffle` |
| **Terminal** | Executes the pipeline, returns a value | — | `toArray`, `first`, `count`, `sum` |

Understanding the kind of each operator lets you reason about performance and memory upfront.

### Re-iteration vs memoization

```ts
// Re-iterable: re-executes the source pipeline each time
const q = Tyneq.range(1, 1000).where(n => n % 3 === 0);
q.toArray(); // runs the pipeline
q.toArray(); // runs it again from scratch

// Memoized: caches results after first iteration
const m = q.memoize();
m.toArray(); // runs + caches
m.toArray(); // returns cached result, no re-execution

m.refresh(); // invalidate the cache
m.toArray(); // recomputes
```

### Using standard iterables

Tyneq sequences implement both `Iterable<T>` and `Iterator<T>`, so they plug directly into
`for...of`, spread syntax, and destructuring with no conversion needed.

```ts
const seq = Tyneq.range(1, 5).where(n => n % 2 !== 0);

for (const n of seq) console.log(n);  // 1, 3, 5
const arr = [...seq];                  // [1, 3, 5]
```

---

## Operator Reference

### Factories

> Create a new typed sequence from a source.

| Operator | Description |
|---|---|
| `Tyneq.from(source)` | Wrap any `Iterable<T>` or `Array<T>` |
| `Tyneq.range(start, count)` | Integer sequence from `start` of length `count` |
| `Tyneq.empty<T>()` | Empty sequence |
| `Tyneq.enumerate(source)` | Pair each element with its zero-based index |
| `Tyneq.random(count, randomizer)` | Sequence of `count` values produced by a callback |

---

### Streaming operators

> Process one element at a time. O(1) memory. Do not require the source to end.

| Operator | Description |
|---|---|
| `select(fn)` | Project each element to a new value |
| `selectMany(fn)` | Project and flatten nested iterables |
| `where(predicate)` | Filter elements |
| `take(n)` | Keep the first `n` elements |
| `takeWhile(predicate)` | Keep elements while predicate holds |
| `skip(n)` | Skip the first `n` elements |
| `skipWhile(predicate)` | Skip elements while predicate holds |
| `skipLast(n)` | Skip the last `n` elements |
| `append(...items)` | Append elements to the end |
| `prepend(...items)` | Prepend elements to the start |
| `concat(other)` | Concatenate two sequences |
| `zip(other, fn?)` | Pair elements from two sequences |
| `scan(seed, fn)` | Running aggregate — emits intermediate accumulator values |
| `pairwise()` | Emit overlapping `[prev, curr]` pairs |
| `chunk(size)` | Split into fixed-size `Array<T>` chunks |
| `window(size)` | Emit overlapping `Array<T>` sliding windows |
| `split(predicate)` | Split into subsequences on a delimiter element |
| `defaultIfEmpty(value)` | Emit a fallback if the source is empty |
| `intersperse(separator)` | Insert a separator element between each pair |
| `populate(value, count)` | Emit a value `count` times |
| `cast<U>()` | Assert each element is `U` (throws on mismatch) |
| `ofType<U>(guard)` | Filter elements to those matching a type guard |
| `tap(fn)` | Side-effect per element without modifying the sequence |
| `tapIf(predicate, fn)` | Conditional side-effect per element |
| `throttle(n)` | Emit every `n`-th element |
| `pipe(fn)` | Apply a custom transformation that returns a new sequence |

---

### Buffering operators

> Materialize the full source internally before producing output. O(n) memory.

| Operator | Description |
|---|---|
| `orderBy(keySelector, comparer?)` | Sort ascending by key |
| `orderByDescending(keySelector, comparer?)` | Sort descending by key |
| `thenBy(keySelector, comparer?)` | Secondary ascending sort (chains on ordered sequence) |
| `thenByDescending(keySelector, comparer?)` | Secondary descending sort |
| `groupBy(keySelector, elementSelector?)` | Group elements into keyed subsequences |
| `distinct(comparer?)` | Remove duplicate elements |
| `distinctBy(keySelector, comparer?)` | Remove duplicates by projected key |
| `reverse()` | Reverse the sequence |
| `shuffle()` | Randomly permute the sequence |
| `union(other, comparer?)` | Union with deduplication |
| `unionBy(other, keySelector, comparer?)` | Union deduplicated by key |
| `intersect(other, comparer?)` | Elements present in both sequences |
| `intersectBy(other, keySelector, comparer?)` | Intersection by key |
| `except(other, comparer?)` | Elements not present in `other` |
| `exceptBy(other, keySelector, comparer?)` | Difference by key |
| `join(inner, outerKey, innerKey, resultSelector)` | Inner join |
| `groupJoin(inner, outerKey, innerKey, resultSelector)` | Left outer join with grouped inner results |
| `backsert(other, index)` | Insert another sequence at a given index |
| `memoize()` | Cache results across re-enumerations; returns `ITyneqCachedEnumerable` |

---

### Terminal operators

> Execute the pipeline and return a concrete value.

| Operator | Description |
|---|---|
| `toArray()` | Collect all elements into an `Array<T>` |
| `toSet()` | Collect into a `Set<T>` |
| `toMap(keySelector, valueSelector?)` | Collect into a `Map<K, V>` |
| `toRecord(keySelector, valueSelector?)` | Collect into a plain `Record<K, V>` |
| `toAsync()` | Bridge to `AsyncIterable<T>` |
| `first(predicate?)` | First element (throws if empty) |
| `firstOrDefault(predicate?, defaultValue?)` | First element or `undefined`/default |
| `last(predicate?)` | Last element (throws if empty) |
| `lastOrDefault(predicate?, defaultValue?)` | Last element or `undefined`/default |
| `single(predicate?)` | Exactly one element (throws otherwise) |
| `singleOrDefault(predicate?, defaultValue?)` | One element or `undefined`/default |
| `elementAt(index)` | Element at index (throws if out of range) |
| `elementAtOrDefault(index, defaultValue?)` | Element at index or `undefined`/default |
| `count(predicate?)` | Number of elements (optionally matching predicate) |
| `countBy(keySelector)` | Count per group key as a `Map<K, number>` |
| `sum(selector?)` | Numeric sum |
| `average(selector?)` | Arithmetic mean |
| `min(comparer?)` | Minimum element |
| `max(comparer?)` | Maximum element |
| `minBy(keySelector, comparer?)` | Element with the minimum projected key |
| `maxBy(keySelector, comparer?)` | Element with the maximum projected key |
| `minMax(comparer?)` | Both minimum and maximum in one pass |
| `aggregate(seed, fn, resultSelector?)` | General fold (reduce) |
| `any(predicate?)` | `true` if any element matches |
| `all(predicate)` | `true` if all elements match |
| `contains(value, comparer?)` | `true` if value is present |
| `indexOf(value, comparer?)` | Zero-based index of value, or `-1` |
| `sequenceEqual(other, comparer?)` | `true` if both sequences are equal element-wise |
| `startsWith(other, comparer?)` | `true` if sequence begins with `other` |
| `isNullOrEmpty()` | `true` if null, undefined, or empty |
| `consume()` | Drain the sequence (side-effects only, returns `void`) |

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

### Grouping and aggregation

```ts
const stats = Tyneq.from([
  { name: "Ada",   team: "core",  score: 84 },
  { name: "Grace", team: "core",  score: 97 },
  { name: "Linus", team: "infra", score: 92 },
])
  .groupBy(p => p.team)
  .select(g => ({
    team:    g.key,
    count:   g.count(),
    average: g.average(p => p.score),
    top:     g.orderByDescending(p => p.score).first().name,
  }))
  .toArray();
```

### Running aggregates with `scan`

`scan` emits the accumulator value after each element — useful for running totals, moving windows, and state machines.

```ts
const runningTotal = Tyneq.from([1, 2, 3, 4, 5])
  .scan(0, (acc, x) => acc + x)
  .toArray();
// [1, 3, 6, 10, 15]
```

### Set operations

```ts
const a = Tyneq.from([1, 2, 3, 4]);
const b = Tyneq.from([3, 4, 5, 6]);

a.intersect(b).toArray(); // [3, 4]
a.except(b).toArray();    // [1, 2]
a.union(b).toArray();     // [1, 2, 3, 4, 5, 6]
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

### Bridging to async

`toAsync()` bridges a Tyneq sequence to `AsyncIterable<T>`. Each `for await...of` loop starts
a fresh, independent traversal of the underlying source.

```ts
const seq = Tyneq.range(1, 3).select(x => x * 10);

for await (const n of seq.toAsync()) {
  await processItem(n); // 10, 20, 30
}
```

---

## Execution Model

Tyneq makes execution timing **explicit**:

- **Streaming operators** defer work per element. A `where().select().take(1)` on a million-element source only processes elements until the first match — no full scan.
- **Buffering operators** must see the full source before producing output. `orderBy`, `groupBy`, `distinct`, `shuffle` all fall into this category. A buffering operator in a pipeline marks the point beyond which full materialization has occurred.
- **Terminal operators** trigger a single, top-to-bottom traversal and return a concrete value. Re-calling a terminal on the same sequence starts a fresh traversal (unless the sequence is memoized).

This model makes it straightforward to reason about when work happens and how much memory a pipeline requires.

---

## Extensibility

Tyneq has a first-class API for registering custom operators at runtime — no source modifications or monkey-patching required.

### Functional API

`createOperator` is the easiest path for custom streaming or buffering operators:

```ts
import { createOperator } from "tyneq";
import type { IEnumerable } from "tyneq";

// Register a streaming operator that repeats each element n times
createOperator({
    name: "repeatEach",
    factory(source: IEnumerable<unknown>, times: number) {
        return source.selectMany(x => Tyneq.populate(x, times));
    },
    validate(times) {
        if (times < 1) throw new Error("times must be >= 1");
    },
});

// Augment the type so TypeScript knows about the new method
declare module "tyneq" {
    interface ITyneqEnumerable<T> {
        repeatEach(times: number): ITyneqEnumerable<T>;
    }
}

Tyneq.from([1, 2, 3]).repeatEach(2).toArray(); // [1, 1, 2, 2, 3, 3]
```

Similarly, `createGeneratorOperator` registers generator-based operators and `createTerminalOperator` registers terminal operators that return a value.

### Class-based API

Use the `@operator` and `@terminal` decorators for operators with complex internal state:

```ts
import { operator } from "tyneq";
import { TyneqEnumerator } from "tyneq/core";
import type { IEnumerator } from "tyneq";

@operator("everyOther")
class EveryOtherEnumerator<T> extends TyneqEnumerator<T, T> {
    private skip = false;

    protected handleNext(enumerator: IEnumerator<T>): IteratorResult<T> {
        while (true) {
            const result = enumerator.next();
            if (result.done) return result;
            this.skip = !this.skip;
            if (this.skip) return result;
        }
    }
}
```

See the [Operator Authoring guide](https://chrisitopherus.github.io/tyneq/guide/extensibility) for the full workflow, including validation patterns, multi-argument operators, and TypeScript augmentation.

---

## Query Plan Inspection

Every sequence carries a query plan tree that describes the operators applied to it. This is useful for logging, debugging, and building developer tools.

```ts
import { Tyneq } from "tyneq";
import { tyneqQueryNode, QueryPlanPrinter } from "tyneq";

const seq = Tyneq.from([1, 2, 3])
  .where(x => x > 1)
  .select(x => x * 2)
  .take(5);

const plan = QueryPlanPrinter.print(seq[tyneqQueryNode]!);
console.log(plan);
// from([1, 2, 3])
//   → where(<fn>)
//   → select(<fn>)
//   → take(5)
```

The printer is fully customizable via `indent`, `arrow`, and `maxInlineArrayItems` options, and can be subclassed to override `formatArg` or `formatLine` for custom rendering.

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
npm run build          # compile CJS + ESM + type declarations
npm test               # run test suite (vitest)
npm run test:coverage  # coverage report
npm run lint           # check style
npm run lint:fix       # auto-fix style violations
npm run docs:dev       # local docs site (typedoc + vitepress)
```

---

## License

[MIT](./LICENSE) © [chrisitopherus](https://github.com/chrisitopherus)
