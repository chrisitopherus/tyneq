# Operators

Every method on a sequence falls into one of three categories. See [Concepts](/guide/concepts) for the distinction.

---

## Factories

Create the root sequence from an external source.

| Signature | Description |
|---|---|
| `Tyneq.from(source: Iterable<T>)` | Wrap any iterable (array, Set, Map, string, generator factory, ...) |
| `Tyneq.range(start, count)` | `count` integers starting from `start`. Throws if `count` is negative. |
| `Tyneq.empty<T>()` | Zero-element sequence. |
| `Tyneq.enumerate(source)` | Pair each element with its zero-based index: `[0, e0]`, `[1, e1]`, ... |
| `Tyneq.random(count, fn)` | `count` elements produced by calling `fn` once per element. |

```ts
Tyneq.from([1, 2, 3]);
Tyneq.from(new Set(["a", "b"]));
Tyneq.range(1, 5).toArray();        // -> [1, 2, 3, 4, 5]
Tyneq.empty<string>().count();      // -> 0
Tyneq.enumerate(["a", "b"]).toArray(); // -> [[0, "a"], [1, "b"]]
```

---

## Streaming Operators

O(1) memory. Deferred. Process one element at a time.

### Projection

| Operator | Description |
|---|---|
| `select(fn)` | Project each element through `fn`. |
| `selectMany(fn)` | Project each element to an iterable, flatten results. |
| `populate(value)` | Replace every element with `value`. |
| `cast<U>()` | Compile-time type assertion. No runtime check - use `ofType` for safe narrowing. |

```ts
Tyneq.from([1, 2, 3]).select(x => x * 2).toArray();          // -> [2, 4, 6]
Tyneq.from([[1, 2], [3, 4]]).selectMany(x => x).toArray();   // -> [1, 2, 3, 4]
```

### Filtering

| Operator | Description |
|---|---|
| `where(pred)` | Keep elements where `pred` returns `true`. |
| `ofType<U>(guard)` | Filter to elements matching the type guard, narrowing the type. |
| `throttle(n)` | Emit every `n`th element (indices 0, n, 2n, ...). |

```ts
Tyneq.from([1, 2, 3, 4]).where(x => x % 2 === 0).toArray(); // -> [2, 4]
```

### Slicing

| Operator | Description |
|---|---|
| `take(n)` | First `n` elements. Throws if `n` is negative. |
| `takeWhile(pred)` | Take elements while `pred` holds, then stop. |
| `skip(n)` | Skip first `n` elements. Throws if `n` is negative. |
| `skipWhile(pred)` | Skip elements while `pred` holds, then yield the rest. |
| `skipLast(n)` | Skip the last `n` elements. Buffers `n` elements internally. |
| `chunk(size)` | Non-overlapping arrays of at most `size` elements. Throws if `size <= 0`. |

```ts
Tyneq.range(1, 10).take(3).toArray();    // -> [1, 2, 3]
Tyneq.range(1, 10).skip(7).toArray();    // -> [8, 9, 10]
Tyneq.range(1, 7).chunk(3).toArray();    // -> [[1,2,3],[4,5,6],[7]]
```

### Combining

| Operator | Description |
|---|---|
| `append(item)` | Add one element at the end. |
| `prepend(item)` | Add one element at the beginning. |
| `concat(other)` | Append all elements from `other`. |
| `zip(other, selector)` | Pair elements from two sequences; stops at the shorter. |
| `defaultIfEmpty(value)` | Yield source unchanged, or `value` if source is empty. |

```ts
Tyneq.from([1, 2]).concat([3, 4]).toArray();          // -> [1, 2, 3, 4]
Tyneq.from([1, 2]).zip([10, 20], (a, b) => a + b).toArray(); // -> [11, 22]
```

### Windowing / Pairing

| Operator | Description |
|---|---|
| `pairwise()` | Overlapping `[prev, curr]` pairs. Empty if fewer than 2 elements. |
| `split(pred)` | Split into sub-arrays on elements matching `pred`; delimiter not included. |

```ts
Tyneq.range(1, 4).pairwise().toArray();  // -> [[1,2],[2,3],[3,4]]
```

### Scanning

| Operator | Description |
|---|---|
| `scan(seed, fn)` | Emit running accumulator: `fn(seed, e0)`, `fn(result, e1)`, ... |

```ts
Tyneq.range(1, 4).scan(0, (acc, x) => acc + x).toArray(); // -> [1, 3, 6, 10]
```

### Side Effects

| Operator | Description |
|---|---|
| `tap(fn)` | Run `fn` for each element as it passes through; yield unchanged. |
| `tapIf(fn, pred)` | `tap` only while `pred()` returns `true`. |

### Typing

| Operator | Description |
|---|---|
| `cast<U>()` | Compile-time cast to `U`; no runtime check. |
| `ofType<U>(guard)` | Filter by type guard, narrow to `U`. |

### Piping

