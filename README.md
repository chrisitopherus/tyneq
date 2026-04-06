<div align="center">
  <br />
  <a href="https://github.com/chrisitopherus/tyneq">
    <img src="./docs/public/logo.svg" alt="Tyneq" width="180" height="180" />
  </a>
  <h1>tyneq</h1>
  <p><strong>Lazy query pipelines for TypeScript. LINQ-expressive, type-safe, and infinitely extensible.</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/tyneq">
      <img src="https://img.shields.io/npm/v/tyneq?style=flat-square&color=0ea5e9" alt="npm version" />
    </a>
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/dependencies-zero-22c55e?style=flat-square" alt="zero dependencies" />
    <a href="./LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-a78bfa?style=flat-square" alt="MIT license" />
    </a>
  </p>

  <p>
    <a href="https://chrisitopherus.github.io/tyneq/guide/">Guide</a>
    &nbsp;&middot;&nbsp;
    <a href="https://chrisitopherus.github.io/tyneq/api/">API Reference</a>
    &nbsp;&middot;&nbsp;
    <a href="https://github.com/chrisitopherus/tyneq/issues">Issues</a>
  </p>
  <br />
</div>

---

```ts
import { Tyneq } from "tyneq";

const topScorers = Tyneq
  .from([
    { name: "Ada",   team: "core",  score: 84 },
    { name: "Linus", team: "infra", score: 92 },
    { name: "Grace", team: "core",  score: 97 },
  ])
  .where(p => p.team === "core")
  .orderByDescending(p => p.score)
  .select(p => `${p.name} (${p.score})`)
  .toArray();
// -> ["Grace (97)", "Ada (84)"]
```

Nothing runs until `.toArray()`. Every operator is deferred, typed, and re-iterable.

---

## What is Tyneq?

Tyneq brings LINQ-style query pipelines to TypeScript. You compose operators on a sequence, nothing executes until you call a terminal, and the same query can be evaluated as many times as you want without rebuilding anything.

It is not a thin wrapper around `Array.prototype`. It is a pipeline engine with a deliberate execution model, a full query plan, and an extensibility system that lets you ship custom operators as reusable packages.

---

## Why it stands out

### Re-iterable by default

Most iterator libraries give you a one-shot cursor. Tyneq gives you a sequence - something you can evaluate multiple times with independent state each time.

```ts
const active = Tyneq.from(users)
  .where(u => u.active)
  .orderByDescending(u => u.score);

active.count();                         // 3
active.first().name;                    // "Grace"
active.select(u => u.email).toArray();  // ["g@...", "l@...", "a@..."]
```

No re-wrapping. No second `.filter()`. The same query, used three times.

### You always know what is happening

Every operator is explicitly **streaming** (O(1) memory, one element at a time) or **buffering** (reads the full source once). There is no hidden materialization.

```ts
Tyneq.from(largeDataset)
  .where(x => x.active)     // streaming - O(1), processes as needed
  .orderBy(x => x.score)    // buffering - reads all matching, sorts once
  .take(10)                 // streaming - stops after 10
  .toArray();               // terminal - executes everything
```

### Query plans you can actually use

Every sequence carries a live description of its pipeline. Inspect it, print it, walk it with a visitor, rewrite it with a transformer, or compile it back into an executable sequence.

```ts
import { QueryPlanPrinter, QueryPlanCompiler, QueryPlanOptimizer, tyneqQueryNode } from "tyneq";

const seq = Tyneq.from(data)
  .where(x => x > 0)
  .where(x => x < 100)   // redundant - will be fused by the optimizer
  .select(x => x * 2);

// Print the raw plan
console.log(QueryPlanPrinter.print(seq[tyneqQueryNode]!));
// from([...])
//   -> where(<fn>)
//   -> where(<fn>)
//   -> select(<fn>)

// Compile with optimizer: the two where nodes are fused into one
const compiler = new QueryPlanCompiler([new QueryPlanOptimizer()]);
compiler.compile(seq[tyneqQueryNode]!).toArray();
```

The compiler is what makes query plans genuinely useful: a plan is metadata you can store, transform, and execute. Reusable pipelines from pure data.

