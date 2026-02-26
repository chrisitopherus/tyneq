# How Tyneq Differs from Popular Libraries

This section compares Tyneq with commonly used alternatives. The goal is not to replace all tools, but to clarify when Tyneq is the better fit.

## Native array methods

Native arrays are excellent for eager, in-memory transforms. Tyneq differs by:

- Supporting deferred execution by default
- Providing a richer relational/query vocabulary (`join`, `groupJoin`, `groupBy`)
- Offering a unified enumerable model rather than eager array snapshots at each step

## Lodash

Lodash provides broad utilities but is not primarily a LINQ-style typed query system. Tyneq differs by:

- Focusing on query composition over general-purpose helpers
- Preserving strong sequence typing through fluent chains
- Making streaming vs buffering behavior explicit in operator semantics

## IxJS

IxJS also provides iterable-based querying. Tyneq emphasizes:

- A compact, LINQ-like surface designed around TypeScript-first ergonomics
- Explicit enumerable/ordered/cached sequence concepts in the core model
- A practical balance of relational and set operators in a single fluent API

## linq-to-typescript

Both libraries target LINQ-style usage. Tyneq differentiates with:

- Strong focus on re-iterable pipelines
- Clear operator categorization (streaming/buffering/terminal)
- Built-in memoization workflow (`memoize` + `refresh`) for repeated expensive queries

## When to choose Tyneq

Tyneq is a strong choice when you need:

- Consistent query semantics across complex pipelines
- High readability in data-heavy business logic
- Deferred execution plus controlled materialization
- Rich set + relational operations in TypeScript
