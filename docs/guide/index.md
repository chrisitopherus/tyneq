# Guide

```ts
import { Tyneq } from "tyneq";

const result = Tyneq
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

Tyneq is a LINQ-style query library for TypeScript. Pipelines are lazy and re-iterable. Nothing runs until a terminal operator is called.

## Pages

| | |
|---|---|
| [Getting Started](/guide/getting-started) | Install, first query, mental model |
| [Concepts](/guide/concepts) | Sequences, operator categories, deferred execution, re-iteration |
| [Operators](/guide/operators) | Full operator reference by category |
| [Ordering](/guide/ordering) | Multi-key sort pipeline, comparers |
| [Grouping](/guide/grouping) | groupBy, join, groupJoin |
| [Set Operations](/guide/set-operations) | distinct, union, intersect, except |
| [Extensibility](/guide/extensibility) | Register custom operators and terminals |
| [Query Plan](/guide/query-plan) | Access, print, walk, transform, and compile the operator chain |
| [Best Practices](/guide/best-practices) | Patterns worth following |
| [Pitfalls](/guide/pitfalls) | Common mistakes and how to avoid them |
| [Terminology](/guide/terminology) | All types and terms defined |
| [Contributing](/guide/contributing) | Repository setup, adding operators, conventions |
| [API Reference](/api/reference/) | Full generated API docs |
