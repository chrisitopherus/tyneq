# Examples

This page presents practical Tyneq query patterns from simple transformations to production-style pipelines.

## Example 1: Filter and Project

Goal: return active product names in uppercase.

```ts
import { Tyneq } from "tyneq";

const products = [
  { id: 1, name: "keyboard", active: true },
  { id: 2, name: "mouse", active: false },
  { id: 3, name: "monitor", active: true }
];

const result = Tyneq
  .from(products)
  .where(p => p.active)
  .select(p => p.name.toUpperCase())
  .toArray();

console.log(result);
// ["KEYBOARD", "MONITOR"]
```

Behavior notes:

- `where` and `select` stream.
- `toArray` materializes the result.

## Example 2: Group and Aggregate

Goal: compute total sales per region and rank descending by total.

```ts
import { Tyneq } from "tyneq";

const sales = [
  { region: "EU", amount: 120 },
  { region: "US", amount: 80 },
  { region: "EU", amount: 40 },
  { region: "APAC", amount: 200 },
  { region: "US", amount: 140 }
];

const leaderboard = Tyneq
  .from(sales)
  .groupBy(x => x.region, x => x.amount, (region, amounts) => ({ key: region, values: amounts }))
  .select(group => ({
    region: group.key,
    total: Tyneq.from(group.values).sum(x => x)
  }))
  .orderByDescending(x => x.total)
  .toArray();

console.log(leaderboard);
// [
//   { region: "US", total: 220 },
//   { region: "APAC", total: 200 },
//   { region: "EU", total: 160 }
// ]
```

Behavior notes:

- `groupBy` and `orderByDescending` are buffering operators.
- Aggregation (`sum`) is terminal per group projection.

## Example 3: Relational Report with Ranking and Paging

Goal: join users to orders, compute spend and count, sort deterministically, then paginate.

```ts
import { Tyneq } from "tyneq";

const users = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Grace" },
  { id: 3, name: "Linus" },
  { id: 4, name: "Edsger" }
];

const orders = [
  { id: 101, userId: 1, total: 90 },
  { id: 102, userId: 1, total: 120 },
  { id: 103, userId: 2, total: 50 },
  { id: 104, userId: 2, total: 80 },
  { id: 105, userId: 2, total: 30 },
  { id: 106, userId: 3, total: 220 }
];

const pageSize = 3;
const page = 1;

let rank = 1;
const report = Tyneq
  .from(users)
  .groupJoin(
    orders,
    user => user.id,
    order => order.userId,
    (user, userOrders) => {
      const buffered = Tyneq.from(userOrders).toArray();
      return {
        userId: user.id,
        userName: user.name,
        orders: buffered.length,
        spend: Tyneq.from(buffered).sum(o => o.total)
      };
    }
  )
  .where(x => x.orders > 0)
  .orderByDescending(x => x.spend)
  .thenByDescending(x => x.orders)
  .thenBy(x => x.userName)
  .skip((page - 1) * pageSize)
  .take(pageSize)
  .select(x => ({ rank: rank++, ...x }))
  .toArray();

console.log(report);
// [
//   { rank: 1, userId: 3, userName: "Linus", orders: 1, spend: 220 },
//   { rank: 2, userId: 1, userName: "Ada", orders: 2, spend: 210 },
//   { rank: 3, userId: 2, userName: "Grace", orders: 3, spend: 160 }
// ]
```

Behavior notes:

- `groupJoin` and ordering stages buffer.
- `skip` and `take` apply after ordering.

## Example 4: Cache Expensive Query Results

Goal: execute an expensive pipeline once, reuse results multiple times, then invalidate.

```ts
import { Tyneq } from "tyneq";

const expensive = Tyneq
  .range(1, 1000)
  .where(x => x % 7 === 0)
  .select(x => x * x)
  .memoize();

const firstUse = expensive.take(5).toArray();
const secondUse = expensive.skip(5).take(5).toArray();

expensive.refresh();
const recomputed = expensive.take(3).toArray();

console.log(firstUse, secondUse, recomputed);
```

Behavior notes:

- `memoize()` caches enumeration output.
- `refresh()` invalidates cached state and forces recomputation.

## Related Pages

- [Operators Overview](/guide/operators-overview)
- [Querying and Deferred Execution](/guide/querying-and-deferred-execution)
- [Error Handling](/guide/error-handling)
