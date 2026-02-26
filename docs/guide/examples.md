# Examples: From Simple to Complex

## Simple: filter + project

### Scenario
Get active product names in uppercase.

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

## Intermediate: grouped analytics

### Scenario
Compute total sales per region and return a sorted leaderboard.

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
//   { region: 'US', total: 220 },
//   { region: 'APAC', total: 200 },
//   { region: 'EU', total: 160 }
// ]
```

## Advanced: relational pipeline with ranking and paging

### Scenario
Build a report that:

1. joins users with orders
2. computes per-user spend + order counts
3. ranks by spend (desc), then order count (desc), then name (asc)
4. returns page 1 with page size 3

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
  .select(x => ({
    rank: rank++,
    ...x
  }))
  .toArray();

console.log(report);
// [
//   { rank: 1, userId: 3, userName: "Linus", orders: 1, spend: 220 },
//   { rank: 2, userId: 1, userName: "Ada", orders: 2, spend: 210 },
//   { rank: 3, userId: 2, userName: "Grace", orders: 3, spend: 160 }
// ]
```

## Advanced: stabilize expensive pipelines with memoization

### Scenario
Reuse the same expensive query result multiple times in one request.

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

Use this pattern when repeated enumeration cost matters and deterministic snapshot-like behavior is desired.
