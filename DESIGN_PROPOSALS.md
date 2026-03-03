# Tyneq Design Proposals

Three concrete proposals for evolving the library: optimized argument validation, developer-friendly extensibility, and a validation pipeline.

---

## 1. Argument Validation Without Hardcoded Strings — Full Analysis

### Problem

Every validation call currently looks like:

```ts
ArgumentUtility.checkNotOptional(source, nameof({ source }));
```

The goals:
1. **No hardcoded strings** — don't pass `'source'` as a raw string literal
2. **Easy to read and write** — minimal boilerplate
3. **Correct param names in error messages** — even after minification
4. **No extra dependencies** — fits the "zero runtime dependencies" philosophy

### Minification Reality Check (Verified on This Repo)

I built tyneq with `tsup --minify` (esbuild) and inspected the output. Key finding:

```js
// Minified output — variable "source" renamed to "r", but object key preserved:
checkNotOptional(r, o({source: r}))
//                     ^^^^^^ STRING LITERAL — survives minification
```

**All 32 parameter names survive minification.** This is because JavaScript object property keys
in literals like `{ source: r }` are string constants in the AST — bundlers (esbuild, terser, SWC)
never rename them. Only the variable binding (`source` → `r`) is renamed; the key is immutable.

This means the `{ param }` shorthand pattern is **minification-safe** in all modern bundlers.

---

### Approach Comparison

#### Approach A: `{ param }` Shorthand (Recommended)

```ts
Arg.checkNotOptional({ source });
// Object key "source" is a string literal → survives minification
```

| Aspect | Rating |
|--------|--------|
| Readability | ★★★★★ — minimal syntax |
| Minification safety | ★★★★★ — verified: keys are string literals |
| Type safety | ★★★★★ — `asserts` narrowing works |
| Runtime cost | ★★★★☆ — one object allocation + `Object.keys()` |
| Refactoring | ★★★★☆ — rename variable → key auto-updates (IDE shorthand) |

#### Approach B: Proxy-Based Fluent Validator

```ts
const v = guard({ source, predicate, count });
v.source.notOptional();
v.predicate.notOptional().isFunction();
v.count.nonNegative().integer();
```

Uses a `Proxy` to intercept property access and capture the key name, then exposes
a chainable validation API on each property.

| Aspect | Rating |
|--------|--------|
| Readability | ★★★★★ — very fluent, validates multiple params together |
| Minification safety | ★★★★★ — same `{ param }` key survival |
| Type safety | ★★★☆☆ — `asserts` narrowing doesn't work through Proxy returns |
| Runtime cost | ★★★☆☆ — Proxy creation + multiple trap invocations |
| Refactoring | ★★★★☆ — same as Approach A |

**Critical problem**: TypeScript cannot narrow the *original* variable through a Proxy.
`v.source.notOptional()` can assert on the proxy wrapper but cannot narrow `source`
in the calling scope. You'd lose the `asserts value is T` narrowing that makes
`ArgumentUtility` powerful.

#### Approach C: TypeScript Compiler Transformer

```ts
// Source:
ArgumentUtility.checkNotOptional(source, nameof(source));

// After ts-nameof transformer (compile time):
ArgumentUtility.checkNotOptional(source, "source");
```

A build plugin (like `ts-nameof` or a custom transformer) replaces `nameof(expr)` with
the string `"expr"` at compile time.

| Aspect | Rating |
|--------|--------|
| Readability | ★★★★★ — reads like C# |
| Minification safety | ★★★★★ — baked as string at compile time |
| Type safety | ★★★★★ — original `asserts` pattern preserved |
| Runtime cost | ★★★★★ — zero overhead, it's just a string |
| Refactoring | ★★☆☆☆ — transformer must be maintained, not standard TS |

**Problem**: Adds a build dependency. Every consumer of tyneq-as-source would also
need the transformer. For an npm-published library this is fine (transformer runs
at build time, consumers see compiled code), but it complicates DX for contributors.

#### Approach D: Parameter Decorators (Experimental/Legacy)

```ts
class TyneqOperatorEnumerable<T> {
    constructor(@NotNull source: IEnumerable<T>) {  // TS experimental decorator
        this.source = source;
    }
}
```

| Aspect | Rating |
|--------|--------|
| Readability | ★★★★★ — very C#-like |
| Minification safety | ★★★★★ — decorator metadata stored as strings |
| Type safety | ★★☆☆☆ — no assertion narrowing |
| Runtime cost | ★★★☆☆ — reflect-metadata overhead |
| Refactoring | ★☆☆☆☆ — TC39 decorators do NOT support parameter decorators |

**Dealbreaker**: The TC39 decorator proposal (TypeScript 5.0+) only supports class,
method, accessor, and field decorators. **Parameter decorators are not in the spec**
and only exist in legacy/experimental mode (`experimentalDecorators: true`), which
is being deprecated. This approach has no future.

#### Approach E: Hardcoded Strings (Baseline)

```ts
ArgumentUtility.checkNotOptional(source, 'source');
```

| Aspect | Rating |
|--------|--------|
| Readability | ★★★★☆ — simple but redundant |
| Minification safety | ★★★★★ — it's a string literal |
| Type safety | ★★★★★ — original `asserts` preserved |
| Runtime cost | ★★★★★ — zero overhead |
| Refactoring | ★☆☆☆☆ — rename variable, forget to rename string → wrong error message |

---

### Recommendation: Approach A — `{ param }` Shorthand via `Arg` Class

The `{ param }` pattern wins because:

1. **Minification-safe** — verified on this repo with `tsup --minify`. Object keys are string literals in the JS AST and are never renamed by any bundler.
2. **Full `asserts` narrowing** — unlike Proxy-based approaches, the assertion can narrow the original type.
3. **Zero dependencies** — no transformers, no reflect-metadata, no experimental features.
4. **Eliminates `nameof` import** — reduces from 2 imports to 1 per file.
5. **Refactoring-safe** — when you rename a variable with your IDE, the shorthand key updates automatically (same behavior as current `nameof({ source })`).
6. **Already battle-tested** — the `{ param }` object is already being created in every `nameof()` call today. We're just cutting out the middleman.

### Implementation: `Arg` Class

