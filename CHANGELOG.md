# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [1.0.2] - 2026-05-10

### Fixed

- Disabled emitted sourcemaps in published `dist` output (`sourcemap: false` in
  `tsup.config.ts`) to prevent `.cjs.map` `sources` entries from containing
  absolute local Windows paths (for example `C:\\Users\\...`). This avoids
  consumer tooling (for example `tsx`) resolving into local development paths
  during source-map loading.

## [1.0.1] - 2026-05-10

### Fixed

- Replaced tsdown (rolldown/oxc) with tsup (esbuild) as the build bundler.
  oxc-transform passes Stage 3 decorator syntax through unchanged regardless of
  target, so the compiled dist contained raw `@decorator class` syntax that
  runtimes and bundlers without native Stage 3 decorator support could not handle.
  esbuild 0.21+ correctly transforms Stage 3 decorators to helper-function calls
  (`__decorateClass`, `__decorateElement`) when targeting environments below
  native support. The published dist now works in all Node versions, bundlers,
  and in projects that use `experimentalDecorators: true`.
- Lowered the Node.js engine constraint from `>=20.19.0` back to `>=18`; the
  higher constraint was imposed solely by tsdown's own requirement.
- Lowered tsup build target to `es2017` for maximum runtime compatibility.

## [1.0.0] - 2026-05-05

First stable release.

### Public API surface

**Factories (`Tyneq.*`):**
`from` `range` `empty` `enumerate` `random` `repeat` `generate` `concat` `isNullOrEmpty`

**Streaming operators (O(1) memory):**
`select` `where` `take` `takeWhile` `takeUntil` `skip` `skipWhile` `skipLast` `skipUntil` `slice`
`selectMany` `flatten` `append` `prepend` `concat` `zip` `scan` `pairwise` `window` `chunk`
`split` `repeat` `defaultIfEmpty` `populate` `ofType` `tap` `tapIf` `throttle` `pipe`

**Buffering operators (O(n) memory):**
`orderBy` `orderByDescending` `thenBy` `thenByDescending` `groupBy` `distinct` `distinctBy`
`reverse` `shuffle` `union` `unionBy` `intersect` `intersectBy` `except` `exceptBy`
`join` `groupJoin` `backsert` `memoize` `permutations`

**Terminal operators (executes the pipeline):**
`toArray` `toSet` `toMap` `toRecord` `toAsync` `first` `firstOrDefault` `last` `lastOrDefault`
`single` `singleOrDefault` `elementAt` `elementAtOrDefault` `count` `countBy` `sum` `average`
`min` `max` `minBy` `maxBy` `minMax` `aggregate` `any` `all` `contains` `indexOf`
`sequenceEqual` `startsWith` `endsWith` `isNullOrEmpty` `consume`

**Comparers (`TyneqComparer.*`):**
`defaultComparer` `defaultEqualityComparer` `caseInsensitiveComparer`
`caseInsensitiveEqualityComparer` `createLocaleComparer` `reverse`

**Query plan tooling:**
`QueryPlanPrinter` `QueryPlanWalker` `QueryPlanTransformer` `QueryPlanOptimizer`
`QueryPlanCompiler` `QueryNode` `tyneqQueryNode` `isSourceNode`

**Plugin API (`tyneq/plugin`):**
`createOperator` `createGeneratorOperator` `createTerminalOperator`
`createOrderedOperator` `createOrderedTerminalOperator`
`createCachedOperator` `createCachedTerminalOperator`
`operator` `terminal` `orderedOperator` `cachedOperator`
`TyneqEnumerator` `TyneqOrderedEnumerator` `TyneqCachedEnumerator` `TyneqBaseEnumerator`
`TyneqTerminalOperator` `OperatorRegistry` `OperatorMetadata` `ValidationBuilder`

**Errors:**
`TyneqError` `ArgumentError` `ArgumentNullError` `ArgumentOutOfRangeError`
`ArgumentTypeError` `InvalidOperationError` `ValidationError` `PluginError`
`CompilerError` `ReflectionError` `SequenceContainsNoElementsError`

### SemVer guarantee

All symbols listed above are part of the stable public API. Internal classes
(`TyneqEnumerableBase`, `TyneqEnumerableCore`, and anything tagged `@internal`)
are explicitly not part of the contract and may change between minor versions.
