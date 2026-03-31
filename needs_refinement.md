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

### Unified fix: `@builtin` + `@sequence` for all internal operators

Move registration to the method itself across the board. `@builtinOperator` and `@builtinTerminal`
are removed. All internal operators — base, core, ordered, cached — use `@builtin` on the method
and `@sequence` on the class. The enumerator classes become pure implementation with no
registration concern.

The external decorator split remains, because external developers write an enumerator class
and have no method on a base class to decorate:

| Pattern | Who | Registration lives on |
|---|---|---|
| `@builtin` + `@sequence` | All internal operators | The method — can't drift from the name |
| `@operator` / `@orderedOperator` / `@cachedOperator` | External developers | Enumerator class — the only entry point they have |

---

## Removal: `tyneqOperatorMetadata` on enumerator classes

Currently `@builtinOperator` and `@builtinTerminal` call `setOperatorMetadata(target, { name, category })`
to attach an `IOperatorMetadata` Symbol-property onto the enumerator class constructor.
This is read back in `TyneqEnumerableBase.createOperatorNode()` to build the `QueryNode`.

After the refactor **this mechanism is fully removed**:

- `@builtin` decorates the method directly, so `name` and `kind` are available right there
  when building the `QueryNode` inside the method body.
- `createOperatorNode()` is deleted — each `@builtin` method builds its own node inline.
- The following are deleted entirely:
  - `tyneqOperatorMetadata` (the Symbol)
  - `setOperatorMetadata` / `getOperatorMetadata`
  - `IOperatorMetadata` interface
  - `IOperatorMetadataCarrier` interface

`OperatorMetadata` (the registry class) is **not** affected — it only lives in the registry map.

---

## Change 1 — `OperatorMetadata`: add `targetClass`

Add `targetClass` — a reference to the actual class the operator lives on (or is patched onto).
The compiler uses `instanceof entry.metadata.targetClass` directly. No string enum needed.

```typescript
// src/core/registry/OperatorMetadata.ts

export class OperatorMetadata {
    constructor(
        public readonly name: string,
        public readonly kind: "streaming" | "buffer" | "terminal",
        public readonly source: "internal" | "external",
        public readonly targetClass: abstract new (...args: any[]) => TyneqEnumerableBase<unknown>,
        public readonly extensions: Readonly<Record<string, unknown>> = {}
    ) {}

    public static streaming(
        name: string,
        targetClass: abstract new (...args: any[]) => TyneqEnumerableBase<unknown>,
        source?: OperatorSource,
        extensions?: Record<string, unknown>
    ): OperatorMetadata {
        return new OperatorMetadata(name, "streaming", source ?? "external", targetClass, extensions);
    }

    public static buffer(
        name: string,
        targetClass: abstract new (...args: any[]) => TyneqEnumerableBase<unknown>,
        source?: OperatorSource,
        extensions?: Record<string, unknown>
    ): OperatorMetadata {
        return new OperatorMetadata(name, "buffer", source ?? "external", targetClass, extensions);
    }

    public static terminal(
        name: string,
        targetClass: abstract new (...args: any[]) => TyneqEnumerableBase<unknown>,
        source?: OperatorSource,
        extensions?: Record<string, unknown>
    ): OperatorMetadata {
        return new OperatorMetadata(name, "terminal", source ?? "external", targetClass, extensions);
    }
}
```

- Internal base operators  → `targetClass = TyneqEnumerableBase`
- Internal core methods    → `targetClass = TyneqEnumerableCore`
- Internal ordered methods → `targetClass = TyneqOrderedEnumerable`
- Internal cached methods  → `targetClass = TyneqCachedEnumerable`
- External operators       → whatever class the developer targets (default `TyneqEnumerableBase`)

---

## Change 2 — `OperatorRegistry`: patch onto `targetClass.prototype`

Currently hardcoded to `TyneqEnumerableBase.prototype`. Use `entry.metadata.targetClass.prototype`.
`registerBuiltin` now takes `targetClass` instead of assuming `TyneqEnumerableBase`.

