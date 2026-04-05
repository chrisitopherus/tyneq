# Operators

All Tyneq operators fall into three categories. If you have not read [Core Concepts](./concepts.md) yet, do that first - understanding streaming vs. buffering makes every operator choice obvious.

::: tip Navigation
Use the sidebar to jump directly to a section. Streaming, Buffering, and Terminal are the three main groups.
:::

---

## Factories

Factories create the root sequence from an external source. They are static methods on `Tyneq`.

### `Tyneq.from(source)`

Wraps any `Iterable<T>`. Works with arrays, `Set`, `Map`, strings, generator factories, and anything else that implements the iterable protocol.

```ts
Tyneq.from([1, 2, 3]);
Tyneq.from(new Set(["a", "b", "c"]));
Tyneq.from(new Map([["x", 1], ["y", 2]])); // TyneqSequence<[string, number]>
Tyneq.from("hello").toArray();              // -> ["h", "e", "l", "l", "o"]
```

### `Tyneq.range(start, count)`

Produces `count` consecutive integers starting from `start`.

```ts
Tyneq.range(1, 5).toArray();   // -> [1, 2, 3, 4, 5]
Tyneq.range(0, 3).toArray();   // -> [0, 1, 2]
Tyneq.range(10, 3).toArray();  // -> [10, 11, 12]
```

### `Tyneq.empty<T>()`

Zero-element sequence. Useful as a no-op source or default value.

```ts
Tyneq.empty<number>().count();   // -> 0
Tyneq.empty<string>().toArray(); // -> []
```

### `Tyneq.enumerate(source)`

Pairs each element with its zero-based index as `[index, element]`.

```ts
Tyneq.enumerate(["a", "b", "c"]).toArray();
// -> [[0, "a"], [1, "b"], [2, "c"]]

// Useful when you need both the element and its position
Tyneq.enumerate(users)
  .where(([i, u]) => u.score > 90)
  .select(([i, u]) => `#${i + 1}: ${u.name}`)
  .toArray();
```

### `Tyneq.random(count, fn)`

Produces `count` elements by calling `fn` once per element.

```ts
Tyneq.random(3, () => Math.floor(Math.random() * 100)).toArray();
// -> [42, 17, 88]  (random each time)
```

---

## Streaming Operators

O(1) memory. Deferred. Process one element at a time.

### Projection

#### `select(fn)`

Projects each element through `fn`. The backbone of pipeline transformation.

```ts
Tyneq.from([1, 2, 3]).select(x => x * 10).toArray();       // -> [10, 20, 30]
Tyneq.from(users).select(u => u.name).toArray();             // -> ["Ada", "Grace", ...]
Tyneq.from(users).select(u => ({ id: u.id, name: u.name })).toArray();
```

#### `selectMany(fn)`

Projects each element to an iterable, then flattens the results into a single sequence. Think of it as `flatMap`.

```ts
Tyneq.from([[1, 2], [3, 4], [5]]).selectMany(x => x).toArray();
// -> [1, 2, 3, 4, 5]

// Flatten order items across all orders
Tyneq.from(orders).selectMany(o => o.items).toArray();

// Project and flatten at the same time
Tyneq.from(users)
  .selectMany(u => u.roles.map(r => `${u.name}:${r}`))
  .toArray();
// -> ["Ada:admin", "Ada:dev", "Grace:dev", ...]
```

#### `populate(value)`

Replaces every element with the same `value`. Useful for counting or signaling.

```ts
Tyneq.from([1, 2, 3]).populate(0).toArray();   // -> [0, 0, 0]
```

#### `cast<U>()`

A compile-time type assertion. No runtime check is performed - TypeScript will trust the cast. Use `ofType` for safe narrowing.

```ts
const mixed: TyneqSequence<unknown> = Tyneq.from(data);
const typed = mixed.cast<string>();  // TypeScript now sees TyneqSequence<string>
```

---

### Filtering

#### `where(pred)`

Keeps only elements where `pred` returns `true`.

```ts
Tyneq.from([1, 2, 3, 4, 5]).where(x => x % 2 === 0).toArray(); // -> [2, 4]

Tyneq.from(users)
  .where(u => u.active && u.score >= 80)
  .toArray();
