# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

A deep-dive technical audit (see `tyneq-audit.md`) identified 27 findings across correctness,
documentation accuracy, and tooling. This release addresses all 22 non-breaking findings; 5
findings that require breaking API changes are tracked separately (see "Deferred" below) pending
a maintainer decision on scope and timing.

### Fixed

- **Enumerator lifecycle**: a throwing user callback (selector, predicate, comparer, key
  selector) left the upstream source undisposed and the enumerator silently resumable - calling
  `next()` again continued iteration as if nothing happened, skipping the failing element.
  Enumerators are now poisoned and dispose their resources on any throw.
- **`memoize()`**: an upstream source error during the first iteration was silently swallowed
  and the truncated prefix was certified as the complete, successful result on every later
  iteration. Errors are now cached and rethrown consistently until `refresh()` is called.
- **`memoize()` + `refresh()`**: calling `refresh()` while another enumerator was mid-iteration
  over the same cache caused that enumerator to silently resume against the new, unrelated
  generation of cached data. This is now detected and throws `InvalidOperationError` instead.
- **Re-iterability**: a one-shot iterable (a generator object, or the result of
  `Map.prototype.entries()` and similar) passed to `Tyneq.from()` or as an argument to `zip`,
  `concat`, `except`, `exceptBy`, `intersect`, `intersectBy`, `union`, `unionBy`, `join`,
  `groupJoin`, or `backsert` silently returned `[]` on the second iteration instead of erroring.
  These now throw `InvalidOperationError` on re-iteration of a one-shot source.
- **Plugin decorators**: `@operator`, `@terminal`, `@orderedOperator`, and `@cachedOperator`
  rejected valid classes whose `handleNext()`/`process()` method was inherited from an
  intermediate base class, with a misleading error message. Inherited methods are now accepted.
- **`QueryPlanCompiler`**: `options.source` silently substituted the first argument of any
  source node, producing nonsense results (or a confusing low-level `RangeError`) for non-`from`
  sources like `range` and `random`. This now throws a clear `CompilerError` for non-`from` nodes.
- **Validation consistency**: `thenBy`/`thenByDescending` now validate their `keySelector`
  argument eagerly at the call site (previously relied on the constructor, deferring the error);
  `repeat(count)` now uses the same safe-integer check as its sibling operators; `Tyneq.range`
  now validates `start`, so `range(NaN, 3)` throws instead of silently returning an empty
  sequence. These are behavior-tightening changes: previously-silent invalid input now throws.
- **Streaming/buffering classification**: `distinct`, `distinctBy`, `union`, and `unionBy` were
  labeled as buffering operators but actually stream the source incrementally - verified against
  an infinite source. Relabeled and moved to `src/enumerators/streaming/` to match; corrected the
  README and guide docs that repeated the incorrect classification.
- **`Tyneq.enumerate()`**: registered as a proper `@source` operator instead of delegating
  through an anonymous wrapper via `from()`. It now appears in `OperatorRegistry.listSources()`
  and produces a real `enumerate(...)` query plan node (previously printed as `from({...})`).
- **`package.json` `sideEffects`**: widened from the two root entry files to cover all `dist/`
  output, including the shared chunk files created by code-splitting build output, which
  previously left operator registrations technically prunable by aggressive tree-shaking.
- **Registry guard policy**: `register()`, `registerSource()`, and `registerBuiltin()` previously
  ran registration guards under three different, undocumented policies. Guards now run
  consistently for external registrations only, matching the documented intent.

### Changed

- `OrderedEnumerable.source`/`.parent` are now `readonly` on the public interface, matching the
  implementation (no code in this codebase mutated them outside a constructor).
- `CachedEnumerable.tryGetAtFromCache()` (an `@internal` interface) gained a required
  `generation` parameter to support the `refresh()`-mid-iteration fix above.