```ts
// ─── New: src/utility/Arg.ts ─────────────────────────────────────────────

import { ArgumentNullError } from '../core/errors/argument/ArgumentNullError';
import { ArgumentError } from '../core/errors/argument/ArgumentError';
import { ArgumentOutOfRangeError } from '../core/errors/argument/ArgumentOutOfRangeError';
import { ArgumentTypeError } from '../core/errors/argument/ArgumentTypeError';
import type { Nullable, Optional, Undefinedable, HasLength } from '../types/utility';
import type { IEnumerable, IEnumerator } from '../types/core';
import { TypeGuardUtility } from './typeGuardUtility';

/**
 * Lightweight argument validation using named parameter objects.
 * 
 * Instead of:
 *   ArgumentUtility.checkNotOptional(source, nameof({ source }));
 * 
 * Write:
 *   Arg.checkNotOptional({ source });
 * 
 * The parameter name is extracted from the object key at the call site.
 * This eliminates the need for the separate nameof() utility and reduces
 * the two-argument pattern to a single-argument pattern.
 * 
 * WHY THIS IS MINIFICATION-SAFE:
 * 
 * When you write `Arg.checkNotOptional({ source })`, JavaScript compiles
 * the shorthand to `Arg.checkNotOptional({ source: source })`. The key
 * "source" is a string literal in the AST. Minifiers (esbuild, terser, SWC)
 * rename the VARIABLE binding (`source` → `r`) but never touch object
 * property KEYS because that would change runtime semantics. Result:
 * 
 *   Minified: Arg.checkNotOptional({ source: r })
 *                                    ^^^^^^ preserved
 * 
 * Verified on this repo with `tsup --minify`: all 32 parameter names survive.
 */
export class Arg {
    private constructor() {}

    // ── Internal helpers ──────────────────────────────────────────────

    /**
     * Extracts (paramName, value) from a single-key object.
     * Costs one Object.keys call — same as current nameof — but eliminates
     * the separate nameof() function and second argument.
     */
    private static extract<T>(param: Record<string, T>): [name: string, value: T] {
        const keys = Object.keys(param);
        return [keys[0], param[keys[0]]];
    }

    // ── Null / Undefined / Optional ───────────────────────────────────

    public static checkNotNull<T>(param: Record<string, Nullable<T>>): asserts param is Record<string, T> {
        const [name, value] = this.extract(param);
        if (value === null) {
            throw new ArgumentNullError(name);
        }
    }

    public static checkNotUndefined<T>(param: Record<string, Undefinedable<T>>): asserts param is Record<string, T> {
        const [name, value] = this.extract(param);
        if (value === undefined) {
            throw new ArgumentError(`'${name}' cannot be undefined.`, name);
        }
    }

    public static checkNotOptional<T>(param: Record<string, Optional<T>>): asserts param is Record<string, T> {
        const [name, value] = this.extract(param);
        if (value === null) throw new ArgumentNullError(name);
        if (value === undefined) throw new ArgumentError(`'${name}' cannot be undefined.`, name);
    }

    // ── Empty checks ──────────────────────────────────────────────────

    public static checkNotNullOrEmpty<T extends HasLength>(param: Record<string, Nullable<T>>): asserts param is Record<string, T> {
        const [name, value] = this.extract(param);
        if (value === null) throw new ArgumentNullError(name);
        if (value.length === 0) throw new ArgumentError(`'${name}' cannot be empty.`, name);
    }

    public static checkNotOptionalOrEmpty<T extends HasLength>(param: Record<string, Optional<T>>): asserts param is Record<string, T> {
        const [name, value] = this.extract(param);
        if (value === null) throw new ArgumentNullError(name);
        if (value === undefined) throw new ArgumentError(`'${name}' cannot be undefined.`, name);
        if (value.length === 0) throw new ArgumentError(`'${name}' cannot be empty.`, name);
    }

    public static checkNotNullOrWhiteSpace(param: Record<string, Optional<string>>): asserts param is Record<string, string> {
        const [name, value] = this.extract(param);
        if (value === null) throw new ArgumentNullError(name);
        if (value === undefined) throw new ArgumentError(`'${name}' cannot be undefined.`, name);
        if (value.trim().length === 0) throw new ArgumentError(`'${name}' cannot be empty or whitespace.`, name);
    }

    // ── Numeric checks ───────────────────────────────────────────────

    public static checkNonNegative(param: Record<string, number>): void {
        const [name, value] = this.extract(param);
        if (!Number.isFinite(value) || value < 0) {
            throw new ArgumentOutOfRangeError(name, `'${name}' must be a non-negative number.`);
        }
    }

    public static checkPositive(param: Record<string, number>): void {
        const [name, value] = this.extract(param);
        if (!Number.isFinite(value) || value <= 0) {
            throw new ArgumentOutOfRangeError(name, `'${name}' must be a positive number.`);
        }
    }

    public static checkNegative(param: Record<string, number>): void {
        const [name, value] = this.extract(param);
        if (!Number.isFinite(value) || value >= 0) {
            throw new ArgumentOutOfRangeError(name, `'${name}' must be a negative number.`, value);
        }
    }

    public static checkNonPositive(param: Record<string, number>): void {
        const [name, value] = this.extract(param);
        if (!Number.isFinite(value) || value > 0) {
            throw new ArgumentOutOfRangeError(name, `'${name}' must be a non-positive number.`, value);
        }
    }

    public static checkInteger(param: Record<string, number>): void {
        const [name, value] = this.extract(param);
        if (!Number.isFinite(value) || !Number.isInteger(value)) {
            throw new ArgumentError(`'${name}' must be an integer.`, name);
        }
    }

    public static checkFinite(param: Record<string, number>): void {
        const [name, value] = this.extract(param);
        if (!Number.isFinite(value)) {
            throw new ArgumentOutOfRangeError(name, `'${name}' must be a finite number.`, value);
        }
    }

    public static checkNotNaN(param: Record<string, number>): void {
        const [name, value] = this.extract(param);
        if (Number.isNaN(value)) {
            throw new ArgumentOutOfRangeError(name, `'${name}' must not be NaN.`, value);
        }
    }

    public static checkSafeInteger(param: Record<string, number>): void {
        const [name, value] = this.extract(param);
        if (!Number.isSafeInteger(value)) {
            throw new ArgumentOutOfRangeError(name, `'${name}' must be a safe integer.`, value);
        }
    }

    /** Range check still needs min/max as extra params — but paramName is extracted. */
    public static checkInRange(param: Record<string, number>, min: number, max: number): void {
        const [name, value] = this.extract(param);
        if (!Number.isFinite(value) || value < min || value > max) {
            throw new ArgumentOutOfRangeError(name, `'${name}' must be in range [${min}, ${max}].`);
        }
    }

    public static checkArrayIndex(param: Record<string, number>, length: number): void {
        const [name, value] = this.extract(param);
        if (!Number.isSafeInteger(value) || value < 0 || value >= length) {
            throw new ArgumentOutOfRangeError(name, `'${name}' must be a valid array index in [0, ${length}).`, value);
        }
    }

    // ── Type checks ──────────────────────────────────────────────────

    public static checkFunction(param: Record<string, unknown>): asserts param is Record<string, Function> {
        const [name, value] = this.extract(param);
        if (typeof value !== 'function') {
            throw new ArgumentTypeError(name, 'function', typeof value);
        }
    }

    public static checkIterable<T = unknown>(param: Record<string, unknown>): asserts param is Record<string, Iterable<T>> {
        const [name, value] = this.extract(param);
        if (!TypeGuardUtility.isIterable<T>(value)) {
            const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
            throw new ArgumentTypeError(name, 'iterable', actualType);
        }
    }

    public static checkIterator<T = unknown>(param: Record<string, unknown>): asserts param is Record<string, Iterator<T>> {
        const [name, value] = this.extract(param);
        if (!TypeGuardUtility.isIterator<T>(value)) {
            const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
            throw new ArgumentTypeError(name, 'iterator', actualType);
        }
    }

    public static checkEnumerable<T = unknown>(param: Record<string, unknown>): asserts param is Record<string, IEnumerable<T>> {
        const [name, value] = this.extract(param);
        if (!TypeGuardUtility.isEnumerable<T>(value)) {
            const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
            throw new ArgumentTypeError(name, 'IEnumerable', actualType);
        }
    }

    public static checkEnumerator<T = unknown>(param: Record<string, unknown>): asserts param is Record<string, IEnumerator<T>> {
        const [name, value] = this.extract(param);
        if (!TypeGuardUtility.isEnumerator<T>(value)) {
            const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
            throw new ArgumentTypeError(name, 'IEnumerator', actualType);
        }
    }

    public static checkInstanceOf<T>(
        param: Record<string, unknown>,
        constructor: new (...args: any[]) => T,
    ): asserts param is Record<string, T> {
        const [name, value] = this.extract(param);
        if (!(value instanceof constructor)) {
            const constructorName = constructor.name || 'unknown';
            const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
            throw new ArgumentTypeError(name, constructorName, actualType);
        }
    }

    public static checkHasLength(param: Record<string, unknown>): asserts param is Record<string, HasLength> {
        const [name, value] = this.extract(param);
        if (typeof value !== 'object' || value === null || typeof (value as any).length !== 'number') {
            throw new ArgumentTypeError(name, 'object with numeric length property', typeof value);
        }
    }

    /** Custom predicate validation. */
    public static check<T>(param: Record<string, T>, predicate: (value: T) => boolean, message: string): void {
        const [name, value] = this.extract(param);
        if (!predicate(value)) {
            throw new ArgumentError(message, name);
        }
    }
}
```

### Migration

```ts
// ── BEFORE (2 imports, 57 chars per call) ───────────────────────────
import { ArgumentUtility } from '../utility/argumentUtility';
import { nameof } from '../utility/nameof';

public constructor(source: IEnumerable<TSource>) {
    ArgumentUtility.checkNotOptional(source, nameof({ source }));
    this.source = source;
}

// ── AFTER (1 import, 33 chars per call) ─────────────────────────────
import { Arg } from '../utility/Arg';

public constructor(source: IEnumerable<TSource>) {
    Arg.checkNotOptional({ source });
    this.source = source;
}
```

### Summary: Why the Other Approaches Don't Work

| Approach | Why Not |
|----------|---------|
| **Proxy fluent** (`v.source.notNull()`) | TypeScript `asserts` narrowing cannot flow through Proxy returns — you lose the core value of assertion methods |
| **TS transformer** (`nameof(source)` → `"source"`) | Adds a build tooling dependency; requires all contributors to configure the transformer |
| **Parameter decorators** (`@NotNull source`) | TC39 decorators do NOT support parameter decorators — only legacy/experimental TS decorators do, and those are being deprecated |
| **Reflection** (`reflect-metadata`) | Requires `experimentalDecorators` + `emitDecoratorMetadata` — both deprecated features. Also can't narrow types |
| **Hardcoded strings** (`'source'`) | Refactoring-unsafe — rename a variable and forget the string → wrong error message |
| **Error stack parsing** | Fragile, slow, environment-dependent, still breaks with minification |

### What `{ param }` shorthand gives you

| Aspect | Before (`nameof`) | After (`Arg`) |
|--------|-------------------|---------------|
| **Imports per file** | 2 (`ArgumentUtility` + `nameof`) | 1 (`Arg`) |
| **Characters per call** | 57 | 33 |
| **Allocations per call** | 2 (object + `Object.keys` inside `nameof`) | 1 (object — `Object.keys` inside `extract`) |
| **Minification safety** | ✅ (verified) | ✅ (identical — same mechanism) |
| **IDE rename refactoring** | ✅ (shorthand key follows variable) | ✅ (identical) |
| **Type narrowing** | ✅ (`asserts value is T`) | ✅ (`asserts param is Record<string, T>`) |

### Optional: DEV-only Guards for Production

If you want zero validation overhead in production builds:

```ts
// tsup.config.ts
export default defineConfig({
    define: { '__DEV__': JSON.stringify(process.env.NODE_ENV !== 'production') },
    // ...
});

// Arg.ts
declare const __DEV__: boolean;

export class Arg {
    public static checkNotOptional<T>(param: Record<string, Optional<T>>): asserts param is Record<string, T> {
        if (!__DEV__) return;  // entire body dead-code-eliminated in production
        const [name, value] = this.extract(param);
        if (value === null) throw new ArgumentNullError(name);
        if (value === undefined) throw new ArgumentError(`'${name}' cannot be undefined.`, name);
    }
}
```

### Migration Strategy

