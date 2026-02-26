# What is Tyneq

Tyneq is a LINQ-inspired query library for TypeScript and JavaScript. It provides a fluent API for transforming, combining, and materializing data from iterable sources.

## What it aims to solve

Tyneq addresses recurring issues in data transformation code:

- Long chains of ad-hoc array operations that are hard to read and maintain
- Inconsistent behavior between one-time iterators and re-iterable collections
- Weak type propagation in complex query pipelines
- Missing relational operations such as joins/group joins in many utility libraries

## High-level implementation model

At an abstract level, Tyneq composes queries from three parts:

1. **Enumerable source**: a re-iterable data sequence
2. **Operator pipeline**: transformations layered without immediate execution
3. **Terminal execution**: a final operation that triggers evaluation

The result is a model where behavior is explicit and predictable as pipelines grow.
