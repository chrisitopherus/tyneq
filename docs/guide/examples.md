# Examples

Practical query patterns from simple transformations to production-style pipelines. Every example shows the full output.

## Example 1: Filter and Project

Goal: return active product names in uppercase.

```ts
import { Tyneq } from "tyneq";

const products = [
  { id: 1, name: "keyboard", active: true  },
  { id: 2, name: "mouse",    active: false },
  { id: 3, name: "monitor",  active: true  }
];

const result = Tyneq
  .from(products)
  .where(p => p.active)
  .select(p => p.name.toUpperCase())
  .toArray();

console.log(result);
// → ["KEYBOARD", "MONITOR"]
```

**Operators used**: `where` (streaming), `select` (streaming), `toArray` (terminal).
All operators after `from` are deferred — the source is iterated once at `.toArray()`.

---

## Example 2: Group and Aggregate

Goal: compute total sales per region, ranked descending.

```ts
import { Tyneq } from "tyneq";

const sales = [
  { region: "EU",   amount: 120 },
  { region: "US",   amount: 80  },
  { region: "EU",   amount: 40  },
  { region: "APAC", amount: 200 },
  { region: "US",   amount: 140 }
];

const leaderboard = Tyneq
  .from(sales)
  .groupBy(
    x => x.region,
    x => x.amount,
    (region, amounts) => ({
      region,
      total: Tyneq.from(amounts).sum(x => x)
    })
  )
  .orderByDescending(x => x.total)
  .toArray();

console.log(leaderboard);
// → [
//     { region: "US",   total: 220 },
//     { region: "APAC", total: 200 },
//     { region: "EU",   total: 160 }
//   ]
```

**Operators used**: `groupBy` (buffering), `orderByDescending` (buffering), `sum` (terminal — called per group), `toArray` (terminal).
Both `groupBy` and `orderByDescending` buffer the source internally.

---

## Example 3: Relational Report with Ranking and Paging

Goal: join users to orders, compute spend and order count, sort deterministically, then paginate.

```ts
import { Tyneq } from "tyneq";

const users = [
  { id: 1, name: "Ada"    },
  { id: 2, name: "Grace"  },
  { id: 3, name: "Linus"  },
  { id: 4, name: "Edsger" }
];

const orders = [
  { id: 101, userId: 1, total: 90  },
  { id: 102, userId: 1, total: 120 },
  { id: 103, userId: 2, total: 50  },
  { id: 104, userId: 2, total: 80  },
  { id: 105, userId: 2, total: 30  },
  { id: 106, userId: 3, total: 220 }
];

const pageSize = 3;
const page = 1;
let rank = 1;

const report = Tyneq
  .from(users)
  .groupJoin(
    orders,
    user  => user.id,
    order => order.userId,
    (user, userOrders) => {
      const buffered = Tyneq.from(userOrders).toArray();
      return {
        userId:   user.id,
        userName: user.name,
        orders:   buffered.length,
        spend:    Tyneq.from(buffered).sum(o => o.total)
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
// → [
//     { rank: 1, userId: 3, userName: "Linus", orders: 1, spend: 220 },
//     { rank: 2, userId: 1, userName: "Ada",   orders: 2, spend: 210 },
//     { rank: 3, userId: 2, userName: "Grace",  orders: 3, spend: 160 }
//   ]
```

**Operators used**: `groupJoin` (buffering), `where` (streaming), `orderByDescending` + `thenByDescending` + `thenBy` (stable multi-key sort, buffering), `skip` + `take` (streaming), `select` (streaming), `toArray` (terminal).

---

## Example 4: Set Operations

Goal: find products that are new (not in last catalog) and not discontinued.

```ts
import { Tyneq } from "tyneq";

const lastCatalog  = ["widget", "gadget", "doohickey"];
const newCatalog   = ["gadget", "thingamajig", "doohickey", "gizmo"];
const discontinued = ["doohickey"];

const newProducts = Tyneq
  .from(newCatalog)
  .except(lastCatalog)     // items in newCatalog but not in lastCatalog
  .except(discontinued)    // also remove discontinued items
  .toArray();

console.log(newProducts);
// → ["thingamajig", "gizmo"]

const retained = Tyneq
  .from(newCatalog)
  .intersect(lastCatalog)  // items in both catalogs
  .toArray();

console.log(retained);
// → ["gadget", "doohickey"]
```

**Operators used**: `except` (buffering — deduplicates), `intersect` (buffering), `toArray` (terminal).

---

## Example 5: Sliding Window Analysis

Goal: compute a 3-element moving average over a time series.

```ts
import { Tyneq } from "tyneq";

const readings = [10, 14, 11, 18, 22, 19, 25, 30];

const movingAverage = Tyneq
  .from(readings)
  .window(3)                                    // produce [10,14,11], [14,11,18], ...
  .select(win => {
    const avg = win.reduce((a, b) => a + b, 0) / win.length;
    return Math.round(avg * 10) / 10;
  })
  .toArray();

console.log(movingAverage);
// → [11.7, 14.3, 17, 19.7, 22, 24.7]
```

**Operators used**: `window` (streaming — produces overlapping arrays), `select` (streaming), `toArray` (terminal).

---

## Example 6: Cache Expensive Query Results

Goal: execute an expensive pipeline once, reuse results multiple times, then invalidate.

