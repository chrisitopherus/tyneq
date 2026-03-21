# Guide

Welcome to the Tyneq guide. This is a library-reference style documentation focused on semantics, execution behavior, and practical usage patterns.

## Introduction

Start here if you are new to Tyneq or want to understand what it is and why you might use it.

| Page | What you will learn |
|---|---|
| [What Is Tyneq](/guide/what-is-tyneq) | The problem Tyneq solves, its design model, and how it compares at a high level |
| [Getting Started](/guide/getting-started) | Install, write your first query, and understand the minimal mental model |

## Core Concepts

These pages define the semantic model used everywhere in the library.

| Page | What you will learn |
|---|---|
| [Core Concepts](/guide/concepts) | Sequences, sources, pipelines, operator categories, execution timing, re-enumeration, query plans |
| [Operators Overview](/guide/operators-overview) | The full list of streaming, buffering, and terminal operators with selection guidance |
| [Querying & Deferred Execution](/guide/querying-and-deferred-execution) | The execution contract, query lifecycle, streaming vs. buffering behavior, memoize/refresh |

## Guides

Task-oriented pages for common scenarios.

| Page | What you will learn |
|---|---|
| [Examples](/guide/examples) | Complete, runnable pipeline patterns — filtering, grouping, joins, set operations, scan, async, and more |
| [Error Handling](/guide/error-handling) | All error classes, when they are thrown, and safe usage patterns |
| [Common Pitfalls](/guide/pitfalls) | One-shot sources, mutable closures, buffer operator costs, resource leaks in custom operators, and more |
| [vs. Other Libraries](/guide/differences) | Side-by-side comparisons to arrays, Lodash, IxJS, and other LINQ libraries; interop guidance |

## Extending Tyneq

| Page | What you will learn |
|---|---|
| [Custom Operators](/guide/extensibility) | Register custom streaming, buffering, and terminal operators with the functional and class-based APIs |
| [Building Custom Enumerators](/guide/custom-enumerators) | Class-based operator authoring with `TyneqEnumerator` — five patterns from filter to zip, with anti-patterns |
| [Query Plan Inspection](/guide/query-plan) | Access and print the `IQueryNode` chain; traverse plans with the visitor pattern |

## Contributing

| Page | What you will learn |
|---|---|
| [Contributor Guide](/guide/contributing) | Repository setup, operator addition workflow, code conventions, testing guidelines |
| [Docs Maintenance](/guide/documentation-maintenance) | How to keep API docs and guide pages in sync after changes |

---

## Quick Entry Points

- **New to Tyneq** → [What Is Tyneq](/guide/what-is-tyneq) then [Getting Started](/guide/getting-started)
- **Understand operator behavior and timing** → [Operators Overview](/guide/operators-overview) and [Querying & Deferred Execution](/guide/querying-and-deferred-execution)
- **Looking for practical patterns** → [Examples](/guide/examples)
- **Handling runtime errors** → [Error Handling](/guide/error-handling)
- **Something unexpected is happening** → [Common Pitfalls](/guide/pitfalls)
- **Comparing to alternatives / integrating with other libs** → [vs. Other Libraries](/guide/differences)
- **Adding a custom operator** → [Custom Operators](/guide/extensibility)
- **Building a class-based enumerator** → [Building Custom Enumerators](/guide/custom-enumerators)
- **Inspecting or analyzing pipelines** → [Query Plan Inspection](/guide/query-plan)
- **Contributing to the library** → [Contributor Guide](/guide/contributing)
- **Full API signatures** → [API Reference](/api/reference/)

## Audience

This guide is written for TypeScript developers comfortable with iterables and callbacks. No prior LINQ knowledge is required.
