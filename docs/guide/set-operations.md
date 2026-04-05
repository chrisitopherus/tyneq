# Set Operations

Tyneq provides six set-style operators. All are buffering operators - they read the full source before producing output. Each comes in two variants: equality-based (`===`) and key-based (`keySelector`).

---

## `distinct` / `distinctBy`

Remove duplicate elements.

```ts
// Equality-based: uses ===
Tyneq.from([1, 2, 2, 3, 1]).distinct().toArray();
// -> [1, 2, 3]

// Key-based: compares by projected key
const people = [
  { name: "Alice", dept: "eng" },
  { name: "Bob",   dept: "eng" },
  { name: "Carol", dept: "hr" },
];

Tyneq.from(people)
  .distinctBy(p => p.dept)
  .select(p => p.name)
  .toArray();
// -> ["Alice", "Carol"]  (first occurrence per key is kept)
```

---

## `union` / `unionBy`

All distinct elements from both sequences combined.

```ts
// Equality-based
Tyneq.from([1, 2, 3]).union([2, 3, 4]).toArray();
// -> [1, 2, 3, 4]

// Key-based
const left = [{ id: 1 }, { id: 2 }];
const right = [{ id: 2 }, { id: 3 }];

Tyneq.from(left)
  .unionBy(right, x => x.id)
  .select(x => x.id)
  .toArray();
// -> [1, 2, 3]
```

Elements from the left sequence appear first. Duplicates within the left sequence are also removed.

---

## `intersect` / `intersectBy`

Elements present in both sequences.

```ts
// Equality-based
Tyneq.from([1, 2, 3, 4]).intersect([2, 4, 6]).toArray();
// -> [2, 4]

// Key-based
const a = [{ id: 1 }, { id: 2 }, { id: 3 }];
const b = [{ id: 2 }, { id: 4 }];

Tyneq.from(a)
  .intersectBy(b.map(x => x.id), x => x.id)
  .select(x => x.id)
  .toArray();
// -> [2]
```

---

## `except` / `exceptBy`

Elements in the source that are NOT in the exclusion set.

```ts
// Equality-based
Tyneq.from([1, 2, 3, 4]).except([2, 4]).toArray();
// -> [1, 3]

// Key-based
const all = [{ id: 1 }, { id: 2 }, { id: 3 }];
const excluded = [2, 3];

Tyneq.from(all)
  .exceptBy(excluded, x => x.id)
  .select(x => x.id)
  .toArray();
// -> [1]
```

---

## Equality Semantics

All equality-based variants use `===`. Objects are compared by reference, not by value.

```ts
const a = { x: 1 };
const b = { x: 1 };
Tyneq.from([a]).union([b]).count(); // -> 2 - a !== b even though they look the same
```

When comparing objects by content, use the key-based variants and select the identifying property.

---

## Choosing the Right Variant

| Need | Operator |
|---|---|
| Remove exact duplicates from one sequence | `distinct()` |
| Remove duplicates by a property | `distinctBy(key)` |
| All elements from two sequences, no duplicates | `union(other)` |
| All elements by property, no key duplicates | `unionBy(other, key)` |
| Elements in both sequences | `intersect(other)` |
| Elements whose key is in both sequences | `intersectBy(keys, key)` |
| Elements not in another sequence | `except(other)` |
| Elements whose key is not in another set | `exceptBy(keys, key)` |