1. Create `Arg.ts` alongside `argumentUtility.ts` (both coexist during migration)
2. Migrate files incrementally — each file replaces `ArgumentUtility.X(val, nameof({ val }))` → `Arg.X({ val })`
3. Remove `nameof` imports as files are migrated
4. Once all 94 call sites are migrated: delete `nameof.ts`, deprecate `ArgumentUtility`
5. Keep `ArgumentUtility` as a public re-export (deprecated) for any external consumers

---

## 2. Developer-Friendly Operator Extensibility

### Problem

Currently, adding a new operator requires:
1. Create an enumerator class in `src/enumerators/`
2. Create an operator class in `src/operators/`
3. Add the method to `TyneqEnumerableBase` (1806-line god class)
4. Add the method signature to `ITyneqEnumerable` interface in `core.ts`
5. Import both classes at the top of `TyneqEnumerableBase`

This means **external developers cannot add operators at all** without forking.

### Solution: `defineOperator()` + Module Augmentation

A two-layer approach:

**Layer 1 — `pipe()` (already exists)**: For quick one-off custom operators. No registration needed.

**Layer 2 — `defineOperator()`**: For reusable operators that feel native on the chain.

```ts
// ─── New: src/extensibility/defineOperator.ts ─────────────────────────

import type { ITyneqEnumerable, IEnumerator, IEnumeratorFactory } from '../types/core';
import { TyneqEnumerableBase } from '../core/TyneqEnumerableBase';

/**
 * Configuration for defining a custom streaming/buffer operator.
 */
export interface OperatorDefinition<TSource, TResult, TArgs extends any[]> {
    /** The method name to register on TyneqEnumerableBase. */
    name: string;
    /**  
     * Factory that receives the source enumerable and the user-provided arguments,
     * returns an IEnumeratorFactory for the result sequence.
     *  
     * This factory is called each time the method is invoked on a sequence.
     */
    factory: (source: ITyneqEnumerable<TSource>, ...args: TArgs) => IEnumeratorFactory<TResult>;
}

/**
 * Configuration for defining a custom terminal operator.
 */
export interface TerminalOperatorDefinition<TSource, TResult, TArgs extends any[]> {
    /** The method name to register on TyneqEnumerableBase. */
    name: string;
    /**
     * Function that receives the source enumerable and user-provided arguments,
     * executes immediately, and returns the result.
     */
    execute: (source: ITyneqEnumerable<TSource>, ...args: TArgs) => TResult;
}

/**
 * Registers a streaming or buffering operator on all TyneqEnumerable instances.
 * 
 * @example
 * ```ts
 * // Define a "window" operator that yields sliding windows
 * defineOperator<number, number[], [size: number]>({
 *     name: 'window',
 *     factory(source, size) {
 *         return {
 *             getEnumerator() {
 *                 return windowEnumerator(source[Symbol.iterator](), size);
 *             }
 *         };
 *     }
 * });
 * 
 * // TypeScript module augmentation (in your .d.ts or at top of file)
 * declare module 'tyneq' {
 *     interface ITyneqEnumerable<TSource> {
 *         window(size: number): ITyneqEnumerable<TSource[]>;
 *     }
 * }
 * 
 * // Now use it fluently
 * Tyneq.from([1,2,3,4,5]).window(3).toArray();
 * // [[1,2,3], [2,3,4], [3,4,5]]
 * ```
 */
export function defineOperator<TSource, TResult, TArgs extends any[]>(
    definition: OperatorDefinition<TSource, TResult, TArgs>
): void {
    const proto = TyneqEnumerableBase.prototype as any;
    
    if (proto[definition.name] !== undefined) {
        throw new Error(`Operator '${definition.name}' is already defined.`);
    }
    
    proto[definition.name] = function(this: TyneqEnumerableBase<TSource>, ...args: TArgs) {
        const factory = definition.factory(this as any, ...args);
        return (this as any).createEnumerable(factory);
    };
}

/**
 * Registers a terminal operator on all TyneqEnumerable instances.
 * 
 * @example
 * ```ts
 * defineTerminalOperator<number, string, [separator: string]>({
 *     name: 'joinString',
 *     execute(source, separator) {
 *         const parts: string[] = [];
 *         for (const item of source) parts.push(String(item));
 *         return parts.join(separator);
 *     }
 * });
 * 
 * declare module 'tyneq' {
 *     interface ITyneqEnumerable<TSource> {
 *         joinString(separator: string): string;
 *     }
 * }
 * 
 * Tyneq.from([1, 2, 3]).joinString(', '); // "1, 2, 3"
 * ```
 */
export function defineTerminalOperator<TSource, TResult, TArgs extends any[]>(
    definition: TerminalOperatorDefinition<TSource, TResult, TArgs>
): void {
    const proto = TyneqEnumerableBase.prototype as any;
    
    if (proto[definition.name] !== undefined) {
        throw new Error(`Operator '${definition.name}' is already defined.`);
    }
    
    proto[definition.name] = function(this: TyneqEnumerableBase<TSource>, ...args: TArgs) {
        return definition.execute(this as any, ...args);
    };
}
```

### Complete Example: External Developer Creating a `scan` Operator

```ts
// ─── userland: my-operators/scan.ts ──────────────────────────────────

import { defineOperator, type IEnumerator } from 'tyneq';

// Step 1: Define the enumerator (can use a generator for simplicity)
function* scanGenerator<T, TAcc>(
    source: Iterable<T>,
    seed: TAcc,
    accumulator: (acc: TAcc, item: T) => TAcc
): IterableIterator<TAcc> {
    let acc = seed;
    for (const item of source) {
        acc = accumulator(acc, item);
        yield acc;
    }
}

// Step 2: Register (one line)
defineOperator<any, any, [seed: any, accumulator: (acc: any, item: any) => any]>({
    name: 'scan',
    factory(source, seed, accumulator) {
        return {
            getEnumerator() {
                return scanGenerator(source, seed, accumulator);
            }
        };
    }
});

// Step 3: Type augmentation (enables autocomplete + type checking)
declare module 'tyneq' {
    interface ITyneqEnumerable<TSource> {
        scan<TAcc>(seed: TAcc, accumulator: (acc: TAcc, item: TSource) => TAcc): ITyneqEnumerable<TAcc>;
    }
}
```

```ts
// Using it:
import 'my-operators/scan';    // side-effect import registers the operator
import { Tyneq } from 'tyneq';

const runningSum = Tyneq.from([1, 2, 3, 4, 5])
    .scan(0, (acc, n) => acc + n)
    .toArray();
// [1, 3, 6, 10, 15]
```

### Why Not Mixins?

Mixins in TypeScript have fundamental problems for this use case:

| Issue | Detail |
|-------|--------|
| **Type inference** | Mixin classes lose type parameters — `TSource` would need manual threading |
| **Class explosion** | Each mixin produces a new class; chaining 5 mixins = 5 intermediate classes |
| **`this` typing** | `this` in mixins loses the concrete type, breaking fluent chains |
| **No conditional** | Can't extend with mixins selectively at runtime |
| **Decorator mismatch** | TC39 decorators can't augment class shapes in TypeScript's type system |

The `defineOperator()` + module augmentation approach gives:
- **Zero boilerplate** — one function call per operator
- **Full type safety** — module augmentation works perfectly with TypeScript's structural type system
- **Runtime safety** — collision detection, no prototype pollution
- **Familiarity** — same pattern as Express middleware or Mongoose plugins

### Architecture for Internal Refactoring

Internally, you could also refactor `TyneqEnumerableBase` to use `defineOperator` for its own operators. This would:
1. Eliminate the 65-import header
2. Split the 1806-line god class into per-operator modules
3. Keep the same public API

```ts
// src/operators/streaming/where.register.ts
import { defineOperator } from '../../extensibility/defineOperator';
import { WhereOperatorEnumerable } from './where';

defineOperator({
    name: 'where',
    factory(source, predicate) {
        return new WhereOperatorEnumerable(source, predicate);
    }
});
```

Then `TyneqEnumerableBase` becomes a thin shell with just `pipe()`, `getEnumerator()`, `[Symbol.iterator]()`, and the abstract factories.

### Auto-Registration: Eliminating Explicit `defineOperator()` Calls

The `defineOperator()` API above requires every operator to make an explicit registration call.
This section explores ways to make registration **implicit** — defining an operator should
automatically make it available on the chain, with zero manual wiring.

#### The Fundamental Constraint

JavaScript modules are inert until imported. There is no "auto-discovery" mechanism in ESM
or CJS — if a file isn't imported, its code never runs. This means any solution
must either:

1. **Co-locate registration with definition** — the operator file registers itself as a side effect of being imported
2. **Use a barrel import** — a central file imports all operator files, triggering registration
3. **Apply at class definition time** — decorators or static blocks that run when the class is evaluated

The question is: **how little boilerplate can we get away with**, and **how maintainable is it at scale?**

---

#### Approach A: TC39 Class Decorators — `@operator('where')`

TC39 class decorators (TypeScript 5.0+, esbuild 0.21+) run at class definition time.
A decorator on the operator class can register it on `TyneqEnumerableBase.prototype`
automatically — defining the class IS the registration.

