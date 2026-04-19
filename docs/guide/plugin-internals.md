# Plugin Internals

This guide is for people who want to understand how operator registration works under the hood, how to build custom sequence types, and how to wire bridge methods that let users enter your custom sequence from a regular one.

If you just want to add a custom operator, start with [Custom Operators](./extensibility.md) -- that covers everything for the common cases. Come back here when you want the full architecture.

---

## How registration works

When you call any registration function (`createGeneratorOperator`, `@operator`, etc.), four things happen in order:

1. **Metadata is created** -- name, kind, category, source (`"internal"` or `"external"`), and the target class to patch onto.
2. **Guards run** -- any guards added via `OperatorRegistry.addGuard` are called synchronously. If a guard throws, registration is aborted.
3. **The entry is stored** in `OperatorRegistry`, keyed by name, with the metadata and the implementation function.
4. **The method is patched** onto the target class's prototype. For standard operators, that is `TyneqEnumerableBase`. For specialized operators, it is `TyneqOrderedEnumerable` or `TyneqCachedEnumerable`.

All of this happens at module import time, as a side effect:

```ts
// Before import: Tyneq.from([]).myOp is undefined
import "./my-plugin/myOp"; // registration runs here
// After import: Tyneq.from([]).myOp is a function
```

---

## Which prototype gets patched

The `targetClass` in `OperatorMetadata` determines where the method lands:

| API / Decorator | Patches prototype of | Available on |
|---|---|---|
| `createGeneratorOperator` | `TyneqEnumerableBase` | All sequences |
| `createOperator` | `TyneqEnumerableBase` | All sequences |
| `createTerminalOperator` | `TyneqEnumerableBase` | All sequences |
| `@operator` | `TyneqEnumerableBase` | All sequences |
| `@terminal` | `TyneqEnumerableBase` | All sequences |
| `createOrderedOperator` | `TyneqOrderedEnumerable` | Ordered sequences only |
| `@orderedOperator` | `TyneqOrderedEnumerable` | Ordered sequences only |
| `createCachedOperator` | `TyneqCachedEnumerable` | Cached sequences only |
| `@cachedOperator` | `TyneqCachedEnumerable` | Cached sequences only |

Since `TyneqOrderedEnumerable` and `TyneqCachedEnumerable` both extend `TyneqEnumerableBase`, they inherit all base-level operators too. The specialized APIs add methods that appear *only* on their subtype. TypeScript enforces this at compile time via the `TyneqOrderedSequence` and `TyneqCachedSequence` interfaces.

---

## The sequence hierarchy

Understanding how sequences work internally is essential for building custom sequence types. Here is the full class hierarchy:

```
TyneqEnumerableCore<T>          (abstract -- adds orderBy, memoize, pipe)
  |
  +-- TyneqEnumerableBase<T>    (abstract -- adds all 60+ operators)
        |
        +-- TyneqEnumerable<T>           (concrete -- standard sequences)
        +-- TyneqOrderedEnumerable<T>    (concrete -- ordered sequences)
        +-- TyneqCachedEnumerable<T>     (concrete -- cached sequences)
```

### Factory methods

The key to extending the hierarchy is three abstract factory methods on `TyneqEnumerableCore`:

```ts
protected abstract createEnumerable<TResult>(
  factory: EnumeratorFactory<TResult>,
  node: Nullable<QueryPlanNode>
): TyneqSequence<TResult>;

protected abstract createOrderedEnumerable<TKey>(
  keySelector: (x: TSource) => TKey,
  comparer: Comparer<TKey>,
  descending: boolean,
  node: Nullable<QueryPlanNode>
): TyneqOrderedSequence<TSource>;

protected abstract createCachedEnumerable(
  source: TyneqSequence<TSource>,
  node: Nullable<QueryPlanNode>
): TyneqCachedSequence<TSource>;
```

