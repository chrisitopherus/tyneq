# Differences from Other Libraries

This page explains where Tyneq fits relative to common alternatives.

## Native Array Methods

Array methods are ideal for simple eager transformations over already-materialized data.

Tyneq differs by emphasizing:

- Deferred execution for composed pipelines
- Relational operators such as `join`, `groupJoin`, and `groupBy`
- Re-iterable query abstractions over mixed iterable sources

Choose arrays when eager snapshots are sufficient. Choose Tyneq when query semantics and composition depth matter.

## Lodash

Lodash is a broad utility toolkit spanning collection helpers, object utilities, string operations, and more.

Tyneq differs by focusing on:

- LINQ-style query composition
- Strong TypeScript propagation across chained operators
- Explicit streaming, buffering, and terminal execution behavior

Choose Lodash for general utility breadth. Choose Tyneq for query-centric, typed iterable pipelines.

## IxJS

IxJS provides iterable and async-iterable query operators inspired by ReactiveX concepts.

Tyneq differs by focusing on:

- A compact LINQ-like surface for synchronous enumerable workflows
- First-class ordered and cached enumerable concepts
- Clear distinction between operator execution categories

Choose IxJS when async iterable orchestration is central. Choose Tyneq for synchronous LINQ-style domain pipelines.

## LINQ-Style TypeScript Libraries

Compared with other LINQ-inspired packages, Tyneq emphasizes:

- Re-iterable pipeline semantics
- Operator categorization aligned with execution behavior
- Built-in memoization workflow (`memoize()` and `refresh()`)

## Decision Guide

Choose Tyneq when you need:

- Complex query composition over iterable sources
- Relational operations in fluent pipelines
- Predictable execution and materialization boundaries
- Type-safe transformations in TypeScript-heavy codebases

## Related Pages

- [Core Concepts](/guide/concepts)
- [Operators Overview](/guide/operators-overview)
- [Examples](/guide/examples)
