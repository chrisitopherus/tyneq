# Grouping

Tyneq provides three relational operators: `groupBy`, `join`, and `groupJoin`. All are buffering operators - they read the full source before producing output.

---

## `groupBy`

Groups elements by a key, then projects each group with a result selector.

```ts
groupBy(
  keySelector: (item: T) => TKey,
  valueSelector: (item: T) => TValue,
  resultSelector: (key: TKey, values: TyneqSequence<TValue>) => TResult
): TyneqSequence<TResult>
```

### Example: group by team

```ts
import { Tyneq } from "tyneq";

const people = [
  { name: "Ada",   team: "core",  score: 84 },
  { name: "Linus", team: "infra", score: 92 },
  { name: "Grace", team: "core",  score: 97 },
  { name: "Bjarne", team: "infra", score: 78 },
];

Tyneq.from(people)
  .groupBy(
    p => p.team,                                          // key
    p => p.name,                                          // value to group
    (team, names) => ({ team, members: names.toArray() }) // result
  )
  .toArray();
// -> [
//      { team: "core",  members: ["Ada", "Grace"] },
//      { team: "infra", members: ["Linus", "Bjarne"] }
//    ]
```

The `values` sequence passed to `resultSelector` is a `TyneqSequence<TValue>` - you can apply any operators to it before materializing.

### Example: compute group aggregates

```ts
Tyneq.from(people)
  .groupBy(
    p => p.team,
    p => p.score,
    (team, scores) => ({
      team,
      avg: scores.average(s => s),
      count: scores.count(),
    })
  )
  .toArray();
// -> [
//      { team: "core",  avg: 90.5, count: 2 },
//      { team: "infra", avg: 85,   count: 2 }
//    ]
```

---

## `join`

Inner join: produces one result for every matching pair of outer and inner elements.

```ts
join(
  inner: Iterable<TInner>,
  outerKeySelector: (outer: T) => TKey,
  innerKeySelector: (inner: TInner) => TKey,
  resultSelector: (outer: T, inner: TInner) => TResult
): TyneqSequence<TResult>
```

Outer elements with no match are excluded. Inner elements with no match are excluded.

### Example: join orders with products

```ts
const orders = [
  { id: 1, productId: 10, qty: 2 },
  { id: 2, productId: 20, qty: 1 },
  { id: 3, productId: 10, qty: 5 },
];

const products = [
  { id: 10, name: "Widget" },
  { id: 20, name: "Gadget" },
];

Tyneq.from(orders)
  .join(
    products,
    o => o.productId,
    p => p.id,
    (o, p) => ({ orderId: o.id, product: p.name, qty: o.qty })
  )
  .toArray();
// -> [
//      { orderId: 1, product: "Widget", qty: 2 },
//      { orderId: 2, product: "Gadget", qty: 1 },
//      { orderId: 3, product: "Widget", qty: 5 }
//    ]
```

---

## `groupJoin`

Left outer join: every outer element is paired with the (possibly empty) sequence of matching inner elements.

```ts
groupJoin(
  inner: Iterable<TInner>,
  outerKeySelector: (outer: T) => TKey,
  innerKeySelector: (inner: TInner) => TKey,
  resultSelector: (outer: T, group: TyneqSequence<TInner>) => TResult
): TyneqSequence<TResult>
```

Outer elements with no match receive an empty group. No outer element is excluded.

### Example: customers with their orders

```ts
const customers = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

const orders = [
  { customerId: 1, product: "Widget" },
  { customerId: 1, product: "Gadget" },
  // Bob has no orders
];

Tyneq.from(customers)
  .groupJoin(
    orders,
    c => c.id,
    o => o.customerId,
    (c, group) => ({
      customer: c.name,
      orderCount: group.count(),
      products: group.select(o => o.product).toArray(),
    })
  )
  .toArray();
// -> [
//      { customer: "Alice", orderCount: 2, products: ["Widget", "Gadget"] },
//      { customer: "Bob",   orderCount: 0, products: [] }
//    ]
```

---

## Choosing the Right Operator

| Need | Operator |
|---|---|
| Group elements by a shared property | `groupBy` |
| Match rows from two collections (inner join) | `join` |
| Match rows, keep unmatched outer rows (left join) | `groupJoin` |
