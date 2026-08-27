# Best Practices & Pitfalls

This page collects the patterns that work well and the mistakes that are easy to make. Both matter equally.

---

## Sources and re-iteration

### Wrap generator functions, not generator objects

A generator *object* is a one-shot iterator. Once exhausted, it is gone. Passing one to `Tyneq.from` does not make it re-iterable.

```ts
function* naturals() { let n = 0; while (true) yield n++; }

// Bad: naturals() returns a generator object
const bad = Tyneq.from(naturals()).take(5);
bad.toArray(); // [0, 1, 2, 3, 4]
bad.toArray(); // [] - generator already exhausted

// Good: wrap the function so each iteration gets a fresh generator
const good = Tyneq.from({ [Symbol.iterator]: naturals }).take(5);
good.toArray(); // [0, 1, 2, 3, 4]
good.toArray(); // [0, 1, 2, 3, 4]
```

### Beware source array mutation

Deferred operators hold a reference to the source, not a copy. Mutating the source array between composition and iteration changes results.

```ts
const arr = [1, 2, 3];
const seq = Tyneq.from(arr).where(x => x > 1);

arr.push(4);
seq.toArray(); // -> [2, 3, 4]  - 4 was added before iteration
```

If you need a snapshot, copy the array first:

```ts
const seq = Tyneq.from([...arr]).where(x => x > 1);
```

---

## Execution and deferred evaluation

### Capture values, not references, in closures

Deferred operators capture references. A mutable variable captured in a `where` or `select` reflects its value at iteration time, not composition time.

```ts
// Bad: threshold is read at iteration time
let threshold = 10;
const seq = Tyneq.from([5, 15, 20]).where(x => x > threshold);
threshold = 100;
seq.toArray(); // [] - 100 was in effect at iteration

// Good: capture with const
const threshold = 10;
const seq = Tyneq.from([5, 15, 20]).where(x => x > threshold);
```

### Side effects run per enumeration

Every `toArray()` re-executes the full pipeline. Side effects in `tap`, `select`, or `where` run again on each call.

```ts
const seq = Tyneq.from([1, 2, 3]).tap(x => console.log("processing", x));

seq.toArray(); // logs 1 2 3
seq.toArray(); // logs 1 2 3 again
```

If the side effects should only run once, use `memoize()` to prevent re-execution after the first pass.

---

## Buffering and performance

### Buffering operators read the full source - always

`orderBy`, `reverse`, `groupBy`, and other buffering operators must read the entire upstream before yielding anything. Placing `take` after a buffer stage does not prevent the buffer from materializing.

```ts
// Bad - orderBy reads ALL of largeCollection, then take(5) discards the rest
Tyneq.from(largeCollection).orderBy(x => x.score).take(5).toArray();
```

If the top-5 are always within the first N elements, limit first:

```ts
// Better when semantics allow - sort only the first 100
Tyneq.from(largeCollection).take(100).orderBy(x => x.score).take(5).toArray();
```

If you genuinely need the global top-5, the full sort is unavoidable and correct.

### Operator order changes semantics

```ts
// These are NOT equivalent
Tyneq.from([30, 10, 50, 20, 40]).take(3).orderBy(x => x).toArray();
// -> [10, 20, 30]  (takes first 3: [30,10,50], then sorts them)

Tyneq.from([30, 10, 50, 20, 40]).orderBy(x => x).take(3).toArray();
// -> [10, 20, 30]  (sorts all, takes the 3 smallest)
```

The output is the same here by coincidence. In general, `take.orderBy` and `orderBy.take` are different operations.

---

## Element access

### Use `firstOrDefault` when absence is expected

`first(pred)` throws `SequenceContainsNoElementsError` when no element matches. If an empty result is a normal case, use `firstOrDefault` and handle the default explicitly.

```ts
// Bad: throws when no user has that ID
const user = users.first(u => u.id === id);

// Good: returns null when not found
const user = users.firstOrDefault(u => u.id === id, null);
if (user === null) { /* handle not found */ }
```

The same pattern applies to: `last`/`lastOrDefault`, `single`/`singleOrDefault`, `elementAt`/`elementAtOrDefault`.

---

## Memoization

### Use `memoize()` only when re-evaluation is measurable

Re-iterating a sequence re-runs the entire pipeline from the source. If the source is a plain in-memory array, this is extremely fast. Only memoize when there is a concrete reason:

- The source involves I/O or external calls
- The pipeline includes `shuffle()` or other random operations you want fixed
- The pipeline is computationally expensive and re-evaluation is measurable

```ts
// Unnecessary memoize on a trivial pipeline
const seq = Tyneq.from([1, 2, 3]).select(x => x * 2).memoize(); // overkill

// Appropriate memoize
const seq = Tyneq.from(fetchApiData())
  .where(x => x.active)
  .shuffle()
  .take(10)
  .memoize(); // memoize justifies itself here
```

### `memoize()` does not deep-clone

The cache stores references. Mutating a cached element affects all future reads from the cache.

```ts
const data = [{ x: 1 }, { x: 2 }];
const cached = Tyneq.from(data).memoize();

cached.toArray(); // [{ x: 1 }, { x: 2 }]
data[0].x = 999;
cached.toArray(); // [{ x: 999 }, { x: 2 }] - same references
```