Every operator in `TyneqEnumerableBase` delegates to `createEnumerable()` to produce its output sequence. This is what allows different sequence types to control which concrete class gets instantiated.

For example, when you call `.where()` on a `TyneqEnumerable`, it calls `this.createEnumerable(...)` which returns a new `TyneqEnumerable`. When you call `.where()` on a `TyneqOrderedEnumerable`, it calls the same abstract method -- but the ordered class overrides it to return a `TyneqEnumerable` too (ordered-ness does not survive a `where`).

### The SequenceFactory interface

The factory methods are `protected` -- they are not part of the public API. But the registration machinery needs to call them. This is solved via the `SequenceFactory` structural interface:

```ts
// types/core.ts
export interface SequenceFactory<TSource> {
  readonly [tyneqQueryNode]: Nullable<QueryPlanNode>;
  createEnumerable(factory: { getEnumerator(): unknown }, node?: Nullable<QueryPlanNode>): unknown;
  createOrderedEnumerable<TKey>(...): TyneqOrderedSequence<TSource>;
  createCachedEnumerable(...): TyneqCachedSequence<TSource>;
}
```

This is a structural cast -- it works because `TyneqEnumerableBase` has exactly those methods (they are just `protected`). The internal `RegistrationUtility` class centralizes this cast so it appears in one place instead of scattered across all registration functions. The two key helpers it exposes are:

- `RegistrationUtility.buildEnumerable(sequence, name, args, category, factory)` -- validates, builds the query node, and calls `createEnumerable`. Use this for standard operators.
- `RegistrationUtility.buildQueryNode(sequence, name, args, category)` -- builds only the query node. Use this when you need to construct the sequence yourself (ordered/cached operators that need to pass extra context to their enumerator constructor).

---

## How bridge methods work

A "bridge method" is an operator on one sequence type that returns a different sequence type. For example:

- `orderBy()` on a regular sequence returns a `TyneqOrderedSequence`
- `memoize()` on any sequence returns a `TyneqCachedSequence`

Here is how `orderBy` works internally:

```ts
// In TyneqEnumerableCore:
public orderBy<TKey>(keySelector, comparer?): TyneqOrderedSequence<TSource> {
  return this.createOrderedEnumerable(
    keySelector,
    comparer ?? TyneqComparer.defaultComparer,
    false,
    this.createNode("orderBy", "buffer", [keySelector])
  );
}
```

And each subclass overrides `createOrderedEnumerable`:

```ts
// In TyneqEnumerable:
protected createOrderedEnumerable<TKey>(...): TyneqOrderedSequence<TSource> {
  return new TyneqOrderedEnumerable(this, keySelector, comparer, descending, undefined, node);
}
```

The result: calling `.orderBy()` on any sequence produces a `TyneqOrderedEnumerable`, which has `thenBy()` and `thenByDescending()` methods that only ordered sequences carry.

---

## Building a custom sequence type

This is where it gets interesting. Let's build a `ValidatedSequence` -- a sequence that carries a validation function and enforces it on every element.

### Step 1: Define the sequence class

Your custom sequence extends `TyneqEnumerableBase` and implements the three abstract factory methods:

```ts
import { TyneqEnumerableBase } from "tyneq/core"; // internal, see note below
import { TyneqEnumerable } from "tyneq/core";
import { TyneqOrderedEnumerable } from "tyneq/core";
import { TyneqCachedEnumerable } from "tyneq/core";
import type {
  Enumerator, EnumeratorFactory, TyneqSequence,
  TyneqOrderedSequence, TyneqCachedSequence, Comparer,
} from "tyneq";
import { tyneqQueryNode } from "tyneq";
import type { QueryPlanNode } from "tyneq";
import type { Nullable } from "tyneq";

export class ValidatedEnumerable<TSource> extends TyneqEnumerableBase<TSource> {
  private readonly source: TyneqSequence<TSource>;
  private readonly validator: (item: TSource) => boolean;
  private readonly label: string;

  public readonly [tyneqQueryNode]: Nullable<QueryPlanNode>;

  public constructor(
    source: TyneqSequence<TSource>,
    validator: (item: TSource) => boolean,
    label: string,
    node: Nullable<QueryPlanNode>
  ) {
    super();
    this.source = source;
    this.validator = validator;
    this.label = label;
    this[tyneqQueryNode] = node;
  }

  public override getEnumerator(): Enumerator<TSource> {
    const sourceEnum = this.source[Symbol.iterator]();
    const validator = this.validator;
    const label = this.label;

    return {
      next(): IteratorResult<TSource> {
        const result = sourceEnum.next();
        if (!result.done && !validator(result.value)) {
          throw new Error(
            `Validation failed [${label}]: element did not pass the check`
          );
        }
        return result;
      },
      return(value?: unknown): IteratorResult<TSource> {
        return sourceEnum.return?.(value) ?? { done: true, value: undefined };
      },
    };
  }

  // When an operator is called on a ValidatedSequence,
  // the result is a regular TyneqEnumerable -- validation was already applied.
  protected override createEnumerable<TResult>(
    factory: EnumeratorFactory<TResult>,
    node: Nullable<QueryPlanNode>
  ): TyneqSequence<TResult> {
    return new TyneqEnumerable(factory, node);
  }

  protected override createOrderedEnumerable<TKey>(
    keySelector: (x: TSource) => TKey,
    comparer: Comparer<TKey>,
    descending: boolean,
    node: Nullable<QueryPlanNode>
  ): TyneqOrderedSequence<TSource> {
    return new TyneqOrderedEnumerable(
      this, keySelector, comparer, descending, undefined, node
    );
  }

  protected override createCachedEnumerable(
    source: TyneqSequence<TSource>,
    node: Nullable<QueryPlanNode>
  ): TyneqCachedSequence<TSource> {
    return new TyneqCachedEnumerable(source, node);
  }
}
```

A few design decisions to notice:

- **`getEnumerator()`** wraps the source enumerator with validation logic. Every element is checked before being yielded.
- **`createEnumerable()`** returns a plain `TyneqEnumerable`, not another `ValidatedEnumerable`. This means operators chained after `validate()` produce regular sequences. The validation was already baked into the enumerator. If you wanted validation to propagate through the chain, you would return a `ValidatedEnumerable` instead.
- **The query node** is stored so the validation step appears in query plans.

### Step 2: Register a bridge method

Now we need a way for users to enter the `ValidatedSequence` from a regular sequence. We register a method on `TyneqEnumerableBase` that creates a `ValidatedEnumerable`:

```ts
import { OperatorRegistry, OperatorMetadata, QueryNode, tyneqQueryNode } from "tyneq";
import { TyneqEnumerableBase } from "tyneq/core";
import { RegistrationUtility } from "tyneq/plugin";

OperatorRegistry.register({
  metadata: new OperatorMetadata(
    "validate",       // operator name
    "streaming",      // kind
    "external",       // source
    TyneqEnumerableBase // target class -- available on ALL sequences
  ),
  impl: function (
    this: TyneqEnumerableBase<unknown>,
    validator: (item: unknown) => boolean,
    label: string = "validate"
  ) {
    if (typeof validator !== "function") {
      throw new TypeError("validator must be a function");
    }

    const node = RegistrationUtility.buildQueryNode(this, "validate", [validator, label], "streaming");

    return new ValidatedEnumerable(
      this as unknown as TyneqSequence<unknown>,
      validator,
      label,
      node
    );
  },
});
```

### Step 3: Add TypeScript types

```ts
declare module "tyneq" {
  interface TyneqSequence<T> {
    validate(
      validator: (item: T) => boolean,
      label?: string
    ): TyneqSequence<T>; // or a custom ValidatedSequence<T> interface
  }
}
```