```typescript
// src/core/registry/TyneqOperatorRegistry.ts

public static register(input: OperatorEntry): void {
    const { name } = input.metadata;

    if (this._entries.has(name)) {
        const existing = this._entries.get(name)!.metadata;
        throw new Error(
            `[tyneq] Cannot register '${name}' (${input.metadata.kind}): ` +
            `already registered as '${existing.kind}' from source '${existing.source}'.`
        );
    }

    for (const guard of this._registrationGuards) guard(input);

    this._entries.set(name, input);
    // patch onto the specific target class, not always TyneqEnumerableBase
    (input.metadata.targetClass.prototype as any)[name] = input.impl;

    for (const hook of this._registrationHooks) hook(input);
}

public static unregister(name: string): boolean {
    const entry = this._entries.get(name);
    if (!entry) return false;

    this._entries.delete(name);
    if (entry.metadata.source !== "internal") {
        delete (entry.metadata.targetClass.prototype as any)[name];
    }
    return true;
}

public static registerBuiltin(
    name: string,
    kind: OperatorMetadata["kind"],
    targetClass: abstract new (...args: any[]) => TyneqEnumerableBase<unknown>
): void {
    if (this._entries.has(name)) {
        const existing = this._entries.get(name)!.metadata;
        throw new Error(
            `[tyneq] Cannot register builtin '${name}' (${kind}): ` +
            `already registered as '${existing.kind}' from source '${existing.source}'.`
        );
    }

    // No prototype patching — method already exists as a direct definition on targetClass.
    // Lazy wrapper avoids TDZ/circular-import issues during module initialization.
    const entry: OperatorEntry = {
        metadata: new OperatorMetadata(name, kind, "internal", targetClass),
        impl: function (this: unknown, ...args: unknown[]) {
            const real = (targetClass.prototype as any)[name];
            if (!real) {
                throw new Error(`[tyneq] Cannot invoke builtin '${name}': method not found on ${targetClass.name}.`);
            }
            return real.apply(this, args);
        },
    };

    this._entries.set(name, entry);
    for (const hook of this._registrationHooks) hook(entry);
}
```

---

## Change 3 — New file: `src/plugin/builtin.ts`

Two decorators that replace `@builtinOperator` and `@builtinTerminal` entirely.

### How they work

- **`@builtin` (method decorator)** — runs when the class body is evaluated. Receives the method
  function and the decorator context. Attaches `BuiltinOptions` onto the function via a
  well-known Symbol, then returns the function unchanged. This is just a tag — no registration
  happens here yet because the class reference is not available at method-decorator time.

- **`@sequence` (class decorator)** — runs after all method decorators on the class have fired.
  Receives the constructor. Walks `Object.getOwnPropertyNames(target.prototype)`, finds any
  method that has the `BUILTIN_META` Symbol on it, reads the options, and calls
  `OperatorRegistry.registerBuiltin(name, kind, target)`. Registration happens exactly once
  per class at class-definition time.

### Why a Symbol and not a plain string property?

Symbols are not enumerable and don't appear in `for...in` or `Object.keys()`, so the tag is
invisible to everything except code that explicitly holds the Symbol. Ownership is clear.

### Execution order within a class

Method decorators run bottom-up (innermost first), then the class decorator runs last. By the
time `@sequence` fires, every `@builtin`-tagged method already has `BUILTIN_META` on it.

