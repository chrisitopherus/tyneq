# Getting Started

## Installation

```bash
npm install tyneq
```

## Prerequisites

- TypeScript or JavaScript project with iterable data inputs
- Familiarity with callbacks such as predicates and selectors

## First Query

```ts
import { Tyneq } from "tyneq";

const topCorePeople = Tyneq
  .from([
    { id: 1, name: "Ada", team: "core", score: 84 },
    { id: 2, name: "Linus", team: "infra", score: 92 },
    { id: 3, name: "Grace", team: "core", score: 97 }
  ])
  .where(p => p.team === "core")
  .orderByDescending(p => p.score)
  .select(p => `${p.name} (${p.score})`)
  .toArray();

console.log(topCorePeople);
// ["Grace (97)", "Ada (84)"]
```

## Reading the Example

1. `Tyneq.from(...)` creates a source sequence.
2. `where` and `select` are composed as deferred operators.
3. `orderByDescending` is a buffering operator that sorts on enumeration.
4. `toArray` is terminal and triggers execution.

## Minimal Mental Model

- Compose first, execute later.
- Treat terminal operators as execution boundaries.
- Prefer pure predicates/selectors for repeatable enumeration behavior.

## Common Next Moves

- Learn the execution contract: [Querying and Deferred Execution](/guide/querying-and-deferred-execution)
- Learn operator categories: [Operators Overview](/guide/operators-overview)
- See real patterns: [Examples](/guide/examples)
- Browse full signatures: [API Reference](/api/reference/)