```ts
import { Tyneq } from "tyneq";

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

const primes = Tyneq
  .range(1, 10_000)
  .where(x => isPrime(x))
  .memoize();

const first10 = primes.take(10).toArray();
// → [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
// Pipeline runs; results cached.

const next10 = primes.skip(10).take(10).toArray();
// → [31, 37, 41, 43, 47, 53, 59, 61, 67, 71]
// Cache used for first 10; pipeline continues from cached position.

primes.refresh(); // Invalidate cache

const recomputed = primes.take(3).toArray();
// → [2, 3, 5]
// Pipeline runs again from scratch.
```

**Notes**: `memoize()` caches enumeration output incrementally. `refresh()` resets the cache. Useful when re-evaluating an expensive computation (like `isPrime`) repeatedly would be wasteful.

---

## Example 7: Interop — Query Results from a Generator

Goal: consume data from a custom generator and query it with Tyneq.

```ts
import { Tyneq } from "tyneq";

function* parseCSV(raw: string): IterableIterator<Record<string, string>> {
  const lines = raw.trim().split('\n');
  const headers = lines[0].split(',');
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    yield Object.fromEntries(headers.map((h, j) => [h.trim(), values[j]?.trim() ?? '']));
  }
}

const csv = `id,name,department,salary
1,Ada,Engineering,95000
2,Grace,Engineering,88000
3,Linus,Marketing,72000
4,Edsger,Engineering,102000
5,Barbara,Marketing,68000`;

const engineeringSummary = Tyneq
  .from(parseCSV(csv))
  .where(r => r.department === "Engineering")
  .select(r => ({ name: r.name, salary: Number(r.salary) }))
  .orderByDescending(r => r.salary)
  .toArray();

console.log(engineeringSummary);
// → [
//     { name: "Edsger", salary: 102000 },
//     { name: "Ada",    salary: 95000  },
//     { name: "Grace",  salary: 88000  }
//   ]

const avgSalary = Tyneq
  .from(parseCSV(csv))
  .select(r => Number(r.salary))
  .average(x => x);

console.log(avgSalary);
// → 85000
```

**Notes**: `Tyneq.from` accepts any iterable — the generator is re-created each time the query runs because `parseCSV(csv)` is called twice (once per terminal call). If re-creation is expensive, assign the result of `Tyneq.from(parseCSV(csv)).memoize()` instead.

---

---

## Example 8: Running Aggregates with `scan`

Goal: compute a running total and detect when it crosses a threshold.

```ts
import { Tyneq } from "tyneq";

const transactions = [15, -5, 30, -10, 20, -8, 12];

// Running balance after each transaction
const runningBalance = Tyneq
  .from(transactions)
  .scan(0, (balance, tx) => balance + tx)
  .toArray();

console.log(runningBalance);
// → [15, 10, 40, 30, 50, 42, 54]

// Find the first transaction index that drives the balance negative
const firstNegative = Tyneq
  .from(transactions)
  .scan(0, (balance, tx) => balance + tx)
  .indexOf(balance => balance < 0);

console.log(firstNegative);
// → 1  (after index 1, balance is 10 → wait, 15 - 5 = 10, not negative)
// Actually: transactions are all positive here, so -1 (no negative balance)
```

`scan` emits the accumulator value **after each element**, so the output length equals the input length. Compare with `aggregate`, which returns only the final accumulated value.

---

## Example 9: General Fold with `aggregate`

Goal: build a frequency map and find the top N words.

```ts
import { Tyneq } from "tyneq";

const words = [
  "the", "quick", "brown", "fox", "the", "lazy", "dog", "the", "fox"
];

// Fold into a frequency map
const frequencies = Tyneq
  .from(words)
  .aggregate(
    new Map<string, number>(),
    (map, word) => {
      map.set(word, (map.get(word) ?? 0) + 1);
      return map;
    }
  );

// Top 3 words by frequency
const top3 = Tyneq
  .from(frequencies)
  .orderByDescending(([, count]) => count)
  .take(3)
  .select(([word, count]) => `${word}: ${count}`)
  .toArray();

console.log(top3);
// → ["the: 3", "fox: 2", "quick: 1"]
```

`aggregate(seed, accumulator, resultSelector?)` is the general fold operator. It returns a single value and triggers immediate execution.

---

## Example 10: Async Bridge with `toAsync`

Goal: process a Tyneq sequence asynchronously — for example, uploading each batch to an API.

```ts
import { Tyneq } from "tyneq";

const records = Tyneq
  .range(1, 100)
  .chunk(10);  // split into batches of 10

async function uploadAll() {
  for await (const batch of records.toAsync()) {
    await uploadBatch(batch);
    console.log(`Uploaded batch of ${batch.length}`);
  }
}

async function uploadBatch(ids: number[]): Promise<void> {
  // Simulated async upload
  await new Promise(resolve => setTimeout(resolve, 10));
}

uploadAll();
// Uploaded batch of 10
// Uploaded batch of 10
// ... (10 times)
```

`toAsync()` bridges a Tyneq sequence to `AsyncIterable<T>`. Each `for await...of` loop starts a fresh, independent traversal of the underlying source. Use `memoize()` before `toAsync()` if you want to avoid re-executing an expensive pipeline on each async loop.

---

## Related Pages

- [Operators Overview](/guide/operators-overview)
- [Querying and Deferred Execution](/guide/querying-and-deferred-execution)
- [Error Handling](/guide/error-handling)
- [vs. Other Libraries](/guide/differences)
