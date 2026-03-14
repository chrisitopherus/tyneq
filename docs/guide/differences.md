# vs. Other Libraries

Tyneq occupies a specific niche: **synchronous, typed, composable queries over iterable data**. This page explains how it differs from common alternatives — and where each tool wins.

## Native Array Methods

### When to use arrays

Array methods (`.filter`, `.map`, `.sort`, `.reduce`) are ideal when:
- Your data is already in an array
- You need simple, one-shot transformations
- Eager evaluation and full materialization are acceptable

### Where Tyneq differs

**Lazy evaluation**: array methods evaluate eagerly — `.filter` allocates a new array immediately, `.map` allocates another, and so on. Tyneq operators are deferred; no memory is allocated until the terminal call.

```ts
// Array — two intermediate arrays created
const result = users
  .filter(u => u.active)       // → new array
  .map(u => u.name)            // → another new array
  .sort()                      // → in-place sort, but on the already-allocated copy
  .slice(0, 10);               // → final copy

// Tyneq — zero intermediate arrays; one pass through data
const result = Tyneq
  .from(users)
  .where(u => u.active)        // deferred
  .select(u => u.name)         // deferred
  .orderBy(x => x)             // deferred (buffers internally on first iteration)
  .take(10)                    // deferred
  .toArray();                  // single materialization pass
```

**Re-iterable queries**: arrays don't have a query concept — once you chain, you get new arrays. Tyneq queries are values you can evaluate multiple times.

```ts
const q = Tyneq.from(users).where(u => u.score > 80);

const count = q.count();               // pipeline runs once
const names = q.select(u => u.name).toArray(); // pipeline runs again from source
```

**Relational operators**: arrays have no `join`, `groupBy`, `distinct`, `union`, `intersect`, or `except`. These require verbose manual implementations; Tyneq provides them as first-class operators.

**Verdict**: use arrays for simple eager transformations on already-materialized data. Use Tyneq when you need composable queries, relational operations, lazy evaluation, or the ability to re-evaluate the same query with different terminals.

---

## Lodash

### When to use Lodash

Lodash is a broad utility toolkit: collection helpers, object manipulation, string formatting, function composition, deep cloning, and more. Its `_.chain` API provides a lazy-ish pipeline over collections.

### Where Tyneq differs

**TypeScript propagation**: Lodash chains lose precise types at each step — you often end up with `any` or `LodashWrapper<any>`. Tyneq preserves the element type through projections, joins, and groupings.

```ts
// Lodash — type is lost
const result = _(users)
  .filter(u => u.active)
  .map(u => ({ name: u.name, rank: 0 }))
  .value(); // type: any[]

// Tyneq — type flows correctly
const result = Tyneq
  .from(users)
  .where(u => u.active)
  .select(u => ({ name: u.name, rank: 0 }))
  .toArray(); // type: { name: string; rank: number }[]
```

**Execution model clarity**: Lodash's execution behavior (eager vs. deferred, buffered vs. streaming) is not part of the API contract — it's an implementation detail. In Tyneq, every operator is categorized as streaming, buffering, or terminal, and that categorization is a documented guarantee.

**Scope**: Lodash has no `join`, `groupJoin`, `thenBy`, or multi-key stable ordering. For relational-style query patterns, you need Tyneq or to write the logic manually.

**Verdict**: use Lodash when you need general utility breadth (object, string, function utilities) or when you are in a JavaScript project and typing is not a concern. Use Tyneq for query-centric, strongly-typed iterable pipelines.

---

## IxJS

### When to use IxJS

IxJS is the iterable/async-iterable counterpart to RxJS. It provides `from`, `pipe`, `filter`, `map`, `zip`, and more — for both synchronous iterables and async iterables (including Node.js streams).

### Where Tyneq differs

**Surface area**: IxJS has a functional composition API (`pipe(source, filter(...), map(...))`) rather than a fluent method chain. Tyneq uses a fluent chain (`source.where(...).select(...)`) which reads more like LINQ and is easier for IDE autocomplete.

```ts
// IxJS — functional pipe style
import { from, pipe } from 'ix/iterable';
import { filter, map, take } from 'ix/iterable/operators';

const result = pipe(
  from([1, 2, 3, 4, 5]),
  filter(x => x % 2 === 0),
  map(x => x * 10),
  take(3)
);
// (still needs Array.from to materialize)

// Tyneq — fluent chain
const result = Tyneq
  .from([1, 2, 3, 4, 5])
  .where(x => x % 2 === 0)
  .select(x => x * 10)
  .take(3)
  .toArray();
// → [20, 40]
```

**Async support**: IxJS has first-class async iterable support (`ix/asynciterable`). Tyneq is synchronous-only.

