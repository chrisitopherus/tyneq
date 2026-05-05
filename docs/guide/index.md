# Guide

Welcome to the Tyneq guide. Start with [Getting Started](./getting-started.md) if you are new, or jump to the section you need below.

## Start Here

- [Getting Started](./getting-started.md) - installation, first pipeline, re-iteration, and convenience factories
- [Core Concepts](./concepts.md) - streaming vs. buffering, the execution model, and the enumerator lifecycle
- [Best Practices & Pitfalls](./best-practices.md) - patterns to follow and common mistakes to avoid

## Using Tyneq

- [Operators](./operators.md) - all streaming, buffering, and terminal operators with examples
- [Ordering](./ordering.md) - `orderBy`, `thenBy`, custom comparers, and `TyneqComparer`
- [Grouping & Joins](./grouping.md) - `groupBy`, `join`, `groupJoin`, and `countBy`
- [Set Operations](./set-operations.md) - `distinct`, `union`, `intersect`, `except`, and their key-based variants

## Extending Tyneq

- [Custom Operators](./extensibility.md) - register your own streaming, buffering, or terminal operators
- [Plugin Internals](./plugin-internals.md) - sequence factory pattern, bridge methods, and custom sequence types

## Diving Deeper

- [Query Plan & Compiler](./query-plan.md) - inspect, walk, transform, and compile pipelines as data
- [Terminology](./terminology.md) - reference definitions for every type and concept

## Project

- [Contributing](./contributing.md) - how to add a built-in operator, run tests, and submit a PR