```

#### `ofType<U>(guard)`

Filters elements by a type guard, narrowing the sequence type to `U`.

```ts
const mixed = Tyneq.from<string | number>(["a", 1, "b", 2]);
const strings = mixed.ofType<string>(x => typeof x === "string");
strings.toArray(); // -> ["a", "b"]  // TypeScript knows these are strings
```

#### `throttle(n)`

Emits every `n`th element (indices 0, n, 2n, ...). Useful for sampling large sequences.

```ts
Tyneq.range(0, 10).throttle(3).toArray(); // -> [0, 3, 6, 9]
```

---

### Slicing

#### `take(n)` / `takeWhile(pred)`

```ts
Tyneq.range(1, 100).take(5).toArray();                      // -> [1, 2, 3, 4, 5]
Tyneq.range(1, 10).takeWhile(x => x < 5).toArray();        // -> [1, 2, 3, 4]
```

`take` stops the pipeline after `n` elements - no further elements are pulled from upstream.

#### `skip(n)` / `skipWhile(pred)` / `skipLast(n)`

```ts
Tyneq.range(1, 10).skip(7).toArray();                       // -> [8, 9, 10]
Tyneq.range(1, 10).skipWhile(x => x < 5).toArray();        // -> [5, 6, 7, 8, 9, 10]
Tyneq.range(1, 5).skipLast(2).toArray();                    // -> [1, 2, 3]
```

Note: `skipLast(n)` buffers `n` elements internally to know when the tail starts.

#### `chunk(size)`

Splits the sequence into non-overlapping arrays of at most `size` elements. The last chunk may be smaller.

```ts
Tyneq.range(1, 7).chunk(3).toArray();   // -> [[1,2,3],[4,5,6],[7]]
Tyneq.range(1, 6).chunk(2).toArray();   // -> [[1,2],[3,4],[5,6]]

// Process a large dataset in batches
Tyneq.from(records).chunk(100).tap(batch => saveBatch(batch)).consume();
```

---

### Combining

#### `append(item)` / `prepend(item)`

```ts
Tyneq.from([1, 2, 3]).append(4).toArray();    // -> [1, 2, 3, 4]
Tyneq.from([1, 2, 3]).prepend(0).toArray();   // -> [0, 1, 2, 3]
```

#### `concat(other)`

Appends all elements from `other` to the end of the sequence.

```ts
Tyneq.from([1, 2]).concat([3, 4]).toArray();              // -> [1, 2, 3, 4]
Tyneq.from(activeUsers).concat(inactiveUsers).toArray();
```

#### `zip(other, selector)`

Pairs elements from two sequences using `selector`. Stops at the shorter sequence.

```ts
const names = Tyneq.from(["Ada", "Linus"]);
const scores = Tyneq.from([84, 92, 97]); // extra element ignored

names.zip(scores, (name, score) => `${name}: ${score}`).toArray();
// -> ["Ada: 84", "Linus: 92"]
```

#### `defaultIfEmpty(value)`

Yields the source unchanged. If the source is empty, yields `value` instead.

```ts
Tyneq.from([]).defaultIfEmpty(0).toArray();              // -> [0]
Tyneq.from([1, 2]).defaultIfEmpty(0).toArray();          // -> [1, 2]

// Useful for providing a fallback in aggregate pipelines
Tyneq.from(matches).defaultIfEmpty(noMatchSentinel).first();
```

---

### Windowing and pairing

#### `pairwise()`

Produces overlapping `[prev, curr]` pairs. Empty if fewer than 2 elements.

```ts
Tyneq.range(1, 4).pairwise().toArray();
// -> [[1,2],[2,3],[3,4]]

// Compute deltas between consecutive readings
Tyneq.from(readings)
  .pairwise()
  .select(([prev, curr]) => curr - prev)
  .toArray();
```

#### `split(pred)`

Splits the sequence into sub-arrays on elements matching `pred`. The matching element is not included.

```ts
Tyneq.from([1, 0, 2, 3, 0, 4]).split(x => x === 0).toArray();
// -> [[1],[2,3],[4]]
```

---

### Scanning

#### `scan(seed, fn)`

Emits the running accumulator after each element. Like `aggregate` but yields intermediate results.

```ts
Tyneq.range(1, 5).scan(0, (acc, x) => acc + x).toArray();
// -> [1, 3, 6, 10, 15]  (running sum)

// Running product
Tyneq.range(1, 5).scan(1, (acc, x) => acc * x).toArray();
// -> [1, 2, 6, 24, 120]
```

---

### Side effects

#### `tap(fn)` / `tapIf(fn, pred)`

Runs a side-effect function for each element as it passes through, then yields the element unchanged.

```ts
Tyneq.from(events)
  .tap(e => logger.debug("processing", e.type))
  .where(e => e.type === "click")
  .tap(e => metrics.increment("clicks"))
  .select(e => e.target)
  .toArray();
