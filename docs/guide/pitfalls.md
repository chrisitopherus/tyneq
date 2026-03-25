# Common Pitfalls

This page documents runtime mistakes that are easy to miss because they involve deferred execution, resource management, or subtle operator semantics. Each pitfall is shown with a failing pattern and a corrected version.

> **See also:** [Querying & Deferred Execution](/guide/querying-and-deferred-execution) for the foundational mental model behind most of the issues here.

---

## Pitfall 1 — One-Shot Sources

A plain JavaScript generator function returns a *generator object* — an iterator that can only be consumed once. Wrapping it in `Tyneq.from` does not make it re-enumerable.

```ts
// ❌ source can only be iterated once
function* naturals() {
    let n = 0;
    while (true) yield n++;
}

const query = Tyneq.from(naturals()).take(5);

query.toArray();  // [0, 1, 2, 3, 4]
query.toArray();  // [] — generator is already exhausted
```

**Why it happens:** `Tyneq.from` accepts any `Iterable<T>`. A generator object *is* iterable, but its `[Symbol.iterator]()` method returns `this` — the same exhausted iterator — on every call. Tyneq has no way to distinguish a one-shot source from a re-enumerable one.

**Fix — wrap the call, not the object:**

```ts
// ✅ pass a fresh iterable each time
const query = Tyneq.from({ [Symbol.iterator]: naturals }).take(5);

query.toArray();  // [0, 1, 2, 3, 4]
query.toArray();  // [0, 1, 2, 3, 4]
```

Or use a re-entrant source: `Tyneq.range(0, Infinity)` internally produces a fresh enumerator on every iteration.

**Spotting it:** `toArray()` returns results the first time and an empty array on every subsequent call. The query plan will show the correct structure — the issue is the source node, not the operators.

---

## Pitfall 2 — Capturing Mutable State in a Closure

Deferred operators capture *references*, not values. A variable captured inside a predicate or selector reflects the value it holds *at the time the operator runs*, not when the operator was composed.

```ts
// ❌ threshold is captured by reference
let threshold = 10;

const query = Tyneq.from([5, 15, 20]).where(x => x > threshold);

threshold = 100;  // mutated before iteration

query.toArray();  // [] — threshold is 100 at iteration time, not 10
```

**Why it happens:** The `where` operator stores the predicate function but does not evaluate it until the consumer pulls elements. By then, `threshold` has the new value.

**Fix — capture the value explicitly:**

```ts
// ✅ snapshot the value at composition time
const threshold = 10;
const query = Tyneq.from([5, 15, 20]).where(x => x > threshold);
```

Or, if the threshold must be dynamic, document and test the "late binding" behavior explicitly.

**General rule:** Prefer `const` over `let` for variables captured by operator predicates or selectors.

---

## Pitfall 3 — Side Effects Run More Than Once

Side effects placed inside predicates or selectors execute once *per element per enumeration*. Iterating a query twice executes every side effect twice.

```ts
// ❌ side effects fire on every enumeration
const query = Tyneq.from([1, 2, 3])
    .tap(x => console.log("processing", x))
    .where(x => x % 2 !== 0);

query.toArray();
// processing 1 / processing 2 / processing 3

query.toArray();
// processing 1 / processing 2 / processing 3  ← fires again
```

**Why it happens:** Each `toArray()` call triggers a full re-enumeration of the pipeline from root to leaf. All operators — including `tap` — run again.

**Fix:** Use `memoize()` to cache results after the first enumeration:

```ts
// ✅ tap fires once; subsequent enumerations replay the cached sequence
const query = Tyneq.from([1, 2, 3])
    .tap(x => console.log("processing", x))
    .where(x => x % 2 !== 0)
    .memoize();

query.toArray();
// processing 1 / processing 2 / processing 3

query.toArray();
// (no output — returns cached results)
```

If re-execution is intentional (e.g. reading a live data source), structure the code so callers are aware and side effects are idempotent.