```ts
// ─── src/extensibility/operatorDecorators.ts ──────────────────────────

import { TyneqEnumerableBase } from '../core/TyneqEnumerableBase';
import type { TyneqOperatorEnumerable } from '../core/operator/TyneqOperatorEnumerable';
import type { TyneqTerminalOperator } from '../core/operator/TyneqTerminalOperator';

/**
 * Registers a streaming/buffering operator on TyneqEnumerableBase.
 * The decorated class must extend TyneqOperatorEnumerable<TSource, TResult>.
 * 
 * Constructor contract: (source: IEnumerable<TSource>, ...userArgs: TArgs)
 * The source is injected automatically — users only pass the remaining args.
 */
export function operator(name: string) {
    return function <TClass extends new (...args: any[]) => any>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        const proto = TyneqEnumerableBase.prototype as any;

        if (proto[name] !== undefined) {
            throw new Error(`Operator '${name}' is already defined.`);
        }

        proto[name] = function (this: TyneqEnumerableBase<any>, ...userArgs: any[]) {
            // Operator constructors take (source, ...args); source = this
            const op = new target(this, ...userArgs);
            return (this as any).createEnumerable(op);
        };

        return target;
    };
}

/**
 * Registers a terminal operator on TyneqEnumerableBase.
 * The decorated class must extend TyneqTerminalOperator<TSource, TResult>.
 * Calls .process() automatically.
 */
export function terminal(name: string) {
    return function <TClass extends new (...args: any[]) => { process(): any }>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        const proto = TyneqEnumerableBase.prototype as any;

        if (proto[name] !== undefined) {
            throw new Error(`Terminal operator '${name}' is already defined.`);
        }

        proto[name] = function (this: TyneqEnumerableBase<any>, ...userArgs: any[]) {
            const op = new target(this, ...userArgs);
            return op.process();
        };

        return target;
    };
}
```

**Usage — Library Operator (streaming):**

```ts
// src/operators/streaming/where.ts — ONE LINE added, everything else unchanged

import { operator } from '../../extensibility/operatorDecorators';
import { TyneqOperatorEnumerable } from '../../core/operator/TyneqOperatorEnumerable';
import { WhereEnumerator } from '../../enumerators/streaming/where';

@operator('where')   // ← THIS IS THE ENTIRE REGISTRATION
export class WhereOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    private readonly predicate: (item: TSource) => boolean;

    public constructor(source: IEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        this.predicate = predicate;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new WhereEnumerator<TSource>(this.source[Symbol.iterator](), this.predicate);
    }
}
```

**Usage — Library Terminal Operator:**

```ts
// src/operators/terminal/count.ts

import { terminal } from '../../extensibility/operatorDecorators';
import { TyneqTerminalOperator } from '../../core/operator/TyneqTerminalOperator';

@terminal('count')   // ← ONE LINE
export class CountOperator<T> extends TyneqTerminalOperator<T, number> {
    public constructor(source: IEnumerable<T>) {
        super(source);
    }

    public process(): number {
        if (Array.isArray(this.source)) return (this.source as T[]).length;
        let count = 0;
        for (const _ of this.source) count++;
        return count;
    }
}
```

**Usage — External Developer:**

```ts
// userland: my-operators/scan.ts

import { operator } from 'tyneq/extensibility';
import { TyneqOperatorEnumerable } from 'tyneq';

@operator('scan')
class ScanOperatorEnumerable<T, TAcc> extends TyneqOperatorEnumerable<T, TAcc> {
    constructor(source, private seed: TAcc, private acc: (a: TAcc, i: T) => TAcc) {
        super(source);
    }
    getEnumerator() { /* ... */ }
}

// Module augmentation for types
declare module 'tyneq' {
    interface ITyneqEnumerable<TSource> {
        scan<TAcc>(seed: TAcc, acc: (a: TAcc, item: TSource) => TAcc): ITyneqEnumerable<TAcc>;
    }
}
```

**How TyneqEnumerableBase gets slimmed down:**

```ts
// BEFORE: 1806-line god class with 65 imports
import { WhereOperatorEnumerable } from "../operators/streaming/where";
import { SelectOperatorEnumerable } from "../operators/streaming/select";
// ... 63 more imports ...

export abstract class TyneqEnumerableBase<TSource> {
    public where(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return new WhereOperatorEnumerable<TSource>(this, predicate)...
    }
    public select<TResult>(selector: ...): ITyneqEnumerable<TResult> { ... }
    // ... 63 more method bodies ...
}

// AFTER: ~80-line thin shell
export abstract class TyneqEnumerableBase<TSource> {
    public [Symbol.iterator](): IEnumerator<TSource> { return this.getEnumerator(); }
    public abstract getEnumerator(): IEnumerator<TSource>;
    public pipe<TResult>(...): ITyneqEnumerable<TResult> { ... }
    protected abstract createEnumerable<TResult>(...): ITyneqEnumerable<TResult>;
    protected abstract createOrderedEnumerable<TKey>(...): ITyneqOrderedEnumerable<TSource>;
    protected abstract createCachedEnumerable(...): ITyneqCachedEnumerable<TSource>;
    // ALL operator methods injected by @operator / @terminal decorators at import time
}
```

The barrel file ensures all operators are imported (and thus registered):

```ts
// src/operators/index.ts (barrel — importing this triggers all registrations)
import './streaming/where';
import './streaming/select';
import './streaming/selectMany';
import './buffer/distinct';
import './terminal/count';
import './terminal/toArray';
// ... all operators
```

```ts
// src/index.ts — import the barrel
import './operators';  // side-effect import → all decorators fire
export * from './core/TyneqEnumerableBase';
export * from './core/TyneqEnumerable';
// ...
```

| Aspect | Rating |
|--------|--------|
| Boilerplate per operator | ★★★★★ — one `@operator('name')` line |
| Maintenance | ★★★★★ — operator logic + registration co-located |
| Type safety | ★★★★☆ — runtime registration untyped; module augmentation needed for TS |
| Performance | ★★★★★ — one-time prototype assignment at import; zero runtime overhead |
| External DX | ★★★★☆ — extend base class + decorate; familiar to Angular/NestJS devs |
| Tree-shaking | ★★★☆☆ — side-effect imports prevent tree-shaking individual operators |
| Build tool support | ★★★★☆ — TS 5.0+, esbuild 0.21+, SWC, Babel; no `experimentalDecorators` needed |

**Key advantage**: Zero change to existing operator class code — just add the decorator line.
The constructor signature `(source, ...userArgs)` is already the convention.

---

#### Approach B: Functional `createOperator()` — No Classes Needed

A factory function that defines the operator and registers it in one call.
No class inheritance required — ideal for simple operators or generators.

```ts
// ─── src/extensibility/createOperator.ts ──────────────────────────────

import { TyneqEnumerableBase } from '../core/TyneqEnumerableBase';
import type { IEnumerable, IEnumerator, IEnumeratorFactory } from '../types/core';

/**
 * Defines and registers a streaming/buffering operator in a single call.
 * No class needed — provide an enumerator factory function.
 * 
 * The factory receives (source, ...args) and returns an IEnumeratorFactory.
 * Registration happens immediately when the module is evaluated.
 */
export function createOperator<TSource, TResult, TArgs extends any[]>(config: {
    name: string;
    factory: (source: IEnumerable<TSource>, ...args: TArgs) => IEnumeratorFactory<TResult>;
}): void {
    const proto = TyneqEnumerableBase.prototype as any;
    if (proto[config.name] !== undefined) {
        throw new Error(`Operator '${config.name}' is already defined.`);
    }
    proto[config.name] = function (this: TyneqEnumerableBase<TSource>, ...args: TArgs) {
        const factory = config.factory(this as any, ...args);
        return (this as any).createEnumerable(factory);
    };
}

/**
 * Shorthand: define a streaming operator using a generator function.
 * 
 * The generator receives (source, ...args) and yields result elements.
 * This is the lowest-ceremony way to define an operator.
 */
export function createGeneratorOperator<TSource, TResult, TArgs extends any[]>(config: {
    name: string;
    generator: (source: Iterable<TSource>, ...args: TArgs) => IterableIterator<TResult>;
}): void {
    createOperator({
        name: config.name,
        factory(source, ...args) {
            return {
                getEnumerator: () => config.generator(source, ...args) as IEnumerator<TResult>
            };
        }
    });
}

/**
 * Defines and registers a terminal operator in a single call.
 */
export function createTerminalOperator<TSource, TResult, TArgs extends any[]>(config: {
    name: string;
    execute: (source: IEnumerable<TSource>, ...args: TArgs) => TResult;
}): void {
    const proto = TyneqEnumerableBase.prototype as any;
    if (proto[config.name] !== undefined) {
        throw new Error(`Terminal operator '${config.name}' is already defined.`);
    }
    proto[config.name] = function (this: TyneqEnumerableBase<TSource>, ...args: TArgs) {
        return config.execute(this as any, ...args);
    };
}
```

**Usage — Library Internal (simple operator):**

```ts
// src/operators/streaming/where.ts

import { createOperator } from '../../extensibility/createOperator';
import { WhereEnumerator } from '../../enumerators/streaming/where';

// Self-registering: importing this file = operator available
createOperator({
    name: 'where',
    factory(source, predicate: (item: any) => boolean) {
        return {
            getEnumerator: () => new WhereEnumerator(source[Symbol.iterator](), predicate)
        };
    }
});
```

**Usage — External Developer (generator shorthand):**

