# Ordering

`orderBy` and `orderByDescending` sort the full source sequence. They are buffering operators - the entire source is read into memory before any output is yielded.

## Basic Sort

```ts
import { Tyneq } from "tyneq";

Tyneq.from([3, 1, 4, 1, 5]).orderBy(x => x).toArray();
// -> [1, 1, 3, 4, 5]

Tyneq.from([3, 1, 4, 1, 5]).orderByDescending(x => x).toArray();
// -> [5, 4, 3, 1, 1]
```

## Key Selector

`orderBy(keySelector, comparer?)` extracts a sort key from each element. The key type can be anything - number, string, date, or a custom comparable.

```ts
const people = [
  { name: "Eve",   score: 72 },
  { name: "Alice", score: 88 },
  { name: "Bob",   score: 72 },
];

Tyneq.from(people)
  .orderBy(p => p.score)
  .select(p => p.name)
  .toArray();
// -> ["Eve", "Bob", "Alice"]  (stable: Eve and Bob keep their relative order)
```

## Stability

`orderBy` and `orderByDescending` use a **stable sort**. Elements with equal keys keep their original relative order. In the example above, Eve and Bob both have score 72; Eve comes first in the input and remains first in the output.

## Multi-Key Sort

Chain `thenBy` or `thenByDescending` on the result of `orderBy` to add secondary sort criteria.

`orderBy` returns a `TyneqOrderedSequence` which exposes `thenBy` and `thenByDescending`. These methods are not available on a plain `TyneqSequence`.

```ts
Tyneq.from(people)
  .orderBy(p => p.score)
  .thenBy(p => p.name)
  .toArray();
// sorted by score ascending, then by name ascending for ties
```

```ts
Tyneq.from(records)
  .orderBy(r => r.department)
  .thenByDescending(r => r.salary)
  .thenBy(r => r.name)
  .toArray();
```

Chain as many levels as needed. The sort is applied in a single stable pass.

## Custom Comparers

Pass an optional `comparer: Comparer<TKey>` as the second argument to control sort order.

```ts
import { TyneqComparer } from "tyneq";

// Default comparer works for numbers, strings, and dates
Tyneq.from([10, 2, 30]).orderBy(x => x, TyneqComparer.defaultComparer).toArray();
// -> [2, 10, 30]

// Locale-aware string sort
Tyneq.from(words)
  .orderBy(w => w, TyneqComparer.createLocaleComparer("de"))
  .toArray();

// Reverse sort using a wrapper
Tyneq.from(scores)
  .orderBy(s => s, TyneqComparer.reverse(TyneqComparer.defaultComparer))
  .toArray();
```

## `TyneqComparer` Built-ins

| Method | Use |
|---|---|
| `TyneqComparer.defaultComparer` | Natural order via `<` / `>` (works for numbers, strings, dates) |
| `TyneqComparer.reverse(cmp)` | Flip any comparer to reverse order |
| `TyneqComparer.createLocaleComparer(locale?, options?)` | String sort with locale and collation options |
| `TyneqComparer.defaultEqualityComparer` | `===` equality |
| `TyneqComparer.caseInsensitiveEqualityComparer` | Case-insensitive string equality |
| `TyneqComparer.caseInsensitiveComparer` | Case-insensitive ordering comparer |

## Custom Inline Comparer

Any `(a: TKey, b: TKey) => number` function works:

```ts
// Sort by string length, longest first
Tyneq.from(["apple", "fig", "banana"])
  .orderByDescending(s => s, (a, b) => a.length - b.length)
  .toArray();
// -> ["banana", "apple", "fig"]
```

## thenBy Without a Previous orderBy

`thenBy` and `thenByDescending` are only available on `TyneqOrderedSequence`, which is returned by `orderBy`/`orderByDescending`. They are not available on a plain sequence.

```ts
// TypeScript error - thenBy does not exist on TyneqSequence
Tyneq.from([1, 2]).thenBy(x => x); // compile error
```

Start every multi-key chain with `orderBy` or `orderByDescending`.