---

## Pitfall 4 — Buffer Operators Materialise the Full Source

Buffer operators (`orderBy`, `reverse`, `groupBy`, `distinct`) must read the entire upstream before producing any output. Placing a buffer operator before a limiting operator does not short-circuit the buffer pass.

```ts
// ❌ reads ALL of largeCollection even though we want only 5 results
const result = Tyneq.from(largeCollection)
    .orderBy(x => x.score)
    .take(5)
    .toArray();
```

**Why it happens:** `orderBy` is a buffer operator — it reads and sorts the entire source during its first `next()` call. `take(5)` then short-circuits the drain phase, but the full materialization has already occurred.

**Fix — apply limiting operators before buffering when semantics allow:**

```ts
// ✅ take(100) filters before orderBy materializes the source
// Correct only if the 5 highest-scored items are within the first 100
const result = Tyneq.from(largeCollection)
    .take(100)            // streaming — O(1) memory
    .orderBy(x => x.score)
    .take(5)
    .toArray();
```

If you genuinely need the global top-5, the buffer is unavoidable and correct. Document this in call sites that are performance-sensitive.

**Rule of thumb:** Treat any operator categorised as `"buffer"` in the query plan as an O(n) memory allocation site. Limit the source upstream whenever the semantics allow.

---

## Pitfall 5 — Wrong Operator Order Changes Semantics

The order of operator composition directly determines the result. Two orderings that look equivalent often are not.

### Filter before versus after transform

```ts
const data = [1, -2, 3, -4];

// Different results — order matters
Tyneq.from(data).where(x => x > 0).select(x => x * 2).toArray();
// [2, 6]  — filter, then double

Tyneq.from(data).select(x => x * 2).where(x => x > 0).toArray();
// [2, 6]  — double (gives [2,-4,6,-8]), then filter ← same result here, but different intermediate values
```

The result happens to match here, but the two pipelines compute different intermediate sequences. If the `where` predicate or `select` selector has side effects, the order changes which elements trigger them.

### Take before versus after sort

```ts
const scores = [30, 10, 50, 20, 40];

// ❌ This is NOT "top 3 scores"
Tyneq.from(scores).take(3).orderBy(x => x).toArray();
// [10, 20, 30] — takes the FIRST 3 elements [30,10,50] and sorts them

// ✅ This IS "top 3 scores"
Tyneq.from(scores).orderBy(x => x).take(3).toArray();
// [10, 20, 30] — sorts all, then takes the 3 lowest
```

**Rule:** Mentally trace which elements are present at each stage of the pipeline. Operator composition is sequential, not declarative.

---

## Pitfall 6 — Missing `earlyComplete` Leaks Upstream Resources {#missing-earlycomplete}

When writing a custom operator that stops consuming the source before it is exhausted, returning `done()` instead of `earlyComplete()` leaves the upstream enumerator unreleased.

```ts
// ❌ source enumerator is never disposed
protected override handleNext(): IteratorResult<T> {
    if (this.emitted >= this.count) return this.done();  // wrong — source may still have elements
    // ...
}
```

**Why it matters:** The upstream enumerator may hold real resources — a database cursor, a file handle, or another enumerator mid-way through a pipeline. Returning `done()` marks the current enumerator as completed but does *not* call `dispose()`, so the upstream `return()` is never invoked.

**Fix:**

```ts
// ✅ earlyComplete() calls dispose(), which propagates return() upstream
protected override handleNext(): IteratorResult<T> {
    if (this.emitted >= this.count) return this.earlyComplete();
    // ...
}
```