```ts
// my-operators/scan.ts — 12 lines total

import { createGeneratorOperator } from 'tyneq/extensibility';

createGeneratorOperator({
    name: 'scan',
    *generator(source, seed: any, accumulator: (acc: any, item: any) => any) {
        let acc = seed;
        for (const item of source) {
            acc = accumulator(acc, item);
            yield acc;
        }
    }
});

declare module 'tyneq' {
    interface ITyneqEnumerable<TSource> {
        scan<TAcc>(seed: TAcc, acc: (a: TAcc, item: TSource) => TAcc): ITyneqEnumerable<TAcc>;
    }
}
```

```ts
// Using it:
import 'my-operators/scan';    // side-effect import → registered
import { Tyneq } from 'tyneq';

Tyneq.from([1, 2, 3, 4, 5]).scan(0, (a, n) => a + n).toArray();
// [1, 3, 6, 10, 15]
```

| Aspect | Rating |
|--------|--------|
| Boilerplate per operator | ★★★★☆ — one function call, no class needed |
| Maintenance | ★★★★☆ — co-located, but registration and logic mixed in one blob |
| Type safety | ★★★☆☆ — factory args loosely typed; module augmentation needed |
| Performance | ★★★★★ — same one-time prototype assignment |
| External DX | ★★★★★ — simplest API; generator shorthand requires zero framework knowledge |
| Tree-shaking | ★★★☆☆ — same side-effect import constraint |
| Build tool support | ★★★★★ — works everywhere, no special features needed |

**Key advantage**: Lowest ceremony for simple operators. External developers don't
need to understand `TyneqOperatorEnumerable`, `IEnumeratorFactory`, or class inheritance.
Just write a generator.

---

#### Approach C: Static Initializer Blocks (ES2022 Class Feature)

Each operator class self-registers via a `static { }` block that runs 
when the class is evaluated — the registration is literally inside the class body.

```ts
// src/operators/streaming/where.ts

import { TyneqEnumerableBase } from '../../core/TyneqEnumerableBase';

export class WhereOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    // ... existing fields, constructor, getEnumerator() ...

    // Self-registration inside the class body
    static {
        const proto = TyneqEnumerableBase.prototype as any;
        proto['where'] = function (this: any, predicate: (item: any) => boolean) {
            return (this as any).createEnumerable(
                new WhereOperatorEnumerable(this, predicate)
            );
        };
    }
}
```

| Aspect | Rating |
|--------|--------|
| Boilerplate per operator | ★★★★☆ — ~5-line static block per class |
| Maintenance | ★★★★★ — everything inside the class, no external coupling |
| Type safety | ★★★☆☆ — same `any` casting as other approaches |
| Performance | ★★★★★ — identical prototype assignment |
| External DX | ★★★☆☆ — requires extending base classes |
| Tree-shaking | ★★★☆☆ — side-effect constraint again |
| Build tool support | ★★★★☆ — requires ES2022 target or downlevel transform; esbuild/SWC support it |

**Downside**: Static blocks require `target: "es2022"` or higher (current config is `es2019`).
TypeScript supports the syntax regardless, but emitted code needs runtime support.
This can be worked around with esbuild's downlevel transforms in tsup.

---

#### Approach D: Hybrid — Decorators for Library, `createOperator()` for External

The approaches aren't mutually exclusive. The optimal architecture uses **different layers
for different audiences**:

| Audience | Mechanism | Reason |
|----------|-----------|--------|
| **Library internals** | `@operator('name')` decorator | Co-located, structured, leverages existing class hierarchy |
| **External: advanced** | `defineOperator()` with class | Full control, custom enumerators, performance tuning |
| **External: simple** | `createGeneratorOperator()` | Minimal ceremony, just write a generator |
| **External: one-off** | `.pipe()` (already exists) | No registration at all, inline transform |

This gives a **progressive disclosure** API:

```
Simplicity                                                    Power
─────────────────────────────────────────────────────────────────────►
  .pipe()          createGenerator()      defineOperator()    @operator()
  (inline,         (function,             (class-based,       (decorator,
   no types)        generator)             reusable)           library-grade)
```

**Complete example — how all layers coexist:**

```ts
// ─── Layer 1: pipe() — no registration ────────────────────────────────
// User writes inline, no type augmentation, no reusability
Tyneq.from([1, 2, 3])
    .pipe(function* (source) {
        for (const item of source) yield item * 2;
    })
    .toArray();  // [2, 4, 6]


// ─── Layer 2: createGeneratorOperator() — lightweight, reusable ───────
// One function call, generator-based, auto-registered on import
createGeneratorOperator({
    name: 'scan',
    *generator(source, seed, acc) {
        let s = seed;
        for (const item of source) { s = acc(s, item); yield s; }
    }
});


// ─── Layer 3: defineOperator() — class-based, full control ────────────
// For complex operators that need custom enumerators
defineOperator({
    name: 'window',
    factory(source, size) {
        return new WindowOperatorEnumerable(source, size);
    }
});


// ─── Layer 4: @operator() — library-grade, structured ─────────────────
// For tyneq's own operators and advanced external operators
@operator('batchAsync')
class BatchAsyncOperatorEnumerable<T> extends TyneqOperatorEnumerable<T, T[]> {
    // Full class with validation, documentation, custom enumerator
}
```

---

#### Performance Comparison

All approaches have **identical runtime performance** — they all do the same thing under the hood:
assign a function to `TyneqEnumerableBase.prototype[name]`. The differences are only at
**module load time** (one-time cost).

| Approach | Load-time Cost | Runtime Cost | Memory |
|----------|---------------|--------------|--------|
| `@operator()` decorator | ~0.01ms per operator (decorator call + prototype assignment) | Zero overhead vs. current | Same |
| `createOperator()` function | ~0.01ms per operator (function call + prototype assignment) | Zero overhead | Same |
| `static { }` block | ~0.01ms per operator (same assignment) | Zero overhead | Same |
| Current god class | ~0.02ms (65 imports parsed; methods defined in class body) | Baseline | Same |

For 65 operators, the total registration overhead is **< 1ms** — negligible.

---

#### Maintainability Comparison for Library Refactoring

The key question: which approach best eliminates the 1806-line `TyneqEnumerableBase` 
while keeping things manageable?

**Current state** (one file touches everything):
```
TyneqEnumerableBase.ts    1806 lines    65 imports    All operator logic
src/types/core.ts          977 lines    ITyneqEnumerable interface (all signatures)
```

**With @operator decorators** (each operator is self-contained):
```
TyneqEnumerableBase.ts      ~80 lines   0 operator imports   Shell class only
operators/streaming/where.ts  ~50 lines   @operator('where')   Complete + registered
operators/terminal/count.ts   ~40 lines   @terminal('count')   Complete + registered
src/operators/index.ts        ~65 lines   Barrel of imports    Triggers registration
src/types/core.ts            977 lines   ITyneqEnumerable     Type signatures only
```

**With createOperator()** (functional, per-file):
```
TyneqEnumerableBase.ts      ~80 lines   0 operator imports   Shell class only
operators/streaming/where.ts  ~40 lines   createOperator()     Factory + registration
operators/terminal/count.ts   ~30 lines   createTerminal()     Factory + registration
src/operators/index.ts        ~65 lines   Barrel of imports    Triggers registration
src/types/core.ts            977 lines   ITyneqEnumerable     Type signatures only
```

Both approaches eliminate the god class. The decorator approach preserves the existing
class hierarchy (good for complex operators with custom enumerators). The functional
approach is simpler but loses the structure of `TyneqOperatorEnumerable` / `TyneqTerminalOperator`.

---

#### Module Augmentation: The Unavoidable TypeScript Tax

Regardless of approach, **TypeScript module augmentation is always needed** for the
type system to know about the new method. This is fundamental to TypeScript — you 
cannot dynamically add typed methods to a class prototype without it.

For **library-provided operators**, this isn't a problem — the types are already
declared in `ITyneqEnumerable` in `core.ts`. The decorator/factory just handles
the *runtime* registration that was previously in `TyneqEnumerableBase`.

For **external operators**, the user must write a `declare module 'tyneq'` block.
This is unavoidable with any approach — even decorators can't augment interfaces.

One DX improvement: provide a **type helper** so external devs don't need to know 
the exact interface name:

```ts
// tyneq/extensibility
export type ExtendTyneq<T> = ITyneqEnumerable<T>;

// External usage — slightly friendlier
declare module 'tyneq' {
    interface ITyneqEnumerable<TSource> {
        scan<TAcc>(seed: TAcc, acc: (a: TAcc, item: TSource) => TAcc): ITyneqEnumerable<TAcc>;
    }
}
```

---

#### Recommendation for `defineOperator()` Evolution

**Use the Hybrid approach (Approach D):**

1. **Add `@operator()` and `@terminal()` TC39 class decorators** for library maintainers
   and advanced external developers. These co-locate registration with the operator class.

2. **Add `createGeneratorOperator()`** for external developers who want a zero-ceremony
   functional API using generators.

3. **Keep `defineOperator()` and `defineTerminalOperator()`** as the mid-level API
   for class-based external operators that don't want to extend `TyneqOperatorEnumerable`.

4. **Keep `pipe()`** as the no-registration escape hatch for inline one-offs.

5. **Internally refactor** `TyneqEnumerableBase`:
   - Move all operator methods out of the class body
   - Add `@operator` / `@terminal` decorators to existing operator classes
   - Add a barrel import (`src/operators/index.ts`) to the library entry point
   - `TyneqEnumerableBase` shrinks from 1806 lines to ~80 lines
   - `ITyneqEnumerable` in `core.ts` stays unchanged (types remain there)