```

`tapIf` runs the side effect only while a condition holds:

```ts
const verbose = process.env.DEBUG === "1";
Tyneq.from(data)
  .tapIf(x => console.log(x), () => verbose)
  .toArray();
```

---

### Piping

#### `pipe(factory)`

Passes the sequence through a custom factory function. Useful for applying a reusable transformation without registering a full operator. Records a `"pipe"` node in the query plan.

```ts
function normalize<T extends { score: number }>(seq: TyneqSequence<T>) {
  const max = seq.max(x => x.score);
  return seq.select(x => ({ ...x, score: x.score / max }));
}

Tyneq.from(users).pipe(normalize).toArray();
```

---

## Buffering Operators

O(n) memory. Deferred. The full source is read before any output is produced. These operators are where materialization boundaries occur.

### Sorting

See [Ordering](./ordering.md) for comparers and full multi-key sort details.

#### `orderBy(key, cmp?)` / `orderByDescending(key, cmp?)`

Sort the sequence by a key selector. Stable - equal keys keep their original order.

```ts
Tyneq.from(users).orderBy(u => u.name).toArray();
Tyneq.from(users).orderByDescending(u => u.score).toArray();

// With a custom comparer
import { TyneqComparer } from "tyneq";
Tyneq.from(users).orderBy(u => u.name, TyneqComparer.localeComparer()).toArray();
```

#### `thenBy(key, cmp?)` / `thenByDescending(key, cmp?)`

Secondary sort, only available on the result of `orderBy`/`orderByDescending`.

```ts
Tyneq.from(employees)
  .orderBy(e => e.department)
  .thenBy(e => e.level)
  .thenByDescending(e => e.yearsAtCompany)
  .toArray();
```

#### `reverse()`

Reverses the sequence.

```ts
Tyneq.range(1, 5).reverse().toArray(); // -> [5, 4, 3, 2, 1]
```

#### `shuffle()`

Returns elements in a random permutation using `Math.random()`. Different each evaluation (use `memoize()` to fix the shuffle).

```ts
Tyneq.from(deck).shuffle().take(5).toArray(); // 5 random cards
```

---

### Deduplication

#### `distinct()`

Removes duplicate elements using `===` equality. Preserves first occurrence order.

```ts
Tyneq.from([1, 2, 2, 3, 1, 4]).distinct().toArray(); // -> [1, 2, 3, 4]
```

#### `distinctBy(key)`

Removes elements with duplicate keys. Preserves the first element for each key.

```ts
Tyneq.from(users)
  .distinctBy(u => u.email)
  .toArray(); // one user per email address
```

---

### Grouping and joins

See [Grouping & Joins](./grouping.md) for full examples.

#### `groupBy(keySelector, valueSelector, resultSelector)`

Groups elements by a key, projects each element's value, and transforms each group.

```ts
Tyneq.from(employees)
  .groupBy(
    e => e.department,
    e => e.name,
    (dept, names) => ({ dept, members: names.toArray() })
  )
  .toArray();
// -> [{ dept: "core", members: ["Ada", "Grace"] }, ...]
```

#### `join(inner, outerKey, innerKey, result)`

Inner join: matches elements from both sequences by key.

```ts
Tyneq.from(orders).join(
  products,
  o => o.productId,
  p => p.id,
  (order, product) => ({ ...order, productName: product.name })
).toArray();
```

#### `groupJoin(inner, outerKey, innerKey, result)`

Left outer join: each outer element is paired with all matching inner elements as a sequence.

```ts
Tyneq.from(customers).groupJoin(
  orders,
  c => c.id,
  o => o.customerId,
  (customer, orders) => ({ customer, orderCount: orders.count() })
).toArray();
```

---

### Set operations

See [Set Operations](./set-operations.md) for full examples.

| Operator | Description |
|---|---|
| `union(other)` | All distinct elements from both sequences |
| `unionBy(other, key)` | Union deduplicated by key selector |
| `intersect(other)` | Elements present in both sequences |
| `intersectBy(other, key)` | Intersection by key selector |
| `except(other)` | Elements not in `other` |
| `exceptBy(other, key)` | Difference by key selector |

```ts
const a = Tyneq.from([1, 2, 3]);
const b = Tyneq.from([2, 3, 4]);