If mutation-safe caching is required, clone elements before memoizing:

```ts
const cached = Tyneq.from(data).select(x => ({ ...x })).memoize();
```

### Avoid mutable seeds in `aggregate`

`aggregate` does not clone the seed. If the seed is a mutable object and the accumulator modifies it in place, the same object is reused and polluted on re-iteration.

```ts
// Bad: seed object mutated across calls
const query = Tyneq.from([1, 2, 3]).aggregate(
  { values: [] as number[], sum: 0 },
  (acc, x) => { acc.values.push(x); acc.sum += x; return acc; },
  acc => acc
);

query; // { values: [1, 2, 3], sum: 6 }  - seed is now polluted
query; // { values: [1, 2, 3, 1, 2, 3], sum: 12 } - polluted again!
```

Always produce a fresh seed:

```ts
// Good: function produces a new object each call
function summarize(src: TyneqSequence<number>) {
  return src.aggregate(
    { values: [] as number[], sum: 0 },
    (acc, x) => { acc.values.push(x); acc.sum += x; return acc; },
    acc => acc
  );
}
```

---

## Custom operators

### Validate at the call site, not in constructors or handleNext

For custom operators, argument validation must run at the call site - before the lazy factory is created. Errors in constructors or `handleNext` are deferred until iteration.

```ts
// Bad: constructor validation is deferred
@operator("stride", "streaming")
class StrideEnumerator<T> extends TyneqEnumerator<T, T> {
  constructor(source: Enumerator<T>, private step: number) {
    super(source);
    if (step < 1) throw new RangeError(...); // deferred! confusing!
  }
}

// Good: validate in the third argument to @operator
@operator("stride", "streaming", (step: number) => {
  if (step < 1) throw new RangeError("step must be >= 1");
})
class StrideEnumerator<T> extends TyneqEnumerator<T, T> {
  constructor(source: Enumerator<T>, private step: number) {
    super(source); // no validation here
  }
}
```

### Call `earlyComplete()` when stopping before the source is exhausted

If your operator stops pulling from the source before it is done, call `this.earlyComplete()`. Without it, the upstream `Enumerator` is not released and its resources are leaked.

```ts
// Bad: upstream not released when limit is reached
protected override handleNext(): IteratorResult<T> {
  if (this.emitted >= this.limit) return { done: true, value: undefined };
  // ...
}

// Good
protected override handleNext(): IteratorResult<T> {
  if (this.emitted >= this.limit) {
    this.earlyComplete();
    return { done: true, value: undefined };
  }
  // ...
}
```

### Prefix plugin operator names

When distributing a plugin, prefix all operator names to avoid conflicts with built-ins or other third-party plugins.

```ts
createGeneratorOperator({ name: "mylib_slidingAverage", ... });
```

Enforce the convention in tests with `OperatorRegistry.addGuard`.

### Use `TyneqComparer` instead of inline comparers

Inline comparers are error-prone. The built-in comparers in `TyneqComparer` are tested and cover the common cases.

```ts
// Bad: custom inline, easy to get wrong
.orderBy(x => x, (a, b) => (a > b ? 1 : a < b ? -1 : 0))

// Good
import { TyneqComparer } from "tyneq";
.orderBy(x => x, TyneqComparer.defaultComparer)
.orderBy(x => x, TyneqComparer.createLocaleComparer())   // locale-aware strings
```

---

## Debugging

### Use `tap` to observe elements at any pipeline stage

```ts
Tyneq.from(data)
  .tap(x => console.log("after source:", x))
  .where(pred)
  .tap(x => console.log("after where:", x))
  .select(fn)
  .toArray();
```

### Print the query plan to verify the pipeline structure

```ts
import { QueryPlanPrinter, tyneqQueryNode } from "tyneq";

const query = Tyneq.from(data).where(pred).orderBy(fn).take(5);
console.log(QueryPlanPrinter.print(query[tyneqQueryNode]!));
// from([...])
//   -> where(<fn>)
//   -> orderBy(<fn>)
//   -> take(5)
```

Buffering operators (`orderBy`, `groupBy`, `reverse`, ...) in the plan are O(n) memory sites. If you see an unexpected buffer stage, the plan will show you where it is.

### Use `consume()` for side-effect-only pipelines

If a pipeline exists purely to trigger `tap` calls, drain it with `consume()` to make the intent clear:

```ts
Tyneq.from(events)
  .tap(e => analytics.track(e))
  .tap(e => logger.log(e))
  .consume(); // explicit: we only care about side effects
```

### `backsert(0)` appends, not inserts before last

The `index` parameter in `backsert` counts how many elements from the end to skip before inserting. `backsert(0)` means "skip zero elements from the end", which is append.

```ts
Tyneq.from([1, 2, 3]).backsert(0, [9]).toArray(); // -> [1, 2, 3, 9]  (appended)
Tyneq.from([1, 2, 3]).backsert(1, [9]).toArray(); // -> [1, 2, 9, 3]  (before last)
Tyneq.from([1, 2, 3]).backsert(2, [9]).toArray(); // -> [1, 9, 2, 3]  (before second-to-last)
```