```typescript
// src/plugin/builtin.ts

import { OperatorRegistry } from "../core/registry/TyneqOperatorRegistry";
import { TyneqEnumerableBase } from "../core/TyneqEnumerableBase";

const BUILTIN_META = Symbol("tyneq.builtinMeta");

export interface BuiltinOptions {
    readonly name: string;
    readonly kind: "streaming" | "buffer" | "terminal";
}

/**
 * Method decorator — declares this method as a built-in operator.
 *
 * Stores `BuiltinOptions` on the function object so `@sequence` can find it.
 * Does NOT register anything by itself — registration happens in `@sequence`.
 *
 * @internal
 */
export function builtin(options: BuiltinOptions) {
    return function (
        value: Function,
        _context: ClassMethodDecoratorContext
    ): Function {
        // Tag the method function with the options.
        // BUILTIN_META is a Symbol so this property is invisible to normal iteration.
        (value as any)[BUILTIN_META] = options;
        return value; // return unchanged — we only tag, not wrap
    };
}

/**
 * Class decorator — declares this class as a sequence whose `@builtin` methods are operators.
 *
 * Scans the prototype for `@builtin`-tagged methods and registers each one via
 * `OperatorRegistry.registerBuiltin`, passing this class as `targetClass`.
 *
 * @internal
 */
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
// TyneqEnumerableBase.ts
@sequence
export abstract class TyneqEnumerableBase<TSource> extends TyneqEnumerableCore<TSource> {

    @builtin({ name: "where", kind: "streaming" })
    public where(predicate: (item: TSource) => boolean): TyneqSequence<TSource> {
        const node = new QueryNode("where", [predicate], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new WhereEnumerator(this.getEnumerator(), predicate) },
            node
        );
    }

    @builtin({ name: "select", kind: "streaming" })
    public select<TResult>(selector: (item: TSource) => TResult): TyneqSequence<TResult> {
        const node = new QueryNode("select", [selector], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new SelectEnumerator(this.getEnumerator(), selector) },
            node
        );
    }

    // terminal operators follow the same pattern with kind: "terminal"
    @builtin({ name: "count", kind: "terminal" })
    public count(): number {
        return new CountOperator(this).process();
    }
}

// TyneqEnumerableCore.ts
@sequence
export abstract class TyneqEnumerableCore<TSource> {

    @builtin({ name: "orderBy", kind: "streaming" })
    public orderBy<TKey>(...): TyneqOrderedSequence<TSource> { ... }

    @builtin({ name: "memoize", kind: "buffer" })
    public memoize(): TyneqCachedSequence<TSource> { ... }
}

// TyneqOrderedEnumerable.ts
@sequence
export class TyneqOrderedEnumerable<TSource, TKey> extends TyneqEnumerableBase<TSource> {

    @builtin({ name: "thenBy", kind: "streaming" })
    public thenBy<UKey>(...): TyneqOrderedSequence<TSource> { ... }

    @builtin({ name: "thenByDescending", kind: "streaming" })
    public thenByDescending<UKey>(...): TyneqOrderedSequence<TSource> { ... }
}

// TyneqCachedEnumerable.ts
@sequence
export class TyneqCachedEnumerable<TSource> extends TyneqEnumerableBase<TSource> {

    @builtin({ name: "refresh", kind: "terminal" })
    public refresh(): TyneqCachedSequence<TSource> { ... }
}
```

The enumerator classes (`WhereEnumerator`, `SelectEnumerator`, etc.) lose `@builtinOperator`
and `@builtinTerminal` entirely. `createOperatorNode()` is also deleted from
`TyneqEnumerableBase` — each method builds its own `QueryNode` inline with the name and kind
it already knows statically.

---

## Change 4 — New enumerator base classes for ordered/cached operators

`TyneqEnumerator<TInput, TOutput>` receives `Enumerator<TInput>` as source. Ordered and cached
enumerators need the full sequence object instead.

```typescript
// src/core/enumerators/TyneqOrderedEnumerator.ts

import { TyneqBaseEnumerator } from "./TyneqBaseEnumerator";
import { OrderedEnumerable } from "../../types/core";

/**
 * Base class for enumerators that need the full ordered sequence (not just an Enumerator<T>).
 * Lifecycle of the source is owned by the sequence, not the enumerator.
 *
 * @internal
 */
export abstract class TyneqOrderedEnumerator<TSource>
    extends TyneqBaseEnumerator<TSource> {

    constructor(protected readonly orderedSource: OrderedEnumerable<TSource>) {
        super();
    }

    protected override disposeSource(): void {
        // The sequence owns its own lifecycle — enumerator must not dispose it.
    }
}
```

```typescript
// src/core/enumerators/TyneqCachedEnumerator.ts

import { TyneqBaseEnumerator } from "./TyneqBaseEnumerator";
import { CachedEnumerable } from "../../types/core";

/**
 * Base class for enumerators that need the full cached sequence (not just an Enumerator<T>).
 * Lifecycle of the source is owned by the sequence, not the enumerator.
 *
 * @internal
 */
export abstract class TyneqCachedEnumerator<TSource>
    extends TyneqBaseEnumerator<TSource> {

    constructor(protected readonly cachedSource: CachedEnumerable<TSource>) {
        super();
    }

    protected override disposeSource(): void {
        // The sequence owns its own lifecycle — enumerator must not dispose it.
    }
}
```

- `OrderByEnumerator` extends `TyneqOrderedEnumerator` (already receives `OrderedEnumerable`)
- `MemoizeEnumerator` extends `TyneqCachedEnumerator` (already receives `CachedEnumerable`)

---

## Change 5 — New external-facing decorators: `@orderedOperator` / `@cachedOperator`