**Why TC39 decorators over the alternatives:**

| Factor | `@operator()` | `createOperator()` | `static { }` |
|--------|--------------|-------------------|---------------|
| Change to existing operator classes | +1 line (decorator) | Rewrite to functional | +5 lines |
| Preserves class hierarchy | ✅ Yes | ❌ No | ✅ Yes |
| Preserves JSDoc/documentation | ✅ Yes | ❌ Must move docs | ✅ Yes |
| Build requirement | TS 5.0+, esbuild 0.21+ | None | ES2022 target |
| Familiar pattern | Angular, NestJS, MobX | RxJS `pipe` | Raw JS (less common) |

TC39 class decorators are the right fit because:
- They're **standard** (not experimental like parameter decorators)
- They leave existing operator code **completely untouched** — just add one line
- The library already uses **TypeScript 5+** and **esbuild** via tsup
- They're the most **idiomatic** pattern for "metadata/behavior attached to a class"

---

## 3. `ValidationEnumerable` — Validation Pipeline

### Concept

Like `CachedEnumerable` adds `.refresh()` and `OrderedEnumerable` adds `.thenBy()`, a `ValidationEnumerable` adds **validation-specific operators** that build a validation pipeline. Inspired by Zod's composable schema design but applied to sequences.

The key insight: **validation is a pipeline too** — each check is a deferred rule that executes lazily over elements when you "run" the validation.

### Interface

```ts
// ─── New: src/types/core.ts — Module Augmentation ─────────────────────

/**
 * A validation pipeline over a sequence of elements.
 * 
 * Created via `.validate()` on any ITyneqEnumerable. Rules are composed lazily
 * and execute only when a terminal validation method is called.
 * 
 * Design philosophy: Each method returns `this` (or a new ValidationEnumerable)
 * to enable fluent chaining, similar to Zod's `.string().min(3).max(20)`.
 */
export interface ITyneqValidationEnumerable<TSource> extends ITyneqEnumerable<TSource> {

    // ═══════════════════════════════════════════════════════════════════
    // ELEMENT-LEVEL RULES (applied to each element individually)
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Require every element to satisfy a predicate.
     * 
     * @param predicate - Test function per element.
     * @param message - Error message if any element fails.
     * 
     * @example
     * ```ts
     * Tyneq.from(users)
     *     .validate()
     *     .ensure(u => u.age >= 18, 'All users must be adults')
     *     .run(); // throws ValidationError if any user.age < 18
     * ```
     */
    ensure(predicate: (item: TSource) => boolean, message?: string): ITyneqValidationEnumerable<TSource>;

    /**
     * Require every element to NOT satisfy a predicate (inverse of ensure).
     */
    forbid(predicate: (item: TSource) => boolean, message?: string): ITyneqValidationEnumerable<TSource>;

    /**
     * Validate a specific property/key of each element.
     * Returns a nested validation context scoped to that property.
     * 
     * @example
     * ```ts
     * Tyneq.from(users)
     *     .validate()
     *     .forProperty('email', email => email
     *         .ensure(e => e.includes('@'), 'Invalid email format')
     *         .ensure(e => e.length <= 255, 'Email too long')
     *     )
     *     .run();
     * ```
     */
    forProperty<K extends keyof TSource>(
        key: K,
        configure: (ctx: IPropertyValidationContext<TSource[K]>) => void
    ): ITyneqValidationEnumerable<TSource>;

    /**
     * Apply a transformation to each element before subsequent rules.
     * Useful for normalization before validation.
     * 
     * @example
     * ```ts
     * Tyneq.from(emails)
     *     .validate()
     *     .transform(e => e.trim().toLowerCase())
     *     .ensure(e => e.includes('@'))
     *     .run();
     * ```
     */
    transform<TResult>(selector: (item: TSource) => TResult): ITyneqValidationEnumerable<TResult>;

    /**
     * Apply a predefined validation schema (reusable rule sets).
     * 
     * @example
     * ```ts
     * const emailSchema = ValidationSchema.create<string>()
     *     .ensure(e => e.includes('@'), 'Must contain @')
     *     .ensure(e => e.length <= 255, 'Too long');
     * 
     * Tyneq.from(emails).validate().applySchema(emailSchema).run();
     * ```
     */
    applySchema(schema: IValidationSchema<TSource>): ITyneqValidationEnumerable<TSource>;

    // ═══════════════════════════════════════════════════════════════════
    // SEQUENCE-LEVEL RULES (applied to the sequence as a whole)
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Require the sequence to contain at least `min` elements.
     */
    minCount(min: number, message?: string): ITyneqValidationEnumerable<TSource>;

    /**
     * Require the sequence to contain at most `max` elements.
     */
    maxCount(max: number, message?: string): ITyneqValidationEnumerable<TSource>;

    /**
     * Require the sequence to contain exactly `count` elements.
     */
    exactCount(count: number, message?: string): ITyneqValidationEnumerable<TSource>;

    /**
     * Require the sequence to be non-empty.
     */
    notEmpty(message?: string): ITyneqValidationEnumerable<TSource>;

    /**
     * Require all elements to be unique (by identity or key).
     */
    unique(message?: string): ITyneqValidationEnumerable<TSource>;
    unique<K>(keySelector: (item: TSource) => K, message?: string): ITyneqValidationEnumerable<TSource>;

    /**
     * Require the sequence to be sorted (ascending by default).
     */
    sorted(comparer?: (a: TSource, b: TSource) => number, message?: string): ITyneqValidationEnumerable<TSource>;

    // ═══════════════════════════════════════════════════════════════════
    // TERMINAL VALIDATION METHODS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Execute all validation rules. Throws `ValidationError` on first failure.
     * Short-circuits: stops at the first failing element/rule.
     * 
     * @returns The original sequence (pass-through) if all rules pass.
     */
    run(): ITyneqEnumerable<TSource>;

    /**
     * Execute all validation rules and collect ALL errors (no short-circuit).
     * Returns a ValidationResult with detailed error information.
     * 
     * @example
     * ```ts
     * const result = Tyneq.from(users)
     *     .validate()
     *     .ensure(u => u.age >= 0, 'Age must be non-negative')
     *     .ensure(u => u.name.length > 0, 'Name cannot be empty')
     *     .runAll();
     * 
     * if (!result.isValid) {
     *     for (const error of result.errors) {
     *         console.log(`Element ${error.index}: ${error.message}`);
     *     }
     * }
     * ```
     */
    runAll(): IValidationResult<TSource>;

    /**
     * Check if validation passes without throwing.
     * 
     * @returns `true` if all rules pass, `false` otherwise.
     */
    isValid(): boolean;

    /**
     * Filter the sequence to only elements that pass all validation rules.
     * Returns a standard ITyneqEnumerable with failing elements removed.
     * 
     * @example
     * ```ts
     * const validUsers = Tyneq.from(users)
     *     .validate()
     *     .ensure(u => u.age >= 18)
     *     .ensure(u => u.email.includes('@'))
     *     .whereValid()
     *     .toArray();
     * ```
     */
    whereValid(): ITyneqEnumerable<TSource>;

    /**
     * Partition the sequence into valid and invalid elements.
     * 
     * @example
     * ```ts
     * const { valid, invalid } = Tyneq.from(data)
     *     .validate()
     *     .ensure(d => d.value > 0)
     *     .partition();
     * ```
     */
    partition(): IValidationPartition<TSource>;
}

// ─── Supporting types ────────────────────────────────────────────────

/** Context for validating a single property of each element. */
export interface IPropertyValidationContext<T> {
    ensure(predicate: (value: T) => boolean, message?: string): IPropertyValidationContext<T>;
    forbid(predicate: (value: T) => boolean, message?: string): IPropertyValidationContext<T>;
}

/** A reusable, composable validation schema. */
export interface IValidationSchema<T> {
    readonly rules: ReadonlyArray<IValidationRule<T>>;
}

/** A single validation rule. */
export interface IValidationRule<T> {
    readonly type: 'element' | 'sequence';
    readonly message: string;
    test(item: T, index: number): boolean;
}

/** Result of runAll() — collects all errors. */
export interface IValidationResult<T> {
    readonly isValid: boolean;
    readonly errors: ReadonlyArray<IValidationError<T>>;
    readonly validCount: number;
    readonly invalidCount: number;
}

/** A single validation error with context. */
export interface IValidationError<T> {
    readonly index: number;
    readonly element: T;
    readonly rule: string;
    readonly message: string;
    readonly path?: string;  // property path for forProperty() errors
}

/** Result of partition() — separates valid from invalid. */
export interface IValidationPartition<T> {
    readonly valid: ITyneqEnumerable<T>;
    readonly invalid: ITyneqEnumerable<T>;
    readonly errors: ReadonlyArray<IValidationError<T>>;
}
```

### Implementation Sketch

