# API Reference

This reference covers every symbol exported from `tyneq` and its subpath exports (`tyneq/plugin`, `tyneq/utility`). Use the sidebar to browse by category, or the search bar to jump directly to a symbol.

## Key entry points

| Symbol | Where to start |
|---|---|
| [`Tyneq`](./reference/classes/Tyneq.md) | Static factory methods: `from`, `range`, `empty`, `generate`, `repeat`, `concat`, `enumerate`, `random`, `isNullOrEmpty` |
| [`TyneqSequence`](./reference/interfaces/TyneqSequence.md) | All streaming, buffering, and terminal operators available on every sequence |
| [`TyneqOrderedSequence`](./reference/interfaces/TyneqOrderedSequence.md) | Additional sort keys (`thenBy`, `thenByDescending`, `asc`, `desc`) - returned by `orderBy` |
| [`TyneqCachedSequence`](./reference/interfaces/TyneqCachedSequence.md) | Cache invalidation (`refresh`) - returned by `memoize` |
| [`OperatorRegistry`](./reference/classes/OperatorRegistry.md) | Runtime operator registration, listing, and guard hooks |
| [`TyneqComparer`](./reference/classes/TyneqComparer.md) | Built-in comparers and equality comparers for sorting and equality operators |
| [`QueryPlanPrinter`](./reference/classes/QueryPlanPrinter.md) | Print a pipeline's query plan as a readable string |
| [`QueryPlanOptimizer`](./reference/classes/QueryPlanOptimizer.md) | Fuse consecutive same-kind nodes before execution |
| [`QueryPlanCompiler`](./reference/classes/QueryPlanCompiler.md) | Execute a (possibly modified) query plan against a source |

## Subpath exports

- **`tyneq`** - the main public API (sequences, factories, comparers, errors, query plan tooling)
- **`tyneq/plugin`** - operator authoring API (`createOperator`, `@operator`, `@terminal`, enumerator base classes, `OperatorRegistry`)
	(`OperatorRegistry` is also available from the `tyneq` root export)
- **`tyneq/utility`** - `ValidationBuilder` and `ArgumentUtility` for use in custom operator validate callbacks

## Error hierarchy

All Tyneq errors extend `TyneqError`. Catch `TyneqError` to handle any library error, or catch specific subclasses:

`ArgumentError` - `ArgumentNullError` - `ArgumentOutOfRangeError` - `ArgumentTypeError` - `InvalidOperationError` - `ValidationError` - `SequenceContainsNoElementsError` - `PluginError` - `CompilerError` - `ReflectionError`

## Full reference with internals

Contributors can generate a richer version locally that includes protected members and internal symbols:

```bash
npm run docs:api:full
```

Then open `api-reference/index.html` in your browser.
