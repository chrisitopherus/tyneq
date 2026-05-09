---
layout: home

title: Tyneq

tagline: Lazy query pipelines for TypeScript

hero:
  name: Tyneq
  text: Lazy query pipelines for TypeScript
  tagline: LINQ-expressive, type-safe, and infinitely extensible. Compose operators over any iterable - nothing runs until you ask for it.
  image:
    src: /logo.svg
    alt: Tyneq
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Browse the Guide
      link: /guide/
    - theme: alt
      text: API Reference
      link: /api/

features:
  - title: Lazy by default
    details: Compose queries as pipelines - no work happens until you enumerate. Chain dozens of operators without touching the source data.
  - title: Re-iterable sequences
    details: Enumerate the same query multiple times safely. Results are consistent across passes; use memoize() to cache when re-execution is expensive.
  - title: 80+ typed operators
    details: Streaming, buffering, and terminal operators with explicit execution semantics. Every operator's timing and memory impact is documented.
  - title: TypeScript-first
    details: Types flow through the entire pipeline. Projections, groupings, and joins preserve strong typing from source to result.
  - title: Fully extensible
    details: Register custom streaming, buffering, or terminal operators using a public API. No library source modifications required.
  - title: Open to contribute
    details: Clear contributor guide, operator addition workflow, and test conventions. See the Contributing page to get started.
---