These are the external equivalents of `@operator`, targeting specific subtypes. The only
differences from `@operator` are the `targetClass` passed to `OperatorMetadata` and that
`impl` passes `this` (the sequence) rather than `this.getEnumerator()` to the constructor.

```typescript
// src/plugin/orderedOperator.ts

import { OperatorRegistry } from "../core/registry/TyneqOperatorRegistry";
import { OperatorMetadata } from "../core/registry/OperatorMetadata";
import { TyneqOrderedEnumerable } from "../core/ordering/TyneqOrderedEnumerable";
import { inferOperatorKind } from "./inferKind";
import { QueryNode } from "../queryplan/QueryNode";
import { tyneqQueryNode } from "../types/queryplan";
import { IWithCreateEnumerable } from "../types/core";

/**
 * Class decorator that registers a `TyneqOrderedEnumerator` subclass as an operator
 * available only on ordered sequences.
 *
 * The enumerator constructor receives the full `TyneqOrderedEnumerable` as its first
 * argument (not just an `Enumerator<T>`).
 *
 * @example
 * ```ts
 * @orderedOperator("myThenBy", (keySelector) => {
 *     if (typeof keySelector !== "function") throw new Error("keySelector must be a function");
 * })
 * class MyThenByEnumerator<T> extends TyneqOrderedEnumerator<T> {
 *     constructor(source: OrderedEnumerable<T>, private keySelector: (item: T) => unknown) {
 *         super(source);
 *     }
 *     protected handleNext(): IteratorResult<T> { ... }
 * }
 * ```
 */
export function orderedOperator<TArgs extends unknown[] = never>(
    name: string,
    validate?: (...args: TArgs) => void
) {
    return function <TClass extends new (...args: any[]) => any>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        OperatorRegistry.register({
            metadata: new OperatorMetadata(name, "buffer", "external", TyneqOrderedEnumerable),
            impl: function (this: TyneqOrderedEnumerable<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                const base = this;
                const withCreate = this as unknown as IWithCreateEnumerable;
                const node = new QueryNode(name, userArgs, withCreate[tyneqQueryNode], "buffer");
                return withCreate.createEnumerable({
                    // passes `this` (the ordered sequence), not this.getEnumerator()
                    getEnumerator: () => new target(base, ...userArgs)
                }, node);
            }
        });
        return target;
    };
}
```

```typescript
// src/plugin/cachedOperator.ts

import { OperatorRegistry } from "../core/registry/TyneqOperatorRegistry";
import { OperatorMetadata } from "../core/registry/OperatorMetadata";
import { TyneqCachedEnumerable } from "../core/TyneqCachedEnumerable";
import { QueryNode } from "../queryplan/QueryNode";
import { tyneqQueryNode } from "../types/queryplan";
import { IWithCreateEnumerable } from "../types/core";

/**
 * Class decorator that registers a `TyneqCachedEnumerator` subclass as an operator
 * available only on cached sequences.
 *
 * The enumerator constructor receives the full `TyneqCachedEnumerable` as its first
 * argument (not just an `Enumerator<T>`).
 *
 * @example
 * ```ts
 * @cachedOperator("myRefresh")
 * class MyRefreshEnumerator<T> extends TyneqCachedEnumerator<T> {
 *     constructor(source: CachedEnumerable<T>) { super(source); }
 *     protected handleNext(): IteratorResult<T> { ... }
 * }
 * ```
 */
export function cachedOperator<TArgs extends unknown[] = never>(
    name: string,
    validate?: (...args: TArgs) => void
) {
    return function <TClass extends new (...args: any[]) => any>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        OperatorRegistry.register({
            metadata: new OperatorMetadata(name, "buffer", "external", TyneqCachedEnumerable),
            impl: function (this: TyneqCachedEnumerable<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                const base = this;
                const withCreate = this as unknown as IWithCreateEnumerable;
                const node = new QueryNode(name, userArgs, withCreate[tyneqQueryNode], "buffer");
                return withCreate.createEnumerable({
                    // passes `this` (the cached sequence), not this.getEnumerator()
                    getEnumerator: () => new target(base, ...userArgs)
                }, node);
            }
        });
        return target;
    };
}
```

### `operator.ts` — pass `TyneqEnumerableBase` as `targetClass`

The existing `@operator` needs one small update: pass `TyneqEnumerableBase` as `targetClass`
to `OperatorMetadata`.