- `Enumerator<T>.next()`/`.return()` now return `IteratorResult<T, undefined>` instead of the
  looser `IteratorResult<T>` (which left the `done: true` branch's `value` typed `any` via
  TypeScript's native default). No behavioral change; closes a real type-safety gap that
  surfaced one latent bug in `sequenceEqual`.

### Performance

- Removed a needless full-array copy on every `orderBy()`/`orderByDescending()` sort (and every
  re-iteration of a sorted sequence) - the copy was discarded immediately and provided no
  protection the code actually relied on.

### Documentation

- Corrected copy-paste documentation drift across several buffer and terminal operator remarks
  that inaccurately described their actual streaming/buffering/short-circuiting behavior.
- Fixed four README/guide code examples that called `first()` with no arguments, which does not
  compile against the current required-predicate signature.
- Corrected `QueryPlanOptimizer`'s documentation, which incorrectly warned that operator fusion
  changes side-effect behavior for impure predicates/projections - proven false by an
  instrumented equivalence test comparing fused and unfused call traces.
- Added a "Failure modes" section to the plugin extensibility guide covering operator name
  collisions, augmenting a module without a matching registration, and augmenting the wrong
  sequence interface.
- Clarified that the functional and class-based plugin APIs are both fully supported with no
  deprecation plan, with guidance on when to reach for each.
- Noted that re-iterating a pipeline re-executes buffering stages (e.g. `orderBy`) in full, and
  that `.memoize()` is the escape hatch for expensive repeated stages.

### Internal

- Adopted `typescript-eslint`'s `recommendedTypeChecked` rule set for `src/` (not yet extended
  to `tests/`, which needs a separate review since test fixtures intentionally use loose typing
  to exercise validation paths). Fixed all resulting findings, including two real type-safety
  gaps this surfaced.
- Added a post-build smoke test that imports the actual built `dist` output (both ESM and CJS)
  and exercises a pipeline plus a plugin registration against each, closing a gap where nothing
  previously verified the built package's decorator-transform output matched source behavior.
- Enforced whitespace hygiene (`no-multiple-empty-lines`, `no-trailing-spaces`) across the
  codebase.

### Deferred

The following findings require breaking API changes and are tracked in `tasks/future.md`
(FUTURE-4) pending a maintainer decision on scope and timing:

- Whether `first`/`last`/`single`/`any` should gain optional-predicate overloads, and whether
  `isNullOrEmpty()`'s first-element-null semantics should be renamed or redocumented.
- Whether the root `tyneq` package export should be pruned to an explicit list, excluding
  internal types and the full plugin/reflection API currently re-exported via `export *`.
- A type-level tightening of the class-based decorator API's `TArgs` constraint against the
  decorated class's actual constructor signature.
- Whether `toMap`/`toRecord` selectors should switch from `{ key, value }` objects to
  `[key, value]` tuples.

---

## [1.0.3] - 2026-05-16

### Fixed

- Fixed ordered-sequence `orderBy` and `orderByDescending` calls to reset the
  parent chain correctly by passing `undefined` for the nested ordered sequence
  constructor. This keeps a fresh primary sort from inheriting `thenBy` state
  from the previous ordered wrapper.

---

## [1.0.2] - 2026-05-10

### Fixed

- Disabled emitted sourcemaps in published `dist` output (`sourcemap: false` in
  `tsup.config.ts`) to prevent `.cjs.map` `sources` entries from containing
  absolute local Windows paths (for example `C:\\Users\\...`). This avoids
  consumer tooling (for example `tsx`) resolving into local development paths
  during source-map loading.
- Disabled declaration map emission for DTS output (`declarationMap: false` in
  tsup dts compiler options) to prevent `.d.ts.map` path leakage in published
  artifacts.
- Fixed consumer import-time failure (`TypeError: OperatorMetadata is not a
  constructor`) by deferring built-in registry metadata construction with the
  shared `Lazy` wrapper in `OperatorRegistry.registerBuiltin()`.
- Exported `OperatorRegistry` from `tyneq/plugin` in addition to the root
  `tyneq` export for consistent plugin-author import ergonomics.
- Clarified plugin documentation examples to show `OperatorRegistry` imports from
  `tyneq/plugin` while keeping root-export availability documented.

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
