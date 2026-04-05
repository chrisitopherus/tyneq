# Common Pitfalls

## One-Shot Sources

A generator *object* is a one-shot iterator. Wrapping it in `Tyneq.from` does not make it re-iterable.

```ts
// Bad - second toArray() returns []
function* naturals() { let n = 0; while (true) yield n++; }
const seq = Tyneq.from(naturals()).take(5);

seq.toArray(); // [0, 1, 2, 3, 4]
seq.toArray(); // [] - generator already exhausted
```

Fix: pass the function as a factory, not the object it returns.

```ts
// Good - fresh generator per enumeration
const seq = Tyneq.from({ [Symbol.iterator]: naturals }).take(5);

seq.toArray(); // [0, 1, 2, 3, 4]
seq.toArray(); // [0, 1, 2, 3, 4]
```

## Mutable Closure Capture

Deferred operators capture references, not values. Mutations between composition and iteration affect results.

```ts
// Bad - threshold is read at iteration time
let threshold = 10;
const seq = Tyneq.from([5, 15, 20]).where(x => x > threshold);
threshold = 100;
seq.toArray(); // [] - 100 was in effect at iteration
```

Fix: capture the value at composition time with `const`.

```ts
// Good
const threshold = 10;
const seq = Tyneq.from([5, 15, 20]).where(x => x > threshold);
```

## Side Effects Run Per Enumeration

Every `toArray()` re-executes the full pipeline. Side effects in `tap`, `select`, or `where` run again on each call.

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
// Bad - orderBy reads ALL of largeCollection
Tyneq.from(largeCollection).orderBy(x => x.score).take(5).toArray();
```

If the top-5 are always within the first N items, limit first:

```ts
// Better when semantics allow
Tyneq.from(largeCollection).take(100).orderBy(x => x.score).take(5).toArray();
```

If you genuinely need the global top-5, the buffer is unavoidable and correct.

## Operator Order Changes Semantics

```ts
// These are NOT equivalent
Tyneq.from([30, 10, 50, 20, 40]).take(3).orderBy(x => x).toArray();
// -> [10, 20, 30]  - takes first 3 [30,10,50] then sorts them

Tyneq.from([30, 10, 50, 20, 40]).orderBy(x => x).take(3).toArray();
// -> [10, 20, 30]  - sorts all, takes the 3 smallest
```

Trace which elements are present at each stage. Operator composition is sequential.

## `backsert(0)` Appends, Not Inserts Before Last

The `index` parameter in `backsert` counts how many elements from the end to skip before inserting. `backsert(0)` means "skip 0 elements from the end" = append.

```ts
Tyneq.from([1, 2, 3]).backsert(0, [9]).toArray(); // -> [1, 2, 3, 9]  (appended)
Tyneq.from([1, 2, 3]).backsert(1, [9]).toArray(); // -> [1, 2, 9, 3]  (before last)
Tyneq.from([1, 2, 3]).backsert(2, [9]).toArray(); // -> [1, 9, 2, 3]  (before second-to-last)
```

## Source Array Mutation Affects Deferred Results

When the source is a mutable array, mutating it between composition and iteration changes results. Deferred operators hold a reference, not a copy.

```ts
const arr = [1, 2, 3];
const seq = Tyneq.from(arr).where(x => x > 1);

arr.push(4);
seq.toArray(); // -> [2, 3, 4]  - 4 was added before iteration
```

If the snapshot at composition time is intended, copy the array first: `Tyneq.from([...arr])`.

## `memoize()` Does Not Deep-Clone

The cache stores references to the original objects. Mutating a cached element affects all future reads from the cache.

```ts
const data = [{ x: 1 }, { x: 2 }];
const cached = Tyneq.from(data).memoize();

cached.toArray(); // -> [{ x: 1 }, { x: 2 }]

data[0].x = 999;
cached.toArray(); // -> [{ x: 999 }, { x: 2 }]  - same reference
```

If mutation-safe caching is required, use `select` to clone elements before `memoize`.

## Missing `earlyComplete` in Custom Operators

When writing a class-based operator that stops consuming the source before it is exhausted, call `this.earlyComplete()` rather than returning `{ done: true, value: undefined }` directly. The latter marks the enumerator finished but does not propagate `return()` to the source enumerator, leaking upstream resources.

```ts
// Bad - upstream not released when limit is reached
protected override handleNext(): IteratorResult<T> {
  if (this.emitted >= this.limit) return { done: true, value: undefined };
  ...
}

// Good
protected override handleNext(): IteratorResult<T> {
  if (this.emitted >= this.limit) {
    this.earlyComplete();
    return { done: true, value: undefined };
  }
  ...
}
```

## Mutable Seed in `aggregate`

`aggregate` does not clone the seed. If the seed is a mutable object and `func` modifies it in place, the same object is used and mutated on the next iteration.

```ts
// Bad - seed is mutated across enumerations
const seed = { values: [] as number[], sum: 0 };
const query = Tyneq.from([1, 2, 3]).aggregate(
  seed,
  (acc, x) => { acc.values.push(x); acc.sum += x; return acc; },
  acc => acc
);

query; // { values: [1, 2, 3], sum: 6 } - seed is now polluted for the next call
```

Always produce a fresh seed:

```ts
// Good - new object literal each call
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

## Debugging Tips

### `tap` - observe elements at any stage

```ts
Tyneq.from(data)
  .tap(x => console.log("after source:", x))
  .where(pred)
  .tap(x => console.log("after where:", x))
  .select(fn)
  .toArray();
```

### Query plan - inspect pipeline structure

```ts
import { QueryPlanPrinter, tyneqQueryNode } from "tyneq";

const query = Tyneq.from(data).where(pred).orderBy(fn).take(5);
console.log(QueryPlanPrinter.print(query[tyneqQueryNode]!));
// from([...])
//   -> where(<fn>)
//   -> orderBy(<fn>)
//   -> take(5)
```

Buffer operators in the plan are O(n) memory sites. See [Query Plan](/guide/query-plan).