```ts
// ─── New: src/core/validation/TyneqValidationEnumerable.ts ───────────

import { TyneqEnumerableBase } from '../TyneqEnumerableBase';
import { TyneqEnumerable } from '../TyneqEnumerable';
import type {
    IEnumerator, IEnumeratorFactory,
    ITyneqEnumerable, ITyneqOrderedEnumerable, ITyneqCachedEnumerable,
    ITyneqValidationEnumerable, IValidationRule, IValidationResult,
    IValidationError, IValidationPartition, IPropertyValidationContext,
    IValidationSchema
} from '../../types/core';
import { TyneqOrderedEnumerable } from '../ordering/TyneqOrderedEnumerable';
import { TyneqCachedEnumerable } from '../cache/TyneqCachedEnumerable';
import { ValidationError } from '../errors/ValidationError';

type Rule<T> = {
    type: 'element' | 'sequence';
    message: string;
    test: (item: T, index: number) => boolean;
    path?: string;
};

export class TyneqValidationEnumerable<TSource>
    extends TyneqEnumerableBase<TSource>
    implements ITyneqValidationEnumerable<TSource>
{
    private readonly source: ITyneqEnumerable<TSource>;
    private readonly rules: Rule<TSource>[] = [];
    private readonly sequenceRules: Array<{
        type: 'minCount' | 'maxCount' | 'exactCount' | 'notEmpty' | 'unique' | 'sorted';
        message: string;
        config: any;
    }> = [];

    public constructor(source: ITyneqEnumerable<TSource>, rules?: Rule<TSource>[]) {
        super();
        this.source = source;
        if (rules) this.rules.push(...rules);
    }

    // ── IEnumerable implementation ────────────────────────────────────

    public getEnumerator(): IEnumerator<TSource> {
        return this.source.getEnumerator();
    }

    protected createEnumerable<TResult>(factory: IEnumeratorFactory<TResult>): ITyneqEnumerable<TResult> {
        return new TyneqEnumerable<TResult>(factory);
    }

    protected createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean
    ): ITyneqOrderedEnumerable<TSource> {
        return new TyneqOrderedEnumerable<TSource, TKey>(this, keySelector, comparer, descending);
    }

    protected createCachedEnumerable(source: ITyneqEnumerable<TSource>): ITyneqCachedEnumerable<TSource> {
        return new TyneqCachedEnumerable<TSource>(source);
    }

    // ── Validation rule builders ──────────────────────────────────────

    public ensure(predicate: (item: TSource) => boolean, message?: string): ITyneqValidationEnumerable<TSource> {
        const newRules = [...this.rules, {
            type: 'element' as const,
            message: message ?? 'Validation failed',
            test: (item: TSource, _index: number) => predicate(item),
        }];
        return new TyneqValidationEnumerable(this.source, newRules);
    }

    public forbid(predicate: (item: TSource) => boolean, message?: string): ITyneqValidationEnumerable<TSource> {
        return this.ensure(item => !predicate(item), message ?? 'Forbidden condition matched');
    }

    public forProperty<K extends keyof TSource>(
        key: K,
        configure: (ctx: IPropertyValidationContext<TSource[K]>) => void
    ): ITyneqValidationEnumerable<TSource> {
        // Collect property-level rules via a builder
        const propertyRules: Array<{ predicate: (v: TSource[K]) => boolean; message: string }> = [];

        const ctx: IPropertyValidationContext<TSource[K]> = {
            ensure(predicate, msg) {
                propertyRules.push({ predicate, message: msg ?? `Property '${String(key)}' validation failed` });
                return ctx;
            },
            forbid(predicate, msg) {
                propertyRules.push({ predicate: v => !predicate(v), message: msg ?? `Property '${String(key)}' forbidden condition` });
                return ctx;
            }
        };

        configure(ctx);

        // Convert property rules to element-level rules with path info
        const elementRules: Rule<TSource>[] = propertyRules.map(pr => ({
            type: 'element' as const,
            message: pr.message,
            test: (item: TSource) => pr.predicate(item[key]),
            path: String(key),
        }));

        return new TyneqValidationEnumerable(this.source, [...this.rules, ...elementRules]);
    }

    public transform<TResult>(selector: (item: TSource) => TResult): ITyneqValidationEnumerable<TResult> {
        const transformedSource = this.source.select(selector);
        // Rules cannot carry over since the type changed — start fresh
        return new TyneqValidationEnumerable<TResult>(transformedSource);
    }

    public applySchema(schema: IValidationSchema<TSource>): ITyneqValidationEnumerable<TSource> {
        const schemaRules: Rule<TSource>[] = schema.rules.map(r => ({
            type: r.type,
            message: r.message,
            test: r.test,
        }));
        return new TyneqValidationEnumerable(this.source, [...this.rules, ...schemaRules]);
    }

    public minCount(min: number, message?: string): ITyneqValidationEnumerable<TSource> {
        const clone = new TyneqValidationEnumerable(this.source, [...this.rules]);
        clone.sequenceRules.push({
            type: 'minCount', message: message ?? `Sequence must contain at least ${min} elements`, config: { min }
        });
        return clone;
    }

    public maxCount(max: number, message?: string): ITyneqValidationEnumerable<TSource> {
        const clone = new TyneqValidationEnumerable(this.source, [...this.rules]);
        clone.sequenceRules.push({
            type: 'maxCount', message: message ?? `Sequence must contain at most ${max} elements`, config: { max }
        });
        return clone;
    }

    public exactCount(count: number, message?: string): ITyneqValidationEnumerable<TSource> {
        const clone = new TyneqValidationEnumerable(this.source, [...this.rules]);
        clone.sequenceRules.push({
            type: 'exactCount', message: message ?? `Sequence must contain exactly ${count} elements`, config: { count }
        });
        return clone;
    }

    public notEmpty(message?: string): ITyneqValidationEnumerable<TSource> {
        return this.minCount(1, message ?? 'Sequence must not be empty');
    }

    public unique(messageOrKeySelector?: string | ((item: TSource) => unknown), message?: string): ITyneqValidationEnumerable<TSource> {
        const clone = new TyneqValidationEnumerable(this.source, [...this.rules]);
        const ks = typeof messageOrKeySelector === 'function' ? messageOrKeySelector : undefined;
        const msg = typeof messageOrKeySelector === 'string' ? messageOrKeySelector : message;
        clone.sequenceRules.push({
            type: 'unique', message: msg ?? 'All elements must be unique', config: { keySelector: ks }
        });
        return clone;
    }

    public sorted(comparer?: (a: TSource, b: TSource) => number, message?: string): ITyneqValidationEnumerable<TSource> {
        const clone = new TyneqValidationEnumerable(this.source, [...this.rules]);
        clone.sequenceRules.push({
            type: 'sorted', message: message ?? 'Sequence must be sorted', config: { comparer }
        });
        return clone;
    }

    // ── Terminal validation methods ───────────────────────────────────

    public run(): ITyneqEnumerable<TSource> {
        let index = 0;
        for (const item of this.source) {
            for (const rule of this.rules) {
                if (rule.type === 'element' && !rule.test(item, index)) {
                    throw new ValidationError(rule.message, index, item, rule.path);
                }
            }
            index++;
        }
        this.runSequenceRules(index);
        return this.source;
    }

    public runAll(): IValidationResult<TSource> {
        const errors: IValidationError<TSource>[] = [];
        let index = 0;
        let validCount = 0;

        for (const item of this.source) {
            let elementValid = true;
            for (const rule of this.rules) {
                if (rule.type === 'element' && !rule.test(item, index)) {
                    elementValid = false;
                    errors.push({
                        index,
                        element: item,
                        rule: rule.type,
                        message: rule.message,
                        path: rule.path,
                    });
                }
            }
            if (elementValid) validCount++;
            index++;
        }

        // Sequence-level rules
        this.collectSequenceErrors(index, errors);

        return {
            isValid: errors.length === 0,
            errors,
            validCount,
            invalidCount: index - validCount,
        };
    }

    public isValid(): boolean {
        try {
            this.run();
            return true;
        } catch {
            return false;
        }
    }

    public whereValid(): ITyneqEnumerable<TSource> {
        const rules = this.rules.filter(r => r.type === 'element');
        return this.source.where(item =>
            rules.every((rule, i) => rule.test(item, i))
        );
    }

    public partition(): IValidationPartition<TSource> {
        const result = this.runAll();
        const failingIndices = new Set(result.errors.map(e => e.index));
        const source = this.source.toArray(); // buffer once

        const validItems = source.filter((_, i) => !failingIndices.has(i));
        const invalidItems = source.filter((_, i) => failingIndices.has(i));

        return {
            valid: new TyneqEnumerable({ getEnumerator: () => validItems[Symbol.iterator]() as any }),
            invalid: new TyneqEnumerable({ getEnumerator: () => invalidItems[Symbol.iterator]() as any }),
            errors: result.errors,
        };
    }

    // ── Private helpers ──────────────────────────────────────────────

    private runSequenceRules(elementCount: number): void {
        for (const rule of this.sequenceRules) {
            switch (rule.type) {
                case 'minCount':
                    if (elementCount < rule.config.min) throw new ValidationError(rule.message);
                    break;
                case 'maxCount':
                    if (elementCount > rule.config.max) throw new ValidationError(rule.message);
                    break;
                case 'exactCount':
                    if (elementCount !== rule.config.count) throw new ValidationError(rule.message);
                    break;
                // unique and sorted require buffering — handled separately
            }
        }
    }

    private collectSequenceErrors(elementCount: number, errors: IValidationError<TSource>[]): void {
        for (const rule of this.sequenceRules) {
            let failed = false;
            switch (rule.type) {
                case 'minCount':
                    failed = elementCount < rule.config.min;
                    break;
                case 'maxCount':
                    failed = elementCount > rule.config.max;
                    break;
                case 'exactCount':
                    failed = elementCount !== rule.config.count;
                    break;
            }
            if (failed) {
                errors.push({
                    index: -1,
                    element: undefined as any,
                    rule: rule.type,
                    message: rule.message,
                });
            }
        }
    }
}
```

