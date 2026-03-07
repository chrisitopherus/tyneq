# Core Concepts

This page defines the semantic model used throughout Tyneq documentation.

## Sequence

A sequence is an iterable data source represented through Tyneq enumerable abstractions.

Key property:

- Sequences are designed for re-iteration, so the same query can be evaluated multiple times.

## Source and Pipeline

Every query has:

- A source sequence (input)
- A chain of operators (transformation stages)
- An optional terminal operation (materialization or scalar result)

Operators are composed as a pipeline, not executed as standalone steps.

## Operator Categories

Tyneq operators are grouped by execution behavior.

- Streaming operators: process and yield elements incrementally; typically O(1) additional space
- Buffering operators: require full or partial accumulation before producing results; typically O(n) additional space
- Terminal operators: consume the sequence and return a concrete value or structure

See [Operators Overview](/guide/operators-overview) for category details and selection guidance.

## Deferred and Immediate Execution

- Deferred execution: source is not enumerated until the resulting sequence is enumerated
- Immediate execution: source is enumerated when the method is called

In practice:

- Most non-terminal operators are deferred
- Terminal operators are immediate

See [Querying and Deferred Execution](/guide/querying-and-deferred-execution) for deeper examples.

## Ordering and Stability

- Ordering operators (`orderBy`, `thenBy`, etc.) establish deterministic ordering rules.
- Subsequent operators observe the order produced by upstream stages.

## Re-Enumeration

Enumerating a deferred query multiple times replays the pipeline each time unless the query is memoized.

Use `memoize()` when you need repeatable results from expensive pipelines across multiple terminal calls.

## Practical Rule Set

1. Keep transformation callbacks pure when possible.
2. Place buffering operators intentionally.
3. Treat terminal methods as clear execution boundaries.
4. Memoize only when repeated execution cost is meaningful.