**Re-iterability**: IxJS iterables are often one-shot (generators). Tyneq sequences are explicitly re-iterable by contract.

**Relational operators**: Tyneq has more domain-complete set operators (stable multi-key ordering, `groupJoin`, `backsert`, `minMax`, `aggregate`). IxJS is more operator-minimal.

**Verdict**: use IxJS when async iterable orchestration or RxJS-style functional pipelines are central to your work. Use Tyneq for synchronous, LINQ-style, re-iterable domain query pipelines.

---

## Other LINQ-Style TypeScript Libraries

Several other packages (linq.js, linq-to-typescript, ts-linq, etc.) implement LINQ-inspired APIs for TypeScript.

Compared to these, Tyneq emphasizes:

- **Re-iterable semantics by contract**: every sequence explicitly supports repeated enumeration, not just the ones backed by arrays.
- **Explicit operator categories**: the documentation and type contract state whether each operator is streaming, buffering, or terminal — this is a semantic guarantee, not a performance note.
- **Built-in memoization workflow**: `memoize()` + `refresh()` for controlled caching of expensive pipelines.
- **Query plan introspection**: every pipeline carries an `IQueryNode` tree. You can traverse, analyze, print, and rewrite query plans at runtime — no other LINQ-style TypeScript library exposes this.
- **Public extensibility API**: register custom operators without forking the library.

---

## Using Tyneq Alongside Other Libraries

Tyneq wraps any iterable — so it integrates naturally with data from any source.

### With native arrays

Pass an array to `Tyneq.from`. Collect results back with `toArray()`, `toSet()`, or `toMap()`.

```ts
import { Tyneq } from "tyneq";

const rawData: number[] = [5, 3, 8, 1, 9, 2];

const processed = Tyneq
  .from(rawData)
  .where(x => x > 3)
  .orderBy(x => x)
  .toArray();
// → [5, 8, 9]

// Result is a plain array — pass it anywhere
someOtherFunction(processed);
```

### With Lodash

Use Lodash for object/string utilities; use Tyneq for the query composition:

```ts
import _ from "lodash";
import { Tyneq } from "tyneq";

const rawRecords = getRawData(); // some external source

// Use Lodash to normalize the raw input
const normalized = _.map(rawRecords, r => ({
  id: r.ID,
  name: _.startCase(r.full_name),
  score: _.toNumber(r.scoreStr)
}));

// Use Tyneq for the query
const top10 = Tyneq
  .from(normalized)
  .where(r => r.score > 0)
  .orderByDescending(r => r.score)
  .take(10)
  .toArray();
```

### With IxJS async iterables

Collect async data first, then query synchronously with Tyneq:

```ts
import { from as asyncFrom } from 'ix/asynciterable';
import { map, toArray as asyncToArray } from 'ix/asynciterable/operators';
import { Tyneq } from "tyneq";

// Consume async source with IxJS
const records = await asyncToArray(asyncFrom(asyncDataSource).pipe(
  map(r => normalize(r))
));

// Query the result synchronously with Tyneq
const summary = Tyneq
  .from(records)
  .groupBy(r => r.category, r => r.value, (cat, vals) => ({
    category: cat,
    total: Tyneq.from(vals).sum(v => v)
  }))
  .orderByDescending(g => g.total)
  .toArray();
```

### With custom iterators / generators

Any generator function produces an iterable — wrap it with `Tyneq.from`:

```ts
import { Tyneq } from "tyneq";

function* csvRows(raw: string) {
  for (const line of raw.split('\n')) {
    yield line.split(',');
  }
}

const parsed = Tyneq
  .from(csvRows(rawCsvString))
  .skip(1)                        // skip header row
  .where(row => row.length === 3)
  .select(([id, name, score]) => ({
    id: Number(id),
    name: name.trim(),
    score: Number(score)
  }))
  .toArray();
```

---

## Decision Guide

| Scenario | Recommended tool |
|---|---|
| Simple filter/map over an array, no reuse | Native array methods |
| Object, string, or function utilities | Lodash |
| Async iterable orchestration | IxJS / RxJS |
| Synchronous query composition with strong typing | **Tyneq** |
| Relational joins over in-memory collections | **Tyneq** |
| Multi-key stable sorting and set operations | **Tyneq** |
| Re-iterable query values used in multiple contexts | **Tyneq** |
| Query plan introspection, linting, or optimization | **Tyneq** |
| Custom query operators as a plugin/extension | **Tyneq** |

---

## Related Pages

- [What Is Tyneq](/guide/what-is-tyneq)
- [Core Concepts](/guide/concepts)
- [Operators Overview](/guide/operators-overview)
- [Extensibility & Query Plans](/guide/extensibility)