```typescript
// src/plugin/operator.ts  (diff — only the register call changes)

OperatorRegistry.register({
    metadata: new OperatorMetadata(name, kind, "external", TyneqEnumerableBase),
    impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
        actualValidate?.(...(userArgs as TArgs));
        const base = this;
        const withCreate = this as unknown as IWithCreateEnumerable;
        const node = new QueryNode(name, userArgs, withCreate[tyneqQueryNode], kind);
        return withCreate.createEnumerable({
            getEnumerator() { return new target(base.getEnumerator(), ...userArgs); }
        }, node);
    }
});
```

### `inferKind.ts` — detect ordered/cached enumerator bases

```typescript
// src/plugin/inferKind.ts

import { TyneqEnumerator } from "../core/enumerators/TyneqEnumerator";
import { TyneqOrderedEnumerator } from "../core/enumerators/TyneqOrderedEnumerator";
import { TyneqCachedEnumerator } from "../core/enumerators/TyneqCachedEnumerator";

export function inferOperatorKind(target: Function): "streaming" | "buffer" {
    let proto = Object.getPrototypeOf(target.prototype);
    while (proto !== null) {
        if (proto === TyneqEnumerator.prototype) return "streaming";
        if (proto === TyneqOrderedEnumerator.prototype) return "buffer";
        if (proto === TyneqCachedEnumerator.prototype) return "buffer";
        proto = Object.getPrototypeOf(proto);
    }

    throw new Error(
        `[tyneq] @operator('${target.name ?? "?"}'): ` +
        "cannot infer kind — class must extend TyneqEnumerator, TyneqOrderedEnumerator, " +
        `or TyneqCachedEnumerator, or pass kind explicitly.`
    );
}
```

---

## Change 6 — Compiler: validate using `instanceof targetClass`

Replace the hardcoded `instanceof TyneqEnumerableBase` check with a metadata-driven one:

```typescript
// src/queryplan/compiler/QueryPlanCompiler.ts

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
| `src/core/registry/OperatorMetadata.ts` | Add `targetClass` parameter; delete `tyneqOperatorMetadata` symbol, `setOperatorMetadata`, `getOperatorMetadata`, `IOperatorMetadata`, `IOperatorMetadataCarrier` |
| `src/core/registry/TyneqOperatorRegistry.ts` | `register()` patches `targetClass.prototype`; `unregister()` deletes from `targetClass.prototype`; `registerBuiltin()` takes `targetClass` |
| `src/plugin/builtinOperator.ts` | **Deleted** — replaced by `@builtin` + `@sequence` |
| `src/plugin/builtinTerminal.ts` | **Deleted** — replaced by `@builtin` + `@sequence` |
| `src/plugin/builtin.ts` | New file — `@builtin` method decorator + `@sequence` class decorator |
| `src/plugin/orderedOperator.ts` | New file — `@orderedOperator` class decorator for external developers |
| `src/plugin/cachedOperator.ts` | New file — `@cachedOperator` class decorator for external developers |
| `src/plugin/inferKind.ts` | Detect `TyneqOrderedEnumerator` and `TyneqCachedEnumerator` |
| `src/plugin/operator.ts` | Pass `TyneqEnumerableBase` as `targetClass` in `OperatorMetadata` |
| `src/core/enumerators/TyneqOrderedEnumerator.ts` | New file |
| `src/core/enumerators/TyneqCachedEnumerator.ts` | New file |
| `src/core/TyneqEnumerableBase.ts` | Add `@sequence` + `@builtin` on every operator method; delete `createOperatorNode()`; remove enumerator-class registration |
| `src/core/TyneqEnumerableCore.ts` | Add `@sequence` + `@builtin` on each method |
| `src/core/ordering/TyneqOrderedEnumerable.ts` | Add `@sequence` + `@builtin` on `thenBy`/`thenByDescending` |
| `src/core/TyneqCachedEnumerable.ts` | Add `@sequence` + `@builtin` on `refresh` |
| `src/enumerators/**/*.ts` | Remove `@builtinOperator` / `@builtinTerminal` from all enumerator classes |
| `src/enumerators/buffer/orderBy.ts` | Extend `TyneqOrderedEnumerator` |
| `src/enumerators/buffer/memoize.ts` | Extend `TyneqCachedEnumerator` |
| `src/queryplan/compiler/QueryPlanCompiler.ts` | Use `instanceof entry.metadata.targetClass` |
| `src/types/core.ts` | Remove `IOperatorMetadata`, `IOperatorMetadataCarrier` interfaces |
