# Operator Registry & Compiler Architecture Refinement

## Problem Statement

Three issues with the current architecture:

1. **Core methods not in registry** — `orderBy`, `orderByDescending`, `memoize`, `pipe` are direct
   methods on `TyneqEnumerableCore`. `thenBy`/`thenByDescending` are on `TyneqOrderedEnumerable`.
   `refresh` is on `TyneqCachedEnumerable`. None go through `@builtinOperator`, so none appear
   in `OperatorRegistry`.

2. **Source type mismatch** — Enumerators for ordered/cached operators need the full sequence
   object, not just an `Enumerator<T>`. `OrderByEnumerator` calls `getSorter()`,
   `MemoizeEnumerator` calls `tryGetAtFromCache()`. The current `TyneqEnumerator` base only
   provides `sourceEnumerator: Enumerator<TInput>`.

3. **No way for external developers to register on subtypes** — `@operator` always patches onto
   `TyneqEnumerableBase.prototype`. There is no mechanism to register an operator that should
   only appear on `TyneqOrderedEnumerable` or `TyneqCachedEnumerable`.

---

## Operator Tiers

| Tier | Examples | Defined on | Currently in registry? |
|---|---|---|---|
| Base operators | `where`, `select`, `distinct` | `TyneqEnumerableBase` (method wires enumerator) | Yes, via `@builtinOperator` on enumerator class |
| Core methods | `orderBy`, `memoize`, `pipe` | `TyneqEnumerableCore` (direct method) | No |
| Ordered methods | `thenBy`, `thenByDescending` | `TyneqOrderedEnumerable` (direct method) | No |
| Cached methods | `refresh` | `TyneqCachedEnumerable` (direct method) | No |

### Fragility in the current base-operator approach

`@builtinOperator({ name: "where" })` lives on `WhereEnumerator` in one file.
The `where()` method lives on `TyneqEnumerableBase` in another file. There is no compile-time
link between them — renaming the method silently invalidates the registration.

### Unified fix: `@coreOperator` for all internal operators

Move registration to the method itself across the board. `@builtinOperator` is removed.
All internal operators — base, core, ordered, cached — use `@coreOperator` on the method
and `@registerCoreOperators` on the class. The enumerator classes become pure implementation
with no registration concern.

The external decorator split remains, because external developers write an enumerator class
and have no method on a base class to decorate:

| Pattern | Who | Registration lives on |
|---|---|---|
| `@coreOperator` + `@registerCoreOperators` | All internal operators | The method — can't drift from the name |
| `@operator` / `@orderedOperator` / `@cachedOperator` | External developers | Enumerator class — the only entry point they have |

---

## Change 1 — `OperatorMetadata`: add `targetClass`

Add `targetClass` — a reference to the actual class the operator lives on (or is patched onto).
The compiler uses `instanceof entry.metadata.targetClass` directly. No string enum needed.

```typescript
export class OperatorMetadata {
    constructor(
        public readonly name: string,
        public readonly kind: "streaming" | "buffer" | "terminal",
        public readonly source: "internal" | "external",
        public readonly targetClass: abstract new (...args: any[]) => TyneqEnumerableBase<unknown>,
    ) {}
}
```

- Internal base operators  → `targetClass = TyneqEnumerableBase`
- Internal core methods    → `targetClass = TyneqEnumerableCore`
- Internal ordered methods → `targetClass = TyneqOrderedEnumerable`
- Internal cached methods  → `targetClass = TyneqCachedEnumerable`
- External operators       → whatever class the developer targets (default `TyneqEnumerableBase`)

---

## Change 2 — `OperatorRegistry`: patch onto `targetClass.prototype`

Currently hardcoded to `TyneqEnumerableBase.prototype`. Use `entry.metadata.targetClass.prototype`:

```typescript
static register(entry: OperatorEntry): void {
    // ... duplicate checks ...
    this.operators.set(entry.metadata.name, entry);
    (entry.metadata.targetClass.prototype as any)[entry.metadata.name] = entry.impl;
}

static unregister(name: string): void {
    const entry = this.operators.get(name);
    if (entry?.metadata.source === "external") {
        delete (entry.metadata.targetClass.prototype as any)[name];
    }
    this.operators.delete(name);
}

static registerBuiltin(
    name: string,
    kind: OperatorMetadata["kind"],
    targetClass: abstract new (...args: any[]) => TyneqEnumerableBase<unknown>
): void {
    // no prototype patching — method already exists as a direct definition
    this.operators.set(name, {
        metadata: new OperatorMetadata(name, kind, "internal", targetClass),
        impl: (targetClass.prototype as any)[name],
    });
}
```

---

## Change 3 — Register ALL internal operators via two-decorator pattern

### Why two decorators

TC39 stage 3 method decorators (`ClassMethodDecoratorContext`) do not give you a reference to
the class the method belongs to — `context` only has the method name. For non-static methods,
`context.addInitializer` runs per instance, not at class definition time.

The solution is a standard TC39 two-decorator pattern:
- **`@coreOperator`** (method decorator) — stores registration options as a property on the
  method function itself (plain property, no library needed)
- **`@registerCoreOperators`** (class decorator) — receives the class, walks `prototype`,
  finds marked methods, and calls `OperatorRegistry.registerBuiltin`

Naming follows the "what it is" convention rather than "what it does":
- **`@builtin`** — "this method is a built-in operator"
- **`@sequence`** — "this class is a sequence whose methods define operators"

The scanning and registration are the implementation detail of those two decorators, not their identity.

```typescript
// src/plugin/builtin.ts

const BUILTIN_META = Symbol("builtinMeta");

export interface BuiltinOptions {
    readonly name: string;
    readonly kind: "streaming" | "buffer" | "terminal";
}

// Method decorator — declares the method as a built-in operator.
// Stores options on the function object so @sequence can find them.
export function builtin(options: BuiltinOptions) {
    return function (value: Function, _context: ClassMethodDecoratorContext): Function {
        (value as any)[BUILTIN_META] = options;
        return value;
    };
}

// Class decorator — declares the class as a sequence.
// Scans the prototype for @builtin-marked methods and registers each one
// in OperatorRegistry with targetClass = this class.
export function sequence(
    target: abstract new (...args: any[]) => TyneqEnumerableBase<unknown>,
    _context: ClassDecoratorContext
): void {
    for (const key of Object.getOwnPropertyNames(target.prototype)) {
        const method = (target.prototype as any)[key];
        if (typeof method === "function" && BUILTIN_META in method) {
            const options: BuiltinOptions = method[BUILTIN_META];
            OperatorRegistry.registerBuiltin(options.name, options.kind, target);
        }
    }
}
```

### Usage — all internal operators, across all classes

```typescript
// TyneqEnumerableBase.ts — base operators (was @builtinOperator on enumerator class)
@sequence
export abstract class TyneqEnumerableBase<TSource> extends TyneqEnumerableCore<TSource> {

    @builtin({ name: "where", kind: "streaming" })
    public where(predicate: (item: TSource) => boolean): TyneqSequence<TSource> {
        return this.createEnumerable({ getEnumerator: () => new WhereEnumerator(this.getEnumerator(), predicate) });
    }

    @builtin({ name: "select", kind: "streaming" })
    public select<TResult>(selector: (item: TSource) => TResult): TyneqSequence<TResult> {
        return this.createEnumerable({ getEnumerator: () => new SelectEnumerator(this.getEnumerator(), selector) });
    }

    // ... all other base operators follow the same pattern
}

// TyneqEnumerableCore.ts — core methods
@sequence
export abstract class TyneqEnumerableCore<TSource> {

    @builtin({ name: "orderBy", kind: "streaming" })
    public orderBy<TKey>(...): TyneqOrderedSequence<TSource> { ... }

    @builtin({ name: "memoize", kind: "buffer" })
    public memoize(): TyneqCachedSequence<TSource> { ... }

    // ...
}

// TyneqOrderedEnumerable.ts — ordered-only methods
@sequence
export class TyneqOrderedEnumerable<TSource, TKey> extends TyneqEnumerableBase<TSource> {

    @builtin({ name: "thenBy", kind: "streaming" })
    public thenBy<UKey>(...): TyneqOrderedSequence<TSource> { ... }

    @builtin({ name: "thenByDescending", kind: "streaming" })
    public thenByDescending<UKey>(...): TyneqOrderedSequence<TSource> { ... }
}

// TyneqCachedEnumerable.ts — cached-only methods
@sequence
export class TyneqCachedEnumerable<TSource> extends TyneqEnumerableBase<TSource> {

    @builtin({ name: "refresh", kind: "terminal" })
    public refresh(): TyneqCachedSequence<TSource> { ... }
}
```

