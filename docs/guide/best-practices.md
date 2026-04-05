# Best Practices

## Use `firstOrDefault` instead of `first` when empty is expected

`first(pred)` throws `SequenceContainsNoElementsError` when no element matches. If an empty result is a normal case, use `firstOrDefault` and handle the default explicitly.

```ts
// May throw - only correct when absence is a bug
const user = users.first(u => u.id === id);

// Correct when "not found" is expected
const user = users.firstOrDefault(u => u.id === id, null);
if (user === null) { /* handle not found */ }
```

The same pattern applies to `last`/`lastOrDefault`, `single`/`singleOrDefault`, and `elementAt`/`elementAtOrDefault`.

---

## Use `TyneqComparer` instead of inline comparers

Inline comparers are error-prone and not reusable. The built-in comparers in `TyneqComparer` are tested and cover the common cases.

```ts
// Bad - custom inline, easy to get wrong
.orderBy(x => x, (a, b) => (a > b ? 1 : a < b ? -1 : 0))

// Good
import { TyneqComparer } from "tyneq";
.orderBy(x => x, TyneqComparer.defaultComparer)
.orderBy(x => x, TyneqComparer.numericComparer)    // numbers only
.orderBy(x => x, TyneqComparer.localeComparer())   // locale-aware strings
```

---

## Wrap generator functions, not generator objects

Passing a generator *object* to `Tyneq.from` creates a one-shot source. The sequence appears to work on the first iteration but returns empty results on subsequent iterations.

```ts
// Bad - one-shot
function* naturals() { let n = 0; while (true) yield n++; }
const seq = Tyneq.from(naturals()).take(5); // generator object
seq.toArray(); // [0, 1, 2, 3, 4]
seq.toArray(); // [] - already exhausted

// Good - factory
const seq = Tyneq.from({ [Symbol.iterator]: naturals }).take(5);
seq.toArray(); // [0, 1, 2, 3, 4]
seq.toArray(); // [0, 1, 2, 3, 4]
```

---

## Use `memoize()` when re-evaluation is expensive

Re-iterating a sequence re-runs the entire pipeline from the source. If the source involves I/O, heavy computation, or random results, cache it:

```ts
// Every toArray() re-shuffles
const seq = Tyneq.from(data).shuffle().take(10);
seq.toArray(); // random subset
seq.toArray(); // different random subset

// Correct
const seq = Tyneq.from(data).shuffle().take(10).memoize();
seq.toArray(); // random subset
seq.toArray(); // same subset
```

Do not memoize unless there is a concrete reason. Pipelines that read from in-memory arrays are fast to re-execute.

---

## Limit before sorting when only a small result is needed

Buffering operators (`orderBy`, `groupBy`, `distinct`, ...) always read the full source. Placing `take` before the buffer reduces the number of elements that must be sorted.

```ts
// Bad - sorts 100000 items to take 5
Tyneq.from(largeArray).orderBy(x => x.score).take(5).toArray();

// Better when semantics allow - take first 100, then sort
Tyneq.from(largeArray).take(100).orderBy(x => x.score).take(5).toArray();
```

If you genuinely need the global top-5, the full sort is unavoidable.

---

## Keep `validate` callbacks cheap and synchronous

The `validate` function in `createGeneratorOperator`, `createOperator`, etc. runs eagerly at the call site, before the lazy pipeline is set up. It must be synchronous. Keep it focused on argument type and range checks - not I/O or heavy computation.

---

## Tag plugin registrations with a name prefix

When distributing a plugin, prefix all operator names to avoid conflicts with built-in or other third-party operators.

```ts
createGeneratorOperator({ name: "mylib_slidingAverage", ... });
```

Use `OperatorRegistry.addGuard` in tests to enforce this convention for your project.

---

## Use the query plan for debugging

When a pipeline produces unexpected output, print the query plan to verify the operator chain is what you expect:

```ts
import { QueryPlanPrinter, tyneqQueryNode } from "tyneq";

const query = Tyneq.from(data).where(pred).orderBy(fn).take(5);
console.log(QueryPlanPrinter.print(query[tyneqQueryNode]!));
// from([...])
//   -> where(<fn>)
//   -> orderBy(<fn>)
//   -> take(5)
```

Buffering operators in the plan are O(n) memory sites. Source nodes show `sourceKind` via `isSourceNode`.

---

## Validate at the operator call site, not in constructors

For custom class-based operators, do not validate user arguments in the constructor. Validation must happen before the lazy factory is created, which means in `validate` (functional APIs) or the third argument to `@operator`. Constructors run at iteration time, not at call time.

---

## Prefer `consume()` for pipelines that exist for their side effects

If a pipeline exists purely to trigger `tap` calls, drain it with `consume()` to make the intent clear:

```ts
Tyneq.from(events)
  .tap(e => logger.log(e))
  .consume(); // explicit: we only care about the side effect
```