### Step 4: Use it

```ts
import { Tyneq } from "tyneq";
import "./validated-sequence"; // registration runs on import

const data = [1, 2, 3, -1, 5];

// This throws on the -1 during iteration
Tyneq.from(data)
  .validate((x) => x > 0, "positive check")
  .toArray();
// Error: Validation failed [positive check]: element did not pass the check

// This works fine
Tyneq.from([1, 2, 3])
  .validate((x) => x > 0)
  .select((x) => x * 2)
  .toArray();
// [2, 4, 6]

// Shows up in query plans
import { QueryPlanPrinter, tyneqQueryNode } from "tyneq";
const seq = Tyneq.from([1, 2, 3]).validate((x) => x > 0).select((x) => x * 2);
console.log(QueryPlanPrinter.print(seq[tyneqQueryNode]!));
// from([1, 2, 3])
//   -> validate(<fn>, "validate")
//   -> select(<fn>)
```

### Step 5: Register operators specific to ValidatedSequence

If you want operators that only appear on `ValidatedEnumerable` (not on all sequences), pass your class as the `targetClass`:

```ts
OperatorRegistry.register({
  metadata: new OperatorMetadata(
    "revalidate",
    "streaming",
    "external",
    ValidatedEnumerable // only appears on ValidatedEnumerable instances
  ),
  impl: function (
    this: ValidatedEnumerable<unknown>,
    newValidator: (item: unknown) => boolean,
    label: string = "revalidate"
  ) {
    // Create a new ValidatedEnumerable with the new validator
    const node = RegistrationUtility.buildQueryNode(this, "revalidate", [newValidator, label], "streaming");

    return new ValidatedEnumerable(
      this as unknown as TyneqSequence<unknown>,
      newValidator,
      label,
      node
    );
  },
});
```

This method only shows up on `ValidatedEnumerable` instances -- not on regular sequences. TypeScript enforces this through module augmentation on a custom interface.

---

## OperatorRegistry

`OperatorRegistry` is the central catalog of all operators -- built-in and external. Use it for introspection, governance, and test isolation.

### Querying the registry

```ts
import { OperatorRegistry } from "tyneq";

// All registered operators
OperatorRegistry.list();

// Filter by kind
OperatorRegistry.listByKind("streaming");  // streaming operators
OperatorRegistry.listByKind("terminal");   // terminal operators

// Filter by source
OperatorRegistry.listBySource("internal"); // built-in operators
OperatorRegistry.listBySource("external"); // plugin/custom operators

// Point queries
OperatorRegistry.has("repeatEach");       // boolean
OperatorRegistry.get("select");           // OperatorEntry | undefined
OperatorRegistry.count();                 // total count
```

Each `OperatorEntry` contains:
- `metadata.name` -- the operator name
- `metadata.kind` -- `"streaming"`, `"buffer"`, `"terminal"`, etc.
- `metadata.source` -- `"internal"` or `"external"`
- `metadata.targetClass` -- the class whose prototype was patched
- `impl` -- the actual function that was patched onto the prototype

### Guards

Guards run synchronously before every external registration and can block it by throwing. Use them to enforce naming policies:

```ts
const removeGuard = OperatorRegistry.addGuard((entry) => {
  if (
    entry.metadata.source === "external" &&
    !entry.metadata.name.startsWith("mylib_")
  ) {
    throw new PluginError(
      `External operators must be prefixed with 'mylib_'. Got: '${entry.metadata.name}'`
    );
  }
});

// Call removeGuard() to detach it when no longer needed
removeGuard();
```

### Post-registration hooks

Observe-only callbacks that run after a successful registration. Cannot block.

```ts
const unsubscribe = OperatorRegistry.onRegister((entry) => {
  console.log(`Registered: ${entry.metadata.name} (${entry.metadata.kind})`);
});

unsubscribe(); // detach
```

### Unregistering