a.union(b).toArray();     // -> [1, 2, 3, 4]
a.intersect(b).toArray(); // -> [2, 3]
a.except(b).toArray();    // -> [1]
```

---

### Insertion

#### `backsert(index, other)`

Inserts `other` into the sequence at a position counted from the end. `index=0` appends. `index=1` inserts before the last element. And so on.

```ts
Tyneq.from([1, 2, 3]).backsert(0, [9, 10]).toArray(); // -> [1, 2, 3, 9, 10]
Tyneq.from([1, 2, 3]).backsert(1, [9]).toArray();      // -> [1, 2, 9, 3]
Tyneq.from([1, 2, 3]).backsert(2, [9]).toArray();      // -> [1, 9, 2, 3]
```

---

### Caching

#### `memoize()`

Caches elements after the first enumeration. Returns a `TyneqCachedSequence<T>` with a `refresh()` method.

```ts
const result = Tyneq.from(expensiveSource)
  .where(x => x.active)
  .shuffle()
  .memoize();

result.toArray(); // executes pipeline, caches
result.toArray(); // returns cache - no re-execution
result.count();   // from cache

result.refresh(); // invalidate
result.toArray(); // re-executes pipeline
```

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

```ts
const arr = Tyneq.from([1, 2, 3]).toArray();         // [1, 2, 3]
const set = Tyneq.from([1, 1, 2]).toSet();            // Set{1, 2}
const map = Tyneq.from(users).toMap(u => [u.id, u]);  // Map<id, User>
const rec = Tyneq.from(users).toRecord(u => [u.id, u.name]); // { [id]: name }
```

---

### Element access

| Operator | Returns | Throws when |
|---|---|---|
| `first(pred?)` | First matching element | No match |
| `firstOrDefault(pred, default)` | First match or default | - |
| `last(pred?)` | Last matching element | No match |
| `lastOrDefault(pred, default)` | Last match or default | - |
| `single(pred?)` | Exactly one matching element | No match or more than one |
| `singleOrDefault(pred, default)` | One match or default | More than one found |
| `elementAt(index)` | Element at index | Out of range |
| `elementAtOrDefault(index, default)` | Element at index or default | - |

```ts
const users = Tyneq.from([
  { id: 1, name: "Ada", active: true },
  { id: 2, name: "Grace", active: false },
]);

users.first(u => u.active).name;                    // "Ada"
users.firstOrDefault(u => u.active, null)?.name;    // "Ada"
users.firstOrDefault(u => u.id === 99, null);       // null

// single: exactly one must match - throws if 0 or 2+ match
users.single(u => u.id === 1);  // { id: 1, name: "Ada", ... }
```

---

### Counting and aggregation

```ts
const nums = Tyneq.from([1, 2, 3, 4, 5]);

nums.count();               // -> 5
nums.countBy(x => x > 3);  // -> 2
nums.sum(x => x);           // -> 15
nums.average(x => x);       // -> 3

// General fold
nums.aggregate(
  0,
  (acc, x) => acc + x,
  acc => acc
); // -> 15

// With result projection
nums.aggregate(
  { sum: 0, count: 0 },
  (acc, x) => ({ sum: acc.sum + x, count: acc.count + 1 }),
  acc => acc.sum / acc.count
); // -> 3 (average)
```

---

### Min / Max

```ts
const nums = Tyneq.from([3, 1, 4, 1, 5, 9]);

nums.min();                           // -> 1
nums.max();                           // -> 9
nums.minMax();                        // -> { min: 1, max: 9 }

const users = Tyneq.from(people);
users.minBy(u => u.score);            // -> element with lowest score
users.maxBy(u => u.score);            // -> element with highest score
```

---

### Predicates

```ts
const nums = Tyneq.from([1, 2, 3, 4, 5]);

nums.any(x => x > 4);       // -> true
nums.all(x => x > 0);       // -> true
nums.all(x => x > 3);       // -> false
nums.contains(3);            // -> true

// Sequence equality
nums.sequenceEqual(Tyneq.from([1, 2, 3, 4, 5]));  // -> true
nums.startsWith(Tyneq.from([1, 2, 3]));            // -> true

nums.isNullOrEmpty();  // -> false
Tyneq.empty<number>().isNullOrEmpty(); // -> true
```

---

### Search

```ts
const nums = Tyneq.from([10, 20, 30, 40]);

nums.indexOf(x => x > 25);      // -> 2 (index of 30)
nums.indexOf(x => x > 25, 3);   // -> 3 (start search from index 3, finds 40)
nums.indexOf(x => x > 100);     // -> -1
```

---

### Side effects

#### `consume()`

Drains the sequence for its side effects. Use this when the pipeline exists only for `tap` calls.

```ts
Tyneq.from(events)
  .tap(e => analytics.track(e))
  .tap(e => logger.log(e))
  .consume(); // explicit: we only care about side effects, not the values
```