| Operator | Description |
|---|---|
| `pipe(factory)` | Pass the sequence through a custom factory; records a `"pipe"` node in the query plan. |

---

## Buffering Operators

O(n) memory. Deferred. Read the full source before yielding.

### Sorting

See [Ordering](/guide/ordering) for full details.

| Operator | Description |
|---|---|
| `orderBy(key, cmp?)` | Sort ascending by `key`. Stable. |
| `orderByDescending(key, cmp?)` | Sort descending by `key`. Stable. |
| `thenBy(key, cmp?)` | Secondary ascending sort (only on `TyneqOrderedSequence`). |
| `thenByDescending(key, cmp?)` | Secondary descending sort. |
| `reverse()` | Reverse the sequence. |
| `shuffle()` | Random permutation using `Math.random()`. |

### Deduplication

| Operator | Description |
|---|---|
| `distinct()` | Remove duplicates using `===` equality. |
| `distinctBy(key)` | Remove duplicates by projected key. |

```ts
Tyneq.from([1, 2, 2, 3, 1]).distinct().toArray(); // -> [1, 2, 3]
```

### Grouping and Joins

See [Grouping](/guide/grouping) for full details.

| Operator | Description |
|---|---|
| `groupBy(key, value, result)` | Group elements by key, project each group. |
| `join(inner, outerKey, innerKey, result)` | Inner join by matching keys. |
| `groupJoin(inner, outerKey, innerKey, result)` | Left outer join with grouped inner results. |

### Set Operations

See [Set Operations](/guide/set-operations) for full details.

| Operator | Description |
|---|---|
| `union(other)` | Distinct elements from both sequences. |
| `unionBy(other, key)` | Union deduplicated by key. |
| `intersect(other)` | Elements present in both sequences. |
| `intersectBy(other, key)` | Intersection by key. |
| `except(other)` | Elements not in `other`. |
| `exceptBy(other, key)` | Difference by key. |

### Insertion

| Operator | Description |
|---|---|
| `backsert(index, other)` | Insert `other` at a position counting from the end. `index=0` appends, `index=1` inserts before the last element. |

```ts
Tyneq.from([1, 2, 3]).backsert(0, [9, 10]).toArray(); // -> [1, 2, 3, 9, 10]
Tyneq.from([1, 2, 3]).backsert(1, [9]).toArray();      // -> [1, 2, 9, 3]
```

### Caching

| Operator | Description |
|---|---|
| `memoize()` | Cache elements as they are iterated; replay on re-enumeration. Returns `TyneqCachedSequence`. |

---

## Terminal Operators

Execute the pipeline immediately and return a concrete value.

### Materialization

| Operator | Returns |
|---|---|
| `toArray()` | `T[]` |
| `toSet()` | `Set<T>` |
| `toMap(selector)` | `Map<K, V>` |
| `toRecord(selector)` | `Record<K, V>` |
| `toAsync()` | `AsyncIterable<T>` |

### Element Access

| Operator | Returns | Throws if |
|---|---|---|
| `first(pred)` | First matching element | None found |
| `firstOrDefault(pred, default)` | First match or default | - |
| `last(pred)` | Last matching element | None found |
| `lastOrDefault(pred, default)` | Last match or default | - |
| `single(pred)` | Exactly one matching element | None found or more than one |
| `singleOrDefault(pred, default)` | One match or default | More than one found |
| `elementAt(index)` | Element at index | Index out of range |
| `elementAtOrDefault(index, default)` | Element at index or default | - |

### Counting and Aggregation

| Operator | Returns |
|---|---|
| `count()` | Number of elements |
| `countBy(pred)` | Count of matching elements |
| `sum(selector)` | Sum of selector values; `0` for empty |
| `average(selector)` | Arithmetic mean; throws on empty |
| `aggregate(seed, fn, result)` | General fold |

### Min / Max

| Operator | Returns | Throws if |
|---|---|---|
| `min(cmp?)` | Minimum element | Empty |
| `max(cmp?)` | Maximum element | Empty |
| `minBy(key, cmp?)` | Element with minimum key | Empty |
| `maxBy(key, cmp?)` | Element with maximum key | Empty |
| `minMax(cmp?)` | `{ min, max }` | Empty |

### Predicates

| Operator | Returns |
|---|---|
| `any(pred)` | `true` if any element matches; `false` for empty |
| `all(pred)` | `true` if all elements match; `true` for empty (vacuous) |
| `contains(value)` | `true` if value is present (`===`) |
| `startsWith(other)` | `true` if sequence begins with all elements of `other` |
| `sequenceEqual(other, cmp?)` | `true` if both sequences have equal elements in order |
| `isNullOrEmpty()` | `true` if empty or first element is null/undefined |

### Search

| Operator | Returns |
|---|---|
| `indexOf(pred, start?)` | Zero-based index of first match, or `-1` |

### Side Effects

| Operator | Description |
|---|---|
| `consume()` | Drain the sequence, discarding all elements. |