### Entry Point: `.validate()` Method

Add to `TyneqEnumerableBase`:

```ts
// In src/core/TyneqEnumerableBase.ts — add method:

/**
 * Creates a validation pipeline over this sequence.
 * 
 * Rules are composed lazily and execute only when a terminal
 * validation method (run, runAll, isValid, etc.) is called.
 * 
 * @returns A ValidationEnumerable with chainable validation rules.
 * 
 * @example
 * ```ts
 * const result = Tyneq.from(users)
 *     .validate()
 *     .ensure(u => u.age >= 18, 'Must be adult')
 *     .forProperty('email', e => e
 *         .ensure(v => v.includes('@'), 'Invalid email')
 *     )
 *     .notEmpty('Need at least one user')
 *     .runAll();
 * ```
 */
public validate(): ITyneqValidationEnumerable<TSource> {
    return this.createValidationEnumerable(this as any);
}

protected abstract createValidationEnumerable(
    source: ITyneqEnumerable<TSource>
): ITyneqValidationEnumerable<TSource>;
```

### ValidationError

```ts
// ─── New: src/core/errors/ValidationError.ts ──────────────────────────

import { TyneqError } from './TyneqError';

/**
 * Thrown when a validation rule fails during .validate().run().
 */
export class ValidationError extends TyneqError {
    public readonly elementIndex?: number;
    public readonly element?: unknown;
    public readonly propertyPath?: string;

    constructor(message: string, elementIndex?: number, element?: unknown, propertyPath?: string) {
        super(message);
        this.elementIndex = elementIndex;
        this.element = element;
        this.propertyPath = propertyPath;
    }
}
```

### Reusable Schemas (Zod-inspired)

```ts
// ─── New: src/core/validation/ValidationSchema.ts ─────────────────────

import type { IValidationSchema, IValidationRule } from '../../types/core';

/**
 * A composable, reusable validation schema.
 * Inspired by Zod's builder pattern but for sequence element validation.
 * 
 * @example
 * ```ts
 * // Define once, reuse everywhere
 * const userSchema = ValidationSchema.create<User>()
 *     .rule(u => u.name.length > 0, 'Name required')
 *     .rule(u => u.age >= 0, 'Age must be non-negative')
 *     .rule(u => u.email.includes('@'), 'Invalid email');
 * 
 * // Apply to any sequence
 * Tyneq.from(apiResponse.users).validate().applySchema(userSchema).run();
 * Tyneq.from(csvParsedUsers).validate().applySchema(userSchema).runAll();
 * ```
 */
export class ValidationSchema<T> implements IValidationSchema<T> {
    public readonly rules: IValidationRule<T>[];

    private constructor(rules: IValidationRule<T>[] = []) {
        this.rules = rules;
    }

    public static create<T>(): ValidationSchema<T> {
        return new ValidationSchema<T>();
    }

    public rule(predicate: (item: T, index: number) => boolean, message: string): ValidationSchema<T> {
        return new ValidationSchema<T>([
            ...this.rules,
            { type: 'element', message, test: predicate }
        ]);
    }

    /** Merge two schemas together. */
    public merge(other: IValidationSchema<T>): ValidationSchema<T> {
        return new ValidationSchema<T>([...this.rules, ...other.rules]);
    }

    /** Create a schema from a Zod-like shape definition. */
    public static shape<T extends Record<string, unknown>>(
        definition: { [K in keyof T]?: Array<{ check: (v: T[K]) => boolean; message: string }> }
    ): ValidationSchema<T> {
        const rules: IValidationRule<T>[] = [];
        for (const [key, checks] of Object.entries(definition) as [keyof T, Array<{ check: (v: any) => boolean; message: string }>][]) {
            if (!checks) continue;
            for (const { check, message } of checks) {
                rules.push({
                    type: 'element',
                    message: `${String(key)}: ${message}`,
                    test: (item: T) => check(item[key]),
                });
            }
        }
        return new ValidationSchema<T>(rules);
    }
}
```

### Complete Usage Example

```ts
import { Tyneq, ValidationSchema } from 'tyneq';

interface User {
    id: number;
    name: string;
    email: string;
    age: number;
    role: 'admin' | 'user' | 'guest';
}

// ── 1. Quick inline validation ──────────────────────────────────────
const users: User[] = await fetchUsers();

Tyneq.from(users)
    .validate()
    .ensure(u => u.age >= 0, 'Age cannot be negative')
    .ensure(u => u.name.trim().length > 0, 'Name required')
    .run();  // throws ValidationError on first failure

// ── 2. Collect all errors ───────────────────────────────────────────
const result = Tyneq.from(users)
    .validate()
    .ensure(u => u.id > 0, 'Invalid ID')
    .forProperty('email', email => email
        .ensure(e => e.includes('@'), 'Must contain @')
        .ensure(e => e.length <= 255, 'Too long')
    )
    .notEmpty('User list cannot be empty')
    .unique(u => u.id, 'Duplicate user IDs')
    .runAll();

if (!result.isValid) {
    console.log(`${result.invalidCount} invalid users:`);
    for (const err of result.errors) {
        console.log(`  [${err.index}] ${err.path ?? ''}: ${err.message}`);
    }
}

// ── 3. Filter to valid only ─────────────────────────────────────────
const validUsers = Tyneq.from(users)
    .validate()
    .ensure(u => u.age >= 18)
    .ensure(u => u.email.includes('@'))
    .whereValid()
    .orderBy(u => u.name)
    .toArray();

// ── 4. Reusable schema (Zod-inspired) ──────────────────────────────
const userSchema = ValidationSchema.shape<User>({
    name: [
        { check: n => n.trim().length > 0, message: 'required' },
        { check: n => n.length <= 100, message: 'max 100 chars' },
    ],
    email: [
        { check: e => e.includes('@'), message: 'invalid format' },
    ],
    age: [
        { check: a => a >= 0, message: 'must be non-negative' },
        { check: a => a <= 150, message: 'unrealistic age' },
    ],
});

Tyneq.from(apiResponse)
    .validate()
    .applySchema(userSchema)
    .run();

// ── 5. Chaining with regular query operators ────────────────────────
const { valid, invalid, errors } = Tyneq.from(rawData)
    .where(d => d.type === 'user')       // filter first (standard operator)
    .validate()                           // enter validation mode
    .ensure(d => d.score > 0)             // validation rule
    .notEmpty()                           // sequence rule
    .partition();                          // split into valid/invalid

const topValid = valid
    .orderByDescending(d => d.score)      // back to standard operators
    .take(10)
    .toArray();
```

### Architecture Summary

```
ITyneqEnumerable<T>
  │
  ├── .validate() → ITyneqValidationEnumerable<T>
  │     │
  │     ├── .ensure()      → ITyneqValidationEnumerable<T>  (element rule)
  │     ├── .forbid()      → ITyneqValidationEnumerable<T>  (element rule)
  │     ├── .forProperty() → ITyneqValidationEnumerable<T>  (scoped rule)
  │     ├── .transform()   → ITyneqValidationEnumerable<R>  (mapped + fresh)
  │     ├── .applySchema() → ITyneqValidationEnumerable<T>  (bulk rules)
  │     ├── .minCount()    → ITyneqValidationEnumerable<T>  (sequence rule)
  │     ├── .maxCount()    → ITyneqValidationEnumerable<T>  (sequence rule)
  │     ├── .notEmpty()    → ITyneqValidationEnumerable<T>  (sequence rule)
  │     ├── .unique()      → ITyneqValidationEnumerable<T>  (sequence rule)
  │     ├── .sorted()      → ITyneqValidationEnumerable<T>  (sequence rule)
  │     │
  │     ├── .run()         → ITyneqEnumerable<T>  (pass-through or throw)
  │     ├── .runAll()      → IValidationResult<T> (collect all errors)
  │     ├── .isValid()     → boolean              (no-throw check)
  │     ├── .whereValid()  → ITyneqEnumerable<T>  (filter to valid)
  │     └── .partition()   → IValidationPartition  (split valid/invalid)
  │
  ├── .memoize() → ITyneqCachedEnumerable<T>
  │     └── .refresh()
  │
  └── .orderBy() → ITyneqOrderedEnumerable<T>
        ├── .thenBy()
        └── .thenByDescending()
```

The `ValidationEnumerable` follows the same pattern as `CachedEnumerable` and `OrderedEnumerable`:
- Extends `TyneqEnumerableBase` (inherits all standard operators)
- Adds domain-specific methods (`ensure`, `run`, `whereValid`)
- Returns to standard `ITyneqEnumerable` via terminal methods (`run()`, `whereValid()`)
- Immutable rule accumulation (each method returns a new instance)

---

## Implementation Priority

| Task | Effort | Impact | Priority |
|------|--------|--------|----------|
| `Arg` utility (§1) | Low — 1 new file + search-and-replace | High — eliminates 94 `nameof` calls, reduces bundle | **P0** |
| `defineOperator()` (§2) | Low — 1 new file, no breaking changes | High — enables ecosystem growth | **P1** |
| `ValidationEnumerable` (§3) | Medium — new subclass, error, schema | Medium — new feature, differentiator | **P2** |
| Internal refactor of god class | High — touches all operator files | Medium — DX improvement, no API change | **P3** |