Remove a registered operator. Useful in tests for cleanup.

```ts
OperatorRegistry.unregister("mylib_slidingAverage");
```

Unregistering deletes the prototype method (for external operators) and removes the registry entry. Internal operators keep their prototype method -- only the entry is removed.

### Source operators

Source operators produce the root sequence (like `Tyneq.from` or `Tyneq.range`). They are not patched onto any prototype -- they are static factories. Register them with `registerSource`:

```ts
OperatorRegistry.registerSource("fibonacci", (count: number) => {
  function* fib(n: number) {
    let a = 0, b = 1;
    for (let i = 0; i < n; i++) {
      yield a;
      [a, b] = [b, a + b];
    }
  }
  return Tyneq.from({ [Symbol.iterator]: () => fib(count) });
});
```

Source operators registered this way are automatically compilable by `QueryPlanCompiler` -- no changes to the compiler needed.

### Test isolation

Cross-test contamination is a common issue with prototype-patched registrations. Clean up after yourself:

```ts
import { OperatorRegistry, createGeneratorOperator } from "tyneq";
import { afterEach, it, expect } from "vitest";

let registered: string | null = null;

afterEach(() => {
  if (registered) {
    OperatorRegistry.unregister(registered);
    registered = null;
  }
});

it("repeatEach works", () => {
  registered = "test_repeatEach";
  createGeneratorOperator({
    name: registered,
    category: "streaming",
    *generator(source: Iterable<unknown>, times: number) {
      for (const item of source) {
        for (let i = 0; i < times; i++) yield item;
      }
    },
  });

  const result = (Tyneq.from([1, 2]) as any)[registered](2).toArray();
  expect(result).toEqual([1, 1, 2, 2]);
});
```

---

## OperatorMetadata

Every registered operator carries an `OperatorMetadata` instance. It describes the operator for the registry, query plan, and compiler.

| Field | Type | Meaning |
|---|---|---|
| `name` | `string` | Operator name as it appears on sequences and in query plans |
| `kind` | `OperatorKind` | `"streaming"`, `"buffer"`, `"terminal"`, `"source"`, `"cache"`, `"extension"` |
| `source` | `OperatorSource` | `"internal"` (built-in) or `"external"` (plugin) |
| `targetClass` | `SequenceConstructor \| undefined` | The class whose prototype gets patched. `undefined` for source operators. |
| `extensions` | `Record<string, unknown>` | Custom metadata for introspection. Free-form dictionary for plugin-specific data. |

Convenience factory methods:

```ts
OperatorMetadata.streaming("myOp");                    // kind="streaming", target=TyneqEnumerableBase
OperatorMetadata.buffer("myOp");                       // kind="buffer", target=TyneqEnumerableBase
OperatorMetadata.terminal("myOp");                     // kind="terminal", target=TyneqEnumerableBase
OperatorMetadata.source("mySource");                   // kind="source", no target
OperatorMetadata.streaming("myOp", MyCustomSequence);  // target=MyCustomSequence
```

---

## Utility helpers

These are used extensively in built-in operators and are available for custom operators too.

### ArgumentUtility

A facade over guards for common argument validation. Pass a single-key object so error messages include the argument name automatically:

```ts
import { ArgumentUtility } from "tyneq";

function validateWindow(windowSize: number): void {
  ArgumentUtility.checkNotOptional({ windowSize }); // throws if null or undefined
  ArgumentUtility.checkInteger({ windowSize });      // throws if not an integer
  ArgumentUtility.checkPositive({ windowSize });     // throws if <= 0
}
```

Available checks:

| Method | Validates |
|---|---|
| `checkNotNull` | Not `null` |
| `checkNotUndefined` | Not `undefined` |
| `checkNotOptional` | Not `null` and not `undefined` |
| `checkNotNullOrWhiteSpace` | String is present and not empty/whitespace |
| `checkNonNegative` | Number >= 0 |
| `checkPositive` | Number > 0 |
| `checkNegative` | Number < 0 |
| `checkInRange` | Number within [min, max] |
| `checkInteger` | `Number.isInteger()` |
| `checkFinite` | `Number.isFinite()` |
| `checkSafeInteger` | `Number.isSafeInteger()` |
| `checkArrayIndex` | Non-negative integer, optionally within array bounds |
| `checkFunction` | Is a function |
| `checkIterable` | Implements `Symbol.iterator` |
| `checkInstanceOf` | Is instance of a given class |
| `check` | Custom predicate with custom message |

### ValidationBuilder

Collects multiple validation checks and throws a single `ValidationError` with all failures:

```ts
import { ValidationBuilder } from "tyneq";

new ValidationBuilder()
  .check(() => ArgumentUtility.checkNotOptional({ selector }))
  .check(() => ArgumentUtility.checkPositive({ count }))
  .check(() => ArgumentUtility.checkFunction({ processor }))
  .throwIfAny();
// -> ValidationError: 2 validation error(s):
//      1. selector must not be null or undefined
//      2. count must be positive
```

### TypeGuardUtility

Type guard helpers for runtime checks:

```ts
import { TypeGuardUtility } from "tyneq";

TypeGuardUtility.isIterable(value);   // value is Iterable<unknown>
TypeGuardUtility.isIterator(value);   // value is Iterator<unknown>
TypeGuardUtility.isEnumerable(value); // value is Enumerable<unknown>
TypeGuardUtility.isEnumerator(value); // value is Enumerator<unknown>
```

### TyneqComparer

Tested, stable comparers for ordering logic. Prefer these over inline comparers:

```ts
import { TyneqComparer } from "tyneq";

TyneqComparer.defaultComparer;                // generic <, > comparison
TyneqComparer.numericComparer;                // a - b (numbers only)
TyneqComparer.localeComparer();               // locale-aware string comparison
TyneqComparer.caseInsensitiveEqualityComparer; // EqualityComparer<string>
TyneqComparer.reverse(cmp);                   // reverses any Comparer<T>
TyneqComparer.defaultEqualityComparer;        // === equality
```

---

## Debugging plugin issues

If a custom operator does not appear on sequences:

1. **Confirm the module is imported.** Side-effect imports are tree-shaken if unused. Make sure the import is present and not dead-code eliminated.
2. **Check `OperatorRegistry.has("yourOperator")`** -- if `false`, registration did not run.
3. **Look for guard failures.** Add `OperatorRegistry.onRegister((e) => console.log(e))` before importing the plugin.
4. **Verify the `declare module "tyneq"` block** is in scope for TypeScript (included in `tsconfig.json` includes or referenced directly).
5. **Check for name collisions** -- registering a name that already exists throws `RegistryError`.

If behavior is wrong at runtime, print the query plan:

```ts
import { QueryPlanPrinter, tyneqQueryNode } from "tyneq";

const seq = Tyneq.from(data).myOp(args);
console.log(QueryPlanPrinter.print(seq[tyneqQueryNode]!));
// Verify myOp appears at the expected position with the right args
```

---

## Plugin packaging pattern

A practical layout for distributing a plugin as an npm package:

```
my-plugin/
  src/
    operators/
      mylib_smoothing.ts    # one file per operator
      mylib_percentile.ts
    sequences/
      ValidatedEnumerable.ts  # custom sequence type (if any)
    index.ts                # imports all operators for side effects
  package.json
```

```ts
// src/index.ts
export * from "./operators/mylib_smoothing";
export * from "./operators/mylib_percentile";
export type { MySmoothingOptions } from "./operators/mylib_smoothing";
```

```ts
// Consumer -- once in entry point
import "@my-org/tyneq-plugin-analytics";

// Now available everywhere
Tyneq.from(data).mylib_smoothing({ window: 5 }).toArray();
```
