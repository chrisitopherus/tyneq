# Getting Started

## Install

```bash
npm install tyneq
# yarn add tyneq / pnpm add tyneq
```

Requires TypeScript 5.x with `"strictNullChecks": true`. No `@types` package.

## First Query

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

// ["Grace (97)", "Ada (84)"]
```

Each step is a different kind of operation:

| Step | Kind | What happens |
|---|---|---|
| `Tyneq.from(people)` | Source | Wraps the array |
| `.where(pred)` | Streaming | Filter - deferred, O(1) memory |
| `.orderByDescending(key)` | Buffering | Sort - deferred, O(n) memory |
| `.select(fn)` | Streaming | Project - deferred, O(1) memory |
| `.toArray()` | Terminal | Executes everything, returns `string[]` |

Nothing runs until `.toArray()`. The operators above it describe what to do, not when.

## Sources

`Tyneq.from` accepts any `Iterable<T>`:

```ts
Tyneq.from([1, 2, 3]);
Tyneq.from(new Set([1, 2, 3]));
Tyneq.from(new Map([["a", 1], ["b", 2]]));
Tyneq.range(1, 5);    // [1, 2, 3, 4, 5]
Tyneq.empty<number>();

// Generators - wrap the function, not the object
function* naturals() { let n = 0; while (true) yield n++; }
Tyneq.from({ [Symbol.iterator]: naturals }).take(5).toArray();
// [0, 1, 2, 3, 4]
```

> Passing a generator *object* (not a factory) creates a one-shot source. See [Common Pitfalls](/guide/pitfalls).

## Re-iteration

Tyneq sequences are re-iterable. You can call multiple terminals on the same query:

```ts
const active = Tyneq.from(people).where(p => p.score >= 90);

active.count();                                        // 2
active.select(p => p.name).toArray();                  // ["Linus", "Grace"]
active.orderByDescending(p => p.score).elementAt(0);  // { name: "Grace", ... }
```

Each call re-executes the pipeline from the source. Use `memoize()` if re-execution is expensive.

## Standard Iteration

Sequences implement `Iterable<T>`:

```ts
const seq = Tyneq.range(1, 5).where(n => n % 2 !== 0);

for (const n of seq) console.log(n); // 1 3 5
const arr = [...seq];                 // [1, 3, 5]
```

## Next

- [Concepts](/guide/concepts) - sequences, operator categories, deferred execution
- [Operators Overview](/guide/operators-overview) - full operator list
- [API Reference](/api/reference/)
