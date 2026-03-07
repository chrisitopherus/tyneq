# What Is Tyneq

Tyneq is a typed query library for TypeScript and JavaScript that brings LINQ-style pipeline composition to iterable data.

## Why Tyneq Exists

Tyneq is designed for projects where plain array chaining or ad-hoc iterator utilities become hard to reason about.

Common pain points it addresses:

- Pipelines that are readable at small size but opaque at production size
- Unclear execution timing when mixing eager arrays and lazy iterables
- Type information that degrades as chains become more complex
- Limited relational and set-style operations in general utility libraries

## Core Design

Tyneq models querying as three explicit stages:

1. Source sequence construction (`Tyneq.from`, `Tyneq.range`, `Tyneq.empty`)
2. Operator composition (`where`, `select`, `join`, `orderBy`, ...)
3. Terminal execution (`toArray`, `count`, `first`, `sum`, ...)

This design keeps execution semantics and performance characteristics visible from the pipeline shape.

## What Tyneq Is Not

- It is not a replacement for all utility libraries.
- It is not an ORM or SQL translation layer.
- It is not an asynchronous stream library.

Tyneq focuses specifically on synchronous iterable querying with strong typing and predictable behavior.

## Typical Use Cases

- Read-model shaping in services or controllers
- Relational joins over in-memory collections
- Ordered analytics pipelines with deterministic semantics
- Reusable query definitions that are executed in multiple contexts

## Next Steps

- Continue with [Getting Started](/guide/getting-started)
- Learn semantic rules in [Core Concepts](/guide/concepts)
- Review operator categories in [Operators Overview](/guide/operators-overview)
