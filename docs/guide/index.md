---
layout: home

hero:
  name: "Tyneq"
  text: "Lazy query pipelines for TypeScript"
  tagline: "LINQ-expressive, type-safe, and infinitely extensible. Zero dependencies."
  image:
    src: /logo.svg
    alt: Tyneq
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Core Concepts
      link: /guide/concepts
    - theme: alt
      text: API Reference
      link: /api/reference/

features:
  - icon: "⚡"
    title: Lazy by default
    details: Nothing runs until you call a terminal. Compose as many operators as you need - the source is never touched until you ask for results.
  - icon: "♻️"
    title: Re-iterable sequences
    details: Call toArray(), count(), and first() on the same query without re-building it. Each terminal is independent.
  - icon: "🔬"
    title: Explicit execution model
    details: Every operator is streaming (O(1)) or buffering (O(n)). No surprise materializations. You always know what will happen and when.
  - icon: "🗺️"
    title: Live query plans
    details: Every sequence carries a plan you can inspect, print, walk, transform, and compile back into an executable pipeline.
  - icon: "🧩"
    title: Infinitely extensible
    details: Add custom operators via decorators or functional APIs. They appear on every sequence at import time - just like built-ins.
  - icon: "📦"
    title: Zero dependencies
    details: Pure TypeScript. Nothing to audit. Ships as CJS + ESM with full type declarations.
---