The enumerator classes (`WhereEnumerator`, `SelectEnumerator`, etc.) lose `@builtinOperator`
entirely. They become pure implementation — no registration concern.

---

## Change 4 — New enumerator base classes for ordered/cached operators

`TyneqEnumerator<TInput, TOutput>` passes `Enumerator<TInput>` as source. Ordered and cached
enumerators need the full sequence object.

```typescript
// src/core/enumerators/TyneqOrderedEnumerator.ts
export abstract class TyneqOrderedEnumerator<TSource>
    extends TyneqBaseEnumerator<TSource> {
    constructor(protected readonly orderedSource: OrderedEnumerable<TSource>) {
        super();
    }
    protected disposeSource(): void {
        // lifecycle is owned by the sequence, not the enumerator
    }
}

// src/core/enumerators/TyneqCachedEnumerator.ts
export abstract class TyneqCachedEnumerator<TSource>
    extends TyneqBaseEnumerator<TSource> {
    constructor(protected readonly cachedSource: CachedEnumerable<TSource>) {
        super();
    }
    protected disposeSource(): void {
        // lifecycle is owned by the sequence, not the enumerator
    }
}
```

- `OrderByEnumerator` extends `TyneqOrderedEnumerator` (already receives `OrderedEnumerable`)
- `MemoizeEnumerator` extends `TyneqCachedEnumerator` (already receives `CachedEnumerable`)

---

## Change 5 — New external-facing decorators: `@orderedOperator` / `@cachedOperator`

These are the external equivalents of `@operator`, targeting specific subtypes. Each decorator
knows the `targetClass` to patch onto and what to pass to the enumerator constructor (`this`
instead of `this.getEnumerator()`).

```typescript
// External developer usage
@orderedOperator("myThenBy", (keySelector) => {
    if (typeof keySelector !== "function") throw new Error("keySelector must be a function");
})
class MyThenByEnumerator<T> extends TyneqOrderedEnumerator<T> {
    constructor(source: OrderedEnumerable<T>, private keySelector: (item: T) => unknown) {
        super(source);
    }
    protected handleNext(): IteratorResult<T> { ... }
}

@cachedOperator("myRefresh")
class MyRefreshEnumerator<T> extends TyneqCachedEnumerator<T> {
    constructor(source: CachedEnumerable<T>) { super(source); }
    protected handleNext(): IteratorResult<T> { ... }
}
```

### `impl` construction differs per decorator

```typescript
// @operator — passes this.getEnumerator() (an Enumerator<T>)
impl = function (this: TyneqEnumerableBase<unknown>, ...args) {
    return this.createEnumerable({
        getEnumerator: () => new EnumeratorClass(this.getEnumerator(), ...args)
    }, queryNode);
};

// @orderedOperator — passes `this` (the TyneqOrderedEnumerable itself)
impl = function (this: TyneqOrderedEnumerable<unknown>, ...args) {
    return this.createEnumerable({
        getEnumerator: () => new EnumeratorClass(this, ...args)
    }, queryNode);
};

// @cachedOperator — passes `this` (the TyneqCachedEnumerable itself)
impl = function (this: TyneqCachedEnumerable<unknown>, ...args) {
    return this.createEnumerable({
        getEnumerator: () => new EnumeratorClass(this, ...args)
    }, queryNode);
};
```

