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
const fromRange = Tyneq.range(10, 5);        // [10, 11, 12, 13, 14]
const random    = Tyneq.random(5, () => Math.floor(Math.random() * 101)); // 5 random values
const empty     = Tyneq.empty<number>();

// Indexed enumeration — pairs each element with its zero-based index
for (const [i, value] of Tyneq.enumerate(["a", "b", "c"])) {
    console.log(`${i}: ${value}`); // 0: a, 1: b, 2: c
}
```

### Compose lazily, execute explicitly

Nothing runs until you call a terminal operator.

```ts
const query = Tyneq.range(1, 100)
  .where(n => n % 2 === 0)
  .select(n => n * n)
  .take(5);

// Pipeline is defined — no iteration has happened yet.
query.toArray(); // [4, 16, 36, 64, 100]
```

### Re-iterate safely

Tyneq sequences are **re-iterable** — unlike raw generators, they can be consumed multiple times.

```ts
const q = Tyneq.range(1, 3).select(x => x * 10);

q.toArray(); // [10, 20, 30]
q.toArray(); // [10, 20, 30]  ← same result, independent state
```

### Works with standard iteration protocols

Tyneq sequences implement `Iterable<T>`, so they plug directly into `for...of`, spread, and destructuring.

```ts
const seq = Tyneq.range(1, 5).where(n => n % 2 !== 0);

for (const n of seq) console.log(n);  // 1, 3, 5
const arr = [...seq];                  // [1, 3, 5]
```

---

## Core Concepts

### Operator kinds

| Kind | When it runs | Memory | Examples |
|---|---|---|---|
| **Streaming** | One element at a time, lazily | O(1) | `where`, `select`, `take`, `scan` |
| **Buffering** | Materializes full input before yielding | O(n) | `orderBy`, `groupBy`, `distinct`, `shuffle` |
| **Terminal** | Executes the pipeline, returns a value | — | `toArray`, `count`, `sum`, `any` |

Understanding the kind of each operator lets you reason about performance and memory upfront.

### Re-iteration vs memoization

```ts
// Re-iterable: re-executes the full pipeline on every terminal call
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

---

## Operator Reference

### Factories

> Create a new typed sequence from a source.

| Operator | Description |
|---|---|
| `Tyneq.from(source)` | Wrap any `Iterable<T>` |
| `Tyneq.range(start, count)` | Integer sequence from `start` of length `count` |
| `Tyneq.empty<T>()` | Empty sequence |
| `Tyneq.enumerate(source)` | Pair each element with its zero-based index as `[number, T]` |
| `Tyneq.random(count, randomizer)` | Sequence of `count` values produced by a callback |

---

### Streaming operators

> Process one element at a time. O(1) memory. Do not require the source to end.

| Operator | Description |
|---|---|
| `select(selector)` | Project each element to a new value |
| `selectMany(selector)` | Project each element to a sequence and flatten the results |
| `where(predicate)` | Filter elements matching the predicate |
| `take(count)` | Keep the first `count` elements |
| `takeWhile(predicate)` | Keep elements while predicate holds, stop at first failure |
| `skip(count)` | Skip the first `count` elements |
| `skipWhile(predicate)` | Skip elements while predicate holds, yield the remainder |
| `skipLast(count)` | Skip the last `count` elements |
| `append(item)` | Yield all source elements followed by `item` |
| `prepend(item)` | Yield `item` followed by all source elements |
| `concat(other)` | Concatenate this sequence with another |
| `zip(other, selector)` | Pair elements from two sequences using a selector; stops when either is exhausted |
| `scan(seed, accumulator)` | Emit the running accumulator value after each element |
| `pairwise()` | Emit overlapping `[prev, curr]` pairs |
| `chunk(size)` | Split into fixed-size `TSource[]` chunks; last chunk may be smaller |
| `split(predicate)` | Split on elements matching the predicate; split-point elements are excluded |
| `defaultIfEmpty(value)` | Yield the source unchanged, or a single `value` if the source is empty |
| `populate(value)` | Replace every source element with `value`; preserves element count |
| `cast<U>()` | Assert each element is of type `U` (compile-time only; no runtime check) |
| `ofType<U>(guard)` | Filter and narrow elements to those passing a type guard |
| `tap(action)` | Invoke a side-effect action per element; elements pass through unchanged |
| `tapIf(action, predicate)` | Invoke `action` per element only when `predicate()` returns `true` at call time |
| `throttle(count)` | Emit every `count`-th element, discarding elements in between |
| `pipe(factory)` | Apply a custom transformation via a user-supplied factory function |

---

### Buffering operators

> Materialize the full source internally before producing output. O(n) memory.

