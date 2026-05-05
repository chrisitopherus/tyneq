# Getting Started

## Install

```bash
npm install tyneq
# yarn add tyneq  /  pnpm add tyneq
```

Requires **TypeScript 5.x** with `"strictNullChecks": true`. No separate `@types` package.

---

## Your first query

```ts
import { Tyneq } from "tyneq";

const people = [
  { name: "Ada",   team: "core",  score: 84 },
  { name: "Linus", team: "infra", score: 92 },
  { name: "Grace", team: "core",  score: 97 },
];

const topCore = Tyneq
  .from(people)
  .where(p => p.team === "core")
  .orderByDescending(p => p.score)
  .select(p => `${p.name} (${p.score})`)
  .toArray();

// -> ["Grace (97)", "Ada (84)"]
```

Each step does something specific:

| Step | Kind | What it means |
|---|---|---|
| `Tyneq.from(people)` | Source | Wraps the array in a Tyneq sequence |
| `.where(pred)` | Streaming | Describes a filter - nothing runs yet |
| `.orderByDescending(key)` | Buffering | Describes a sort - nothing runs yet |
| `.select(fn)` | Streaming | Describes a projection - nothing runs yet |
| `.toArray()` | Terminal | **Now** everything runs, top to bottom |

The key insight: **operators describe work, terminals execute it.**

---

## Creating sequences

`Tyneq.from` accepts any `Iterable<T>`:

```ts
Tyneq.from([1, 2, 3]);
Tyneq.from(new Set(["a", "b", "c"]));
Tyneq.from(new Map([["a", 1], ["b", 2]])); // TyneqSequence<[string, number]>
Tyneq.from("hello");                        // TyneqSequence<string> (characters)
```

Convenience factories:

```ts
Tyneq.range(1, 5);         // -> [1, 2, 3, 4, 5]
Tyneq.range(0, 3);         // -> [0, 1, 2]
Tyneq.empty<number>();     // zero-element sequence
Tyneq.repeat(0, 3);        // -> [0, 0, 0]
Tyneq.generate(1, x => x * 2, 4); // -> [2, 4, 8, 16]
Tyneq.concat([1, 2], [3, 4]);      // -> [1, 2, 3, 4]
[...Tyneq.enumerate(["a", "b", "c"])];
// -> [[0, "a"], [1, "b"], [2, "c"]]
// (wrap with Tyneq.from() to chain operators)
```

### Generator functions

If your source is a generator, pass the **function** not the **object**:

```ts
function* naturals() { let n = 0; while (true) yield n++; }

// Bad: naturals() returns a one-shot generator object
const bad = Tyneq.from(naturals()).take(5);
bad.toArray(); // [0, 1, 2, 3, 4]
bad.toArray(); // [] - already exhausted!

// Good: wrap the function so each iteration gets a fresh generator
const good = Tyneq.from({ [Symbol.iterator]: naturals }).take(5);
good.toArray(); // [0, 1, 2, 3, 4]
good.toArray(); // [0, 1, 2, 3, 4]
```

See [Best Practices & Pitfalls](./best-practices.md) for more on this.

---

## Re-iteration: use the same query multiple times

This is one of the most important things about Tyneq. Every sequence is **re-iterable** - calling a terminal is non-destructive.

```ts
const active = Tyneq.from(people).where(p => p.score >= 85);

// All three use the same query object
active.count();                              // -> 2
active.select(p => p.name).toArray();        // -> ["Linus", "Grace"]
active.orderByDescending(p => p.score).first().name; // -> "Grace"
```

Each call re-executes the pipeline from the source. There is no internal cursor to exhaust. If re-executing the pipeline is expensive (e.g. the source involves I/O or random data), use `memoize()`:

```ts
const expensive = Tyneq.from(fetchUsers())
  .where(u => u.active)
  .shuffle()
  .memoize();

expensive.toArray(); // executes once, caches
expensive.toArray(); // returns cache
```

---

## Deferred execution in practice

Nothing touches the source until a terminal is called. That means:

```ts
// No computation, no source access - just builds the plan
const query = Tyneq.range(1, 1_000_000)
  .where(n => n % 2 === 0)
  .select(n => n * n)
  .take(5);

// Only now does iteration begin - and stops after 5 elements
query.toArray(); // -> [4, 16, 36, 64, 100]
```

This also means operators respect each other. `take(5)` after a streaming pipeline stops pulling from `where` as soon as it has 5 results. It never processes the remaining 999,995 elements.

---

## Standard iteration

Sequences implement `Iterable<T>`, so you can use them anywhere JavaScript accepts an iterable:

```ts
const evens = Tyneq.range(1, 10).where(n => n % 2 === 0);

for (const n of evens) console.log(n);  // 2 4 6 8 10
const arr = [...evens];                  // [2, 4, 6, 8, 10]

// Works with destructuring too
const [first, second] = evens;           // first=2, second=4
```

---

## Next steps

You have the basics. Here is where to go next:

- [Core Concepts](./concepts.md) - understand streaming vs. buffering, the execution model, and memoization in depth
- [Operators](./operators.md) - the full operator catalogue with examples
- [Custom Operators](./extensibility.md) - add your own operators to every sequence
- [Query Plan & Compiler](./query-plan.md) - inspect and compile pipelines as metadata