### Extensible to the core

Add custom operators that look and behave exactly like built-ins. They get registered at import time, appear on every sequence, and show up in query plans.

```ts
import { createGeneratorOperator } from "tyneq";

createGeneratorOperator({
  name: "repeatEach",
  category: "streaming",
  *generator(source: Iterable<unknown>, times: number) {
    for (const item of source) {
      for (let i = 0; i < times; i++) yield item;
    }
  },
  validate(times) {
    if (times < 1) throw new RangeError("times must be >= 1");
  },
});

declare module "tyneq" {
  interface TyneqSequence<T> {
    repeatEach(times: number): TyneqSequence<T>;
  }
}

Tyneq.from([1, 2, 3]).repeatEach(2).toArray();
// -> [1, 1, 2, 2, 3, 3]
```

Ship it as a package. Consumers import once and every sequence gains the operator.

---

## At a glance

| Capability | Tyneq | Typical iterator lib |
|---|---|---|
| Deferred execution | yes | yes |
| Re-iterable sequences | yes | often no |
| Explicit streaming vs. buffering | yes | usually implicit |
| Multi-key ordering (`thenBy`) | yes | varies |
| Joins and group joins | yes | rare |
| Built-in memoization | yes | rare |
| Custom operator plugin API | yes | rare |
| Query plan + compiler | yes | very rare |
| Zero runtime dependencies | yes | varies |

---

## Installation

```bash
npm install tyneq
```

Requires TypeScript 5.x with `"strictNullChecks": true`. No separate `@types` package needed.

---

## Quick tour

```ts
import { Tyneq } from "tyneq";

// Wrap any iterable
Tyneq.from([1, 2, 3]);
Tyneq.from(new Set(["a", "b"]));
Tyneq.range(1, 5);    // [1, 2, 3, 4, 5]
Tyneq.empty<number>();

// Compose operators - nothing runs yet
const query = Tyneq.range(1, 1_000_000)
  .where(n => n % 2 === 0)
  .select(n => n * n)
  .take(5);

// Execute with a terminal
query.toArray();  // -> [4, 16, 36, 64, 100]
query.count();    // -> 5 - same query, independent traversal
query.first();    // -> 4

// Standard iteration protocols work too
for (const n of query) console.log(n);
const arr = [...query];
```

Multi-key sorting, grouping, joins - all built in:

```ts
Tyneq.from(employees)
  .where(e => e.department === "engineering")
  .orderBy(e => e.level)
  .thenByDescending(e => e.yearsAtCompany)
  .groupBy(
    e => e.team,
    e => e.name,
    (team, members) => ({ team, members: members.toArray() })
  )
  .toArray();
```

---

## Operators

Tyneq ships 60+ operators across three categories.

### Streaming (O(1) memory)

`select`, `where`, `take`, `takeWhile`, `skip`, `skipWhile`, `skipLast`, `selectMany`, `append`, `prepend`, `concat`, `zip`, `scan`, `pairwise`, `chunk`, `split`, `defaultIfEmpty`, `populate`, `cast`, `ofType`, `tap`, `tapIf`, `throttle`, `pipe`

### Buffering (reads full source once)

`orderBy`, `orderByDescending`, `thenBy`, `thenByDescending`, `groupBy`, `distinct`, `distinctBy`, `reverse`, `shuffle`, `union`, `unionBy`, `intersect`, `intersectBy`, `except`, `exceptBy`, `join`, `groupJoin`, `backsert`, `memoize`

### Terminal (executes the pipeline)

`toArray`, `toSet`, `toMap`, `toRecord`, `toAsync`, `first`, `firstOrDefault`, `last`, `lastOrDefault`, `single`, `singleOrDefault`, `elementAt`, `elementAtOrDefault`, `count`, `countBy`, `sum`, `average`, `min`, `max`, `minBy`, `maxBy`, `minMax`, `aggregate`, `any`, `all`, `contains`, `indexOf`, `sequenceEqual`, `startsWith`, `isNullOrEmpty`, `consume`

---

## Extensibility

Two registration styles. Pick the one that fits:

**Functional** - for simple operators, no class needed:

```ts
import { createGeneratorOperator, createTerminalOperator } from "tyneq";

createGeneratorOperator({
  name: "intersperse",
  category: "streaming",
  *generator(source: Iterable<unknown>, separator: unknown) {
    let first = true;
    for (const item of source) {
      if (!first) yield separator;
      yield item;
      first = false;
    }
  },
});

createTerminalOperator({
  name: "product",
  execute(source, initial: number = 1): number {
    let result = initial;
    for (const item of source) result *= item as number;
    return result;
  },
});
```

**Decorator** - for class-based operators with complex state:

```ts
import { operator, TyneqEnumerator } from "tyneq";

@operator("everyOther", "streaming")
class EveryOtherEnumerator<T> extends TyneqEnumerator<T, T> {
  private emit = false;

  public constructor(source: Enumerator<T>) { super(source); }

  protected override handleNext(): IteratorResult<T> {
    while (true) {
      const next = this.sourceEnumerator.next();
      if (next.done) return next;
      this.emit = !this.emit;
      if (this.emit) return next;
    }
  }
}
```

The [Extensibility guide](https://chrisitopherus.github.io/tyneq/guide/extensibility) covers both styles, validation contracts, module augmentation, and packaging operators as shareable libraries.

---

## Query Plan

Every sequence carries a query plan tree. Access it, print it, walk it, transform it, or compile it back to a live sequence.

```ts
import { QueryPlanPrinter, tyneqQueryNode } from "tyneq";

const seq = Tyneq.from([1, 2, 3])
  .where(x => x > 1)
  .select(x => x * 2)
  .take(5);

console.log(QueryPlanPrinter.print(seq[tyneqQueryNode]!));
// from([1, 2, 3])
//   -> where(<fn>)
//   -> select(<fn>)
//   -> take(5)
```

The `QueryPlanCompiler` is the heart of the system. It takes any plan node and produces a fully executable sequence, running registered transformers (like `QueryPlanOptimizer`) along the way. Pass a `source` option to run the same pipeline against different data without rebuilding it:

```ts
const plan = Tyneq.from(data).where(x => x > 0).select(x => x * 2)[tyneqQueryNode]!;
const compiler = new QueryPlanCompiler();

compiler.compile(plan, { source: datasetA }).toArray();
compiler.compile(plan, { source: datasetB }).toArray();
```

This makes it possible to store pipelines as metadata, optimize them, and replay them on any source.

See the [Query Plan guide](https://chrisitopherus.github.io/tyneq/guide/query-plan) for the full picture.

---

## Documentation

**[chrisitopherus.github.io/tyneq](https://chrisitopherus.github.io/tyneq/)**

| | |
|---|---|
| [Getting Started](https://chrisitopherus.github.io/tyneq/guide/getting-started) | Install, first query, sources, re-iteration |
| [Core Concepts](https://chrisitopherus.github.io/tyneq/guide/concepts) | Execution model, streaming vs. buffering, memoization |
| [Operators](https://chrisitopherus.github.io/tyneq/guide/operators) | All 60+ operators with examples |
| [Extensibility](https://chrisitopherus.github.io/tyneq/guide/extensibility) | Custom operators: functional API and decorators |
| [Plugin Internals](https://chrisitopherus.github.io/tyneq/guide/plugin-internals) | Registry, custom enumerators, utility helpers |
| [Query Plan](https://chrisitopherus.github.io/tyneq/guide/query-plan) | Plan access, printing, walking, transforming, compiling |
| [Best Practices](https://chrisitopherus.github.io/tyneq/guide/best-practices) | Patterns, pitfalls, and performance guidance |
| [API Reference](https://chrisitopherus.github.io/tyneq/api/) | Full generated API docs |

---

## Contributing

```bash
git clone https://github.com/chrisitopherus/tyneq
npm install
npm run build    # compile CJS + ESM + types
npm test         # run test suite
npm run lint     # check style
npm run docs:dev # local docs site
```

Bug reports and feature requests: [github.com/chrisitopherus/tyneq/issues](https://github.com/chrisitopherus/tyneq/issues)

---

## License

[MIT](./LICENSE) (c) [chrisitopherus](https://github.com/chrisitopherus)
