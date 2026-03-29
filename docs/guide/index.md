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
// ["Grace (97)", "Ada (84)"]
```

Tyneq is a LINQ-style query library for TypeScript. Pipelines are lazy and re-iterable. Nothing runs until a terminal operator is called.

## Pages

| | |
|---|---|
| [Getting Started](/guide/getting-started) | Install, first query, mental model |
| [Concepts](/guide/concepts) | Sequences, operator categories, deferred execution, re-enumeration |
| [Terminology](/guide/terminology) | All types and terms defined: `TyneqSequence`, `Enumerable`, `Enumerator`, and more |
| [Operators Overview](/guide/operators-overview) | All operators grouped by category |
| [Common Pitfalls](/guide/pitfalls) | One-shot sources, mutable closures, buffer costs, resource leaks |
| [Custom Operators](/guide/extensibility) | Register streaming, buffering, and terminal operators |
| [Query Plan Inspection](/guide/query-plan) | Access, print, and traverse the operator chain at runtime |
| [Contributing](/guide/contributing) | Repository setup, adding operators, conventions, testing |
| [API Reference](/api/reference/) | Full generated API docs |