### Kind inference

`inferOperatorKind` currently only checks for `TyneqEnumerator.prototype`. Extend it to also
detect `TyneqOrderedEnumerator` and `TyneqCachedEnumerator`. Since ordered/cached operators are
almost always buffer-style, these decorators can also hardcode `kind: "buffer"` as the default
rather than inferring.

---

## Change 6 — Compiler: validate using `instanceof targetClass`

Replace the hardcoded `instanceof TyneqEnumerableBase` check with a metadata-driven one:

```typescript
applyOperator(source: unknown, node: QueryPlanNode): unknown {
    const entry = OperatorRegistry.get(node.operator);
    if (!entry) {
        throw new Error(`Unknown operator: '${node.operator}'`);
    }

    if (!(source instanceof entry.metadata.targetClass)) {
        throw new Error(
            `Operator '${node.operator}' requires a ${entry.metadata.targetClass.name} ` +
            `but received ${(source as any)?.constructor?.name ?? typeof source}`
        );
    }

    return (source as any)[node.operator](...(node.args ?? []));
}
```

Works for all tiers without special casing. If `thenBy` has `targetClass = TyneqOrderedEnumerable`,
the compiler naturally rejects it when the source is a plain `TyneqEnumerable`.

---

## What to export publicly

`TyneqOrderedEnumerable` and `TyneqCachedEnumerable` must be exported from the public API (or
at minimum the `plugin` barrel) so external developers can use `@orderedOperator` /
`@cachedOperator`. The abstract enumerator bases (`TyneqOrderedEnumerator`,
`TyneqCachedEnumerator`) must also be exported for developers to extend.

---

## File changes summary

| File | Change |
|---|---|
| `src/core/registry/OperatorMetadata.ts` | Add `targetClass` parameter |
| `src/core/registry/TyneqOperatorRegistry.ts` | `register()` patches `targetClass.prototype`; `registerBuiltin()` takes `targetClass` |
| `src/plugin/builtinOperator.ts` | **Deleted** — replaced by `@builtin` |
| `src/plugin/builtinTerminal.ts` | **Deleted** — replaced by `@builtin` |
| `src/plugin/builtin.ts` | New file — `@builtin` method decorator + `@sequence` class decorator |
| `src/plugin/orderedOperator.ts` | New file — `@orderedOperator` class decorator for external developers |
| `src/plugin/cachedOperator.ts` | New file — `@cachedOperator` class decorator for external developers |
| `src/plugin/inferKind.ts` | Detect `TyneqOrderedEnumerator` and `TyneqCachedEnumerator` |
| `src/plugin/operator.ts` | Pass `TyneqEnumerableBase` as `targetClass` |
| `src/core/enumerators/TyneqOrderedEnumerator.ts` | New file |
| `src/core/enumerators/TyneqCachedEnumerator.ts` | New file |
| `src/core/TyneqEnumerableBase.ts` | Add `@sequence` + `@builtin` on every operator method; remove enumerator-class registration |
| `src/core/TyneqEnumerableCore.ts` | Add `@sequence` + `@builtin` on each method |
| `src/core/ordering/TyneqOrderedEnumerable.ts` | Add `@sequence` + `@builtin` on `thenBy`/`thenByDescending` |
| `src/core/TyneqCachedEnumerable.ts` | Add `@sequence` + `@builtin` on `refresh` |
| `src/enumerators/**/*.ts` | Remove `@builtinOperator` / `@builtinTerminal` from all enumerator classes |
| `src/enumerators/buffer/orderBy.ts` | Extend `TyneqOrderedEnumerator` |
| `src/enumerators/buffer/memoize.ts` | Extend `TyneqCachedEnumerator` |
| `src/queryplan/compiler/QueryPlanCompiler.ts` | Use `instanceof entry.metadata.targetClass` |