The table in [Building Custom Enumerators](/guide/custom-enumerators#choosing-the-right-completion-helper) maps every exit path to the correct helper.

**How to detect it:** Use `tap` to observe whether a downstream early exit (e.g. `take`, `first`) triggers a `return()` on a known resource-holding source:

```ts
let disposed = false;

const resource = {
    [Symbol.iterator]() {
        return {
            next() { return { done: false, value: 1 }; },
            return() { disposed = true; return { done: true, value: undefined }; },
        };
    }
};

Tyneq.from(resource).myCustomOp(2).toArray();
console.log(disposed); // should be true if earlyComplete is used correctly
```

---

## Pitfall 7 — Mutable Accumulator in `aggregate`

`aggregate` folds elements using a user-supplied accumulator function. If the accumulator's initial value is a mutable object and the query is iterated more than once, the object is mutated in-place across runs.

```ts
// ❌ same array instance is reused across enumerations
const accumulator = { values: [] as number[], sum: 0 };

const result = Tyneq.from([1, 2, 3]).aggregate(
    accumulator,
    (acc, x) => { acc.values.push(x); acc.sum += x; return acc; },
    acc => acc
);
// → { values: [1,2,3], sum: 6 }
// But accumulator is now mutated — calling this again with the same seed is wrong
```

**Why it happens:** `aggregate` is a terminal operator — it runs immediately and mutates the seed object in place. Calling `aggregate` again with the same mutable seed accumulates on top of the already-mutated state.

**Fix — produce a fresh seed on every call:**

```ts
// ✅ factory pattern: fresh seed per run
function summarize(source: TyneqSequence<number>) {
    return source.aggregate(
        { values: [] as number[], sum: 0 },  // fresh object literal each call
        (acc, x) => { acc.values.push(x); acc.sum += x; return acc; },
        acc => acc
    );
}
```

This is the same issue as mutating a default parameter value in JavaScript. Treat accumulator seeds the same way — always create a fresh instance.

---

## Pitfall 8 — Confusing `first` and `firstOrDefault`

`first(predicate)` throws when no element satisfies the predicate. `firstOrDefault(predicate, defaultValue)` returns `defaultValue` instead of throwing. Both require a predicate argument.

```ts
const items = Tyneq.from([1, 2, 3]);

// ❌ throws if no even numbers exist
const even = items.first(x => x % 2 === 0);

// ✅ returns 0 if no even numbers exist
const even = items.firstOrDefault(x => x % 2 === 0, 0);
```

The same throwing/non-throwing distinction applies to `last`/`lastOrDefault`, `single`/`singleOrDefault`, and `elementAt`/`elementAtOrDefault`.

**Rule:** Use the `OrDefault` variant whenever the no-match case is a normal outcome rather than a programming error.

---

## Debugging Techniques

### Use `tap` to observe elements at any pipeline stage

```ts
Tyneq.from(data)
    .tap(x => console.log("after source:", x))
    .where(pred)
    .tap(x => console.log("after where:", x))
    .select(fn)
    .toArray();
```

`tap` is a streaming, zero-overhead pass-through that runs a side-effecting callback on each element. It does not buffer or alter the sequence.

### Use query plan inspection to understand pipeline structure

```ts
import { Tyneq, tyneqQueryNode, QueryPlanPrinter } from "tyneq";

const query = Tyneq.from(data).where(pred).orderBy(fn).take(5);
console.log(QueryPlanPrinter.print(query[tyneqQueryNode]!));
```

The printed plan shows the operator tree in execution order and labels each operator's kind (`streaming`, `buffer`, `terminal`). Buffer operators in the plan are O(n) memory sites — review their position relative to limiting operators.

See [Query Plan Inspection](/guide/query-plan) for the full visitor API.

---

## Related Pages

- [Querying & Deferred Execution](/guide/querying-and-deferred-execution) — execution contract, lifecycle, re-enumeration semantics
- [Building Custom Enumerators](/guide/custom-enumerators) — class-based operator patterns and the `done()` vs `earlyComplete()` distinction
- [Custom Operators](/guide/extensibility) — all registration APIs and validation placement
- [Query Plan Inspection](/guide/query-plan) — runtime pipeline introspection