| Operator | Description |
|---|---|
| `orderBy(keySelector, comparer?)` | Sort ascending by key |
| `orderByDescending(keySelector, comparer?)` | Sort descending by key |
| `thenBy(keySelector, comparer?)` | Secondary ascending sort (chains on `TyneqOrderedSequence`) |
| `thenByDescending(keySelector, comparer?)` | Secondary descending sort |
| `groupBy(keySelector, valueSelector, resultSelector)` | Group elements by key, project values, and map each group to a result |
| `distinct()` | Remove duplicate elements (by reference equality) |
| `distinctBy(keySelector)` | Remove duplicates by projected key |
| `reverse()` | Reverse the sequence |
| `shuffle()` | Randomly permute the sequence |
| `union(other)` | Union with deduplication |
| `unionBy(other, keySelector)` | Union deduplicated by projected key |
| `intersect(other)` | Elements present in both sequences |
| `intersectBy(other, keySelector)` | Intersection by projected key |
| `except(other)` | Elements not present in `other` |
| `exceptBy(other, keySelector)` | Difference by projected key |
| `join(inner, outerKey, innerKey, resultSelector)` | Inner join on key equality |
| `groupJoin(inner, outerKey, innerKey, resultSelector)` | Left outer join with grouped inner results |
| `backsert(index, other)` | Insert `other` at a position counted from the end (`index = 0` appends) |
| `memoize()` | Cache results across re-enumerations; returns `TyneqCachedSequence` |

---

### Terminal operators

> Execute the pipeline and return a concrete value.

| Operator | Description |
|---|---|
| `toArray()` | Collect all elements into an `Array<T>` |
| `toSet()` | Collect into a `Set<T>` |
| `toMap(selector)` | Collect into a `Map<K, V>` using a `{ key, value }` selector |
| `toRecord(selector)` | Collect into a `Record<K, V>` using a `{ key, value }` selector |
| `toAsync()` | Bridge to `AsyncIterable<T>`; each iteration produces a fresh traversal |
| `first(predicate)` | First element matching predicate (throws if none match) |
| `firstOrDefault(predicate, defaultValue)` | First element matching predicate, or `defaultValue` |
| `last(predicate)` | Last element matching predicate (throws if none match) |
| `lastOrDefault(predicate, defaultValue)` | Last element matching predicate, or `defaultValue` |
| `single(predicate)` | Exactly one element matching predicate (throws if zero or more than one) |
| `singleOrDefault(predicate, defaultValue)` | One element matching predicate, or `defaultValue` (throws if more than one) |
| `elementAt(index)` | Element at zero-based index (throws if out of range) |
| `elementAtOrDefault(index, defaultValue)` | Element at index or `defaultValue` |
| `count()` | Number of elements |
| `countBy(predicate)` | Number of elements matching predicate |
| `sum(selector)` | Sum of values returned by `selector` |
| `average(selector)` | Arithmetic mean of values returned by `selector` |
| `min(comparer?)` | Minimum element |
| `max(comparer?)` | Maximum element |
| `minBy(keySelector, comparer?)` | Element with the minimum projected key |
| `maxBy(keySelector, comparer?)` | Element with the maximum projected key |
| `minMax(comparer?)` | Both minimum and maximum in a single pass; returns `{ min, max }` |
| `aggregate(seed, fn, resultSelector)` | General fold: apply `fn` as a running accumulator, then transform with `resultSelector` |
| `any(predicate)` | `true` if any element matches |
| `all(predicate)` | `true` if all elements match |
| `contains(value)` | `true` if value is present (by reference equality) |
| `indexOf(predicate, startIndex?)` | Zero-based index of the first matching element, or `-1` |
| `sequenceEqual(other, equalityComparer?)` | `true` if both sequences are element-wise equal |
| `startsWith(other)` | `true` if the sequence begins with all elements of `other` in order |
| `isNullOrEmpty()` | `true` if the sequence is empty |
| `consume()` | Drain the sequence without materializing results (for side effects) |

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

`groupBy` requires a key selector, a value selector, and a result selector. The result selector receives each group key and a sequence of the projected values.

```ts
const stats = Tyneq.from([
  { name: "Ada",   team: "core",  score: 84 },
  { name: "Grace", team: "core",  score: 97 },
  { name: "Linus", team: "infra", score: 92 },
])
  .groupBy(
    p => p.team,            // key selector
    p => p.score,           // value selector
    (team, scores) => ({    // result selector — scores is TyneqSequence<number>
      team,
      count:   scores.count(),
      average: scores.average(s => s),
      highest: scores.max(),
    })
  )
  .toArray();
// [
//   { team: "core",  count: 2, average: 90.5, highest: 97 },
//   { team: "infra", count: 1, average: 92,   highest: 92 },
// ]
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

### Collecting into maps and records

`toMap` and `toRecord` take a single selector that returns a `{ key, value }` pair.

```ts
const users = Tyneq.from([
  { id: 1, name: "Ada" },
  { id: 2, name: "Grace" },
]);

