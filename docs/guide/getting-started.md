# Getting Started

## Installation

```bash
npm install tyneq
```

## First query

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

## Mental model

- Build query with fluent operators.
- Keep pipeline lazy until you need a result.
- Use terminal operators (`toArray`, `count`, `first`, etc.) to execute.

## Next steps

- Learn execution details in [Queries and Deferred Execution](/guide/querying-and-deferred-execution)
- Explore full capability in [Examples](/guide/examples)
- Browse generated signatures in [API reference](/api/)
