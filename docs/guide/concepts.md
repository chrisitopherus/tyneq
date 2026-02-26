# Core Concepts

## 1. Enumerable as a re-iterable abstraction

Tyneq uses an enumerable abstraction that can be iterated multiple times. Query definitions can be reused without manual reset logic.

## 2. Operator categories

Tyneq operators follow clear categories:

- **Streaming operators**: process values incrementally (for example `where`, `select`, `take`)
- **Buffering operators**: require collecting elements (for example `orderBy`, `groupBy`, `distinct`)
- **Terminal operators**: execute and produce concrete values (for example `toArray`, `count`, `first`)

## 3. Deferred execution

Most operations do not execute when called. They build a query description that executes only when consumed.

## 4. Composability

Each operator returns a sequence, which enables expressive chains with minimal intermediate allocations.

## 5. Predictable semantics

Tyneq aims to make execution behavior understandable from the pipeline shape: streaming segments stay incremental, buffering segments are explicit, and terminal operators finalize the query.