const byId = users.toMap(u => ({ key: u.id, value: u.name }));
// Map { 1 => "Ada", 2 => "Grace" }

const record = users.toRecord(u => ({ key: u.id, value: u.name }));
// { 1: "Ada", 2: "Grace" }
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

Tyneq has a first-class API for registering custom operators at runtime — no source modifications required.

### `createStreamingOperator` — generator-based (simplest)

Write the operator as a generator function. The library handles the enumerator lifecycle.

```ts
import { createStreamingOperator } from "tyneq";

// repeatEach.ts — importing this file registers the operator
createStreamingOperator({
    name: "repeatEach",
    *generator(source: Iterable<unknown>, times: number) {
        for (const item of source) {
            for (let i = 0; i < times; i++) yield item;
        }
    },
    validate(times) {
        if (times < 1) throw new Error("times must be >= 1");
    },
});

// Augment the type so TypeScript knows about the new method
declare module "tyneq" {
    interface TyneqSequence<T> {
        repeatEach(times: number): TyneqSequence<T>;
    }
}

Tyneq.from([1, 2, 3]).repeatEach(2).toArray(); // [1, 1, 2, 2, 3, 3]
```

### `createTerminalOperator` — for operators that return a value

```ts
import { createTerminalOperator, Tyneq } from "tyneq";
import type { Enumerable } from "tyneq";

createTerminalOperator({
    name: "joinString",
    execute(source: Enumerable<unknown>, separator: string): string {
        const parts: string[] = [];
        for (const item of source) parts.push(String(item));
        return parts.join(separator);
    },
});

declare module "tyneq" {
    interface TyneqSequence<T> {
        joinString(separator: string): string;
    }
}

Tyneq.from([1, 2, 3]).joinString(", "); // "1, 2, 3"
```

### `createOperator` — full control over the enumerator factory

Use when you need to return a custom `EnumeratorFactory<T>` rather than a generator.

### Class-based API (`@operator`, `@terminal`)

Use the decorators for operators with complex internal state:

```ts
import { operator, TyneqEnumerator } from "tyneq";

// everyOther.ts — importing this file registers the operator
@operator("everyOther")
class EveryOtherEnumerator<T> extends TyneqEnumerator<T, T> {
    private skip = false;

    protected override handleNext(): IteratorResult<T> {
        while (true) {
            const result = this.sourceEnumerator.next();
            if (result.done) return this.done();
            this.skip = !this.skip;
            if (this.skip) return this.yield(result.value);
        }
    }
}

declare module "tyneq" {
    interface TyneqSequence<T> {
        everyOther(): TyneqSequence<T>;
    }
}
```

See the [Custom Operators guide](https://chrisitopherus.github.io/tyneq/guide/extensibility) for the full workflow, including validation patterns, multi-argument operators, buffer operators, and TypeScript augmentation. For a deep dive into the enumerator lifecycle — early termination, buffer patterns, secondary resources — see [Building Custom Enumerators](https://chrisitopherus.github.io/tyneq/guide/custom-enumerators).

---

## Query Plan Inspection

Every sequence carries a query plan tree that describes the operators applied to it. This is useful for logging, debugging, and building developer tools.

```ts
import { Tyneq, tyneqQueryNode, QueryPlanPrinter } from "tyneq";

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

The printer accepts `indent`, `arrow`, and `maxInlineArrayItems` options, and can be subclassed to override `formatArg` or `formatLine` for custom rendering. The query plan can also be traversed with any class implementing `QueryPlanVisitor<T>` — see the [query plan guide](https://chrisitopherus.github.io/tyneq/guide/query-plan) for visitor patterns and examples.

---

## Documentation

Full documentation, operator guides, and the API reference are available at:

**[chrisitopherus.github.io/tyneq](https://chrisitopherus.github.io/tyneq/)**

| | |
|---|---|
| [Guide: Getting Started](https://chrisitopherus.github.io/tyneq/guide/getting-started) | Install and write your first query |
| [Guide: Core Concepts](https://chrisitopherus.github.io/tyneq/guide/concepts) | Sequences, operators, and the execution model |
| [Guide: Extensibility](https://chrisitopherus.github.io/tyneq/guide/extensibility) | Custom operators and the registry API |
| [Guide: Custom Enumerators](https://chrisitopherus.github.io/tyneq/guide/custom-enumerators) | Enumerator lifecycle, buffer patterns, early termination |
| [Guide: Query Plan](https://chrisitopherus.github.io/tyneq/guide/query-plan) | Query plan introspection and visitor patterns |
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
