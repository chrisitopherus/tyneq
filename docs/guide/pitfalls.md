# Common Pitfalls

## One-Shot Sources

A generator *object* is a one-shot iterator. Wrapping it in `Tyneq.from` does not make it re-enumerable.

```ts
// ❌ second toArray() returns []
function* naturals() { let n = 0; while (true) yield n++; }
const seq = Tyneq.from(naturals()).take(5);

seq.toArray(); // [0, 1, 2, 3, 4]
seq.toArray(); // [] — generator already exhausted
```

Fix: pass the function as a factory, not the object it returns.

```ts
// ✅ fresh generator per enumeration
const seq = Tyneq.from({ [Symbol.iterator]: naturals }).take(5);

seq.toArray(); // [0, 1, 2, 3, 4]
seq.toArray(); // [0, 1, 2, 3, 4]
```

## Mutable Closure Capture

Deferred operators capture references, not values. Mutations between composition and iteration affect results.

```ts
// ❌ threshold is read at iteration time, not composition time
let threshold = 10;
const seq = Tyneq.from([5, 15, 20]).where(x => x > threshold);
threshold = 100;
seq.toArray(); // [] — 100 was in effect at iteration
```

Fix: capture the value at composition time with `const`.

```ts
// ✅
const threshold = 10;
const seq = Tyneq.from([5, 15, 20]).where(x => x > threshold);
```

## Side Effects Run Per Enumeration

Every `toArray()` re-executes the full pipeline. Side effects in `tap`, `select`, or `where` run again.

```ts
const seq = Tyneq.from([1, 2, 3])
  .tap(x => console.log("processing", x));

seq.toArray(); // logs 1 2 3
seq.toArray(); // logs 1 2 3 again
```

Use `memoize()` to prevent re-execution after the first pass.

## Buffer Operators Read the Full Source

`orderBy`, `reverse`, `groupBy`, `distinct`, and other buffering operators must read the entire upstream before yielding anything. Placing `take` after a buffer stage does not prevent the buffer from materializing.

```ts
// ❌ orderBy reads ALL of largeCollection
Tyneq.from(largeCollection).orderBy(x => x.score).take(5).toArray();
```

If the top-5 are always within the first N items and the sort is just a secondary concern, limit first:

```ts
// ✅ if semantics allow
Tyneq.from(largeCollection).take(100).orderBy(x => x.score).take(5).toArray();
```

If you genuinely need the global top-5, the buffer is unavoidable and correct.

## Operator Order Changes Semantics

```ts
// These are NOT equivalent
Tyneq.from([30, 10, 50, 20, 40]).take(3).orderBy(x => x).toArray();
// [10, 20, 30]  — takes first 3 [30,10,50] then sorts them

Tyneq.from([30, 10, 50, 20, 40]).orderBy(x => x).take(3).toArray();
// [10, 20, 30]  — sorts all, takes the 3 smallest
```

Trace which elements are present at each stage. Operator composition is sequential.

## Missing `earlyComplete` in Custom Operators

When writing a class-based operator that stops consuming the source early, return `earlyComplete()` rather than `done()`. `done()` marks the enumerator as finished but does not call `dispose()` — the upstream enumerator is never released.

```ts
// ❌ upstream not released when limit is reached
protected override handleNext(): IteratorResult<T> {
  if (this.emitted >= this.limit) return this.done();
  // ...
}

// ✅
protected override handleNext(): IteratorResult<T> {
  if (this.emitted >= this.limit) return this.earlyComplete();
  // ...
}
```

`earlyComplete()` calls `dispose()`, which propagates `return()` up the enumerator chain.

## Mutable Seed in `aggregate`

`aggregate` mutates the seed object in-place on each element. Iterating the same query twice with a mutable seed accumulates across both runs.

```ts
// ❌ seed is mutated across enumerations
const seed = { values: [] as number[], sum: 0 };
const query = Tyneq.from([1, 2, 3]).aggregate(
  seed,
  (acc, x) => { acc.values.push(x); acc.sum += x; return acc; },
  acc => acc
);

query; // { values: [1,2,3], sum: 6 } — seed is now polluted
```

Always produce a fresh seed:

```ts
// ✅ new object literal each call
function summarize(src: TyneqSequence<number>) {
  return src.aggregate(
    { values: [] as number[], sum: 0 },
    (acc, x) => { acc.values.push(x); acc.sum += x; return acc; },
    acc => acc
  );
}
```

## `first` vs `firstOrDefault`

`first(pred)` throws when no element satisfies the predicate. Use `firstOrDefault(pred, default)` when no match is a normal outcome.

The same pair exists for `last`/`lastOrDefault`, `single`/`singleOrDefault`, and `elementAt`/`elementAtOrDefault`.

## Debugging

### `tap` — observe elements at any stage

```ts
Tyneq.from(data)
  .tap(x => console.log("after source:", x))
  .where(pred)
  .tap(x => console.log("after where:", x))
  .select(fn)
  .toArray();
```

### Query plan — inspect pipeline structure

```ts
import { QueryPlanPrinter, tyneqQueryNode } from "tyneq";

const query = Tyneq.from(data).where(pred).orderBy(fn).take(5);
console.log(QueryPlanPrinter.print(query[tyneqQueryNode]!));
// from([...])
//   → where(<fn>)
//   → orderBy(<fn>)
//   → take(5)
```

Buffer operators in the plan are O(n) memory sites. See [Query Plan Inspection](/guide/query-plan).
