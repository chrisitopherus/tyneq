# Plugin Internals

This guide is for people who want to understand how operator registration works, what the `OperatorRegistry` can do for them, and how to write clean, maintainable custom enumerators.

If you just need to write a custom operator, start with [Custom Operators](./extensibility.md) first - that page covers everything you need for the common cases. Come back here when you want the architecture.

---

## How registration works

When you call any registration function (`createGeneratorOperator`, `@operator`, etc.), four things happen in order:

1. **Metadata is validated** - name uniqueness, required fields, category correctness.
2. **Guards run** - any guards added via `OperatorRegistry.addGuard` are called synchronously. If a guard throws, registration is aborted.
3. **An entry is added to `OperatorRegistry`** - keyed by name, with metadata including kind, category, source, and the factory.
4. **The method is patched onto the target prototype** - `TyneqEnumerableBase` for standard operators, or the specialized subclass (`TyneqOrderedEnumerable`, `TyneqCachedEnumerable`) for specialized operators. See [Which prototype each API patches](#which-prototype-each-api-patches) below.

This all happens at module import time, as a side effect of importing your registration file.

```ts
// Before import: Tyneq.from([]).myOp is undefined

import "./my-plugin/myOp"; // registration runs here

// After import: Tyneq.from([]).myOp is a function
```

---

## Which prototype each API patches

Every registration API ultimately calls `OperatorRegistry.register`, which patches a method onto a specific class prototype. The target prototype determines which sequence types the operator appears on.

| API / Decorator | Patches prototype of | Operator appears on |
|---|---|---|
| `createGeneratorOperator` | `TyneqEnumerableBase` | All sequences |
| `createOperator` | `TyneqEnumerableBase` | All sequences |
| `createTerminalOperator` | `TyneqEnumerableBase` | All sequences |
| `@operator` | `TyneqEnumerableBase` | All sequences |
| `@terminal` | `TyneqEnumerableBase` | All sequences |
| `createOrderedOperator` | `TyneqOrderedEnumerable` | Ordered sequences only |
| `@orderedOperator` | `TyneqOrderedEnumerable` | Ordered sequences only |
| `createOrderedTerminalOperator` | `TyneqOrderedEnumerable` | Ordered sequences only |
| `@orderedTerminal` | `TyneqOrderedEnumerable` | Ordered sequences only |
| `createCachedOperator` | `TyneqCachedEnumerable` | Cached sequences only |
| `@cachedOperator` | `TyneqCachedEnumerable` | Cached sequences only |
| `createCachedTerminalOperator` | `TyneqCachedEnumerable` | Cached sequences only |
| `@cachedTerminal` | `TyneqCachedEnumerable` | Cached sequences only |

`TyneqOrderedEnumerable` and `TyneqCachedEnumerable` both extend `TyneqEnumerableBase`, so they also carry all base-level operators. The specialized APIs add methods that appear *only* on their subtype, enforced at the TypeScript level via the `TyneqOrderedSequence` and `TyneqCachedSequence` interfaces.

### Extending to your own sequence type

The same mechanism works for custom sequence types. If you subclass `TyneqEnumerableBase` and expose it as a new sequence interface, you can register operators that patch only your subclass:

```ts
import { OperatorRegistry, OperatorMetadata } from "tyneq";

// Your custom sequence class
class ValidationEnumerable<T> extends TyneqEnumerableBase<T> {
  // ... custom fields (schema, rules, etc.)
}

// Register an operator that only appears on ValidationEnumerable
OperatorRegistry.register({
  metadata: new OperatorMetadata("assertSchema", "streaming", "external", ValidationEnumerable),
  impl: function (this: ValidationEnumerable<unknown>, schema: object) {
    // this is always a ValidationEnumerable here
    return this.createEnumerable({ getEnumerator: () => new AssertSchemaEnumerator(this.getEnumerator(), schema) }, node);
  }
});
```

The `targetClass` argument to `OperatorMetadata` is the class whose `.prototype` gets the patch. The method will not appear on plain `TyneqSequence` - only on instances of `ValidationEnumerable`.

---

## OperatorRegistry

`OperatorRegistry` is the central catalog of all operators - built-in and external. It is useful for introspection, governance, and test isolation.

### Querying the registry

```ts
import { OperatorRegistry } from "tyneq";

// All registered operators
OperatorRegistry.list();

// Filter by kind
OperatorRegistry.listByKind("operator");   // streaming/buffering operators
OperatorRegistry.listByKind("terminal");   // terminal operators

// Filter by source
OperatorRegistry.listBySource("internal"); // built-in operators
OperatorRegistry.listBySource("external"); // plugin/custom operators

// Point queries
OperatorRegistry.has("repeatEach");        // boolean
OperatorRegistry.get("select");            // OperatorEntry | undefined
OperatorRegistry.count();                  // total count
```

Each `OperatorEntry` contains:
- `metadata.name` - the operator name
- `metadata.kind` - `"operator"` or `"terminal"`
- `metadata.category` - `"streaming"`, `"buffer"`, or `"terminal"`
- `metadata.source` - `"internal"` or `"external"`

### Guards

Guards run synchronously before every registration and can block it by throwing. Use them to enforce naming policies for your project or organization.

```ts
const removeGuard = OperatorRegistry.addGuard(entry => {
  if (entry.metadata.source === "external" && !entry.metadata.name.startsWith("mylib_")) {
    throw new PluginError(
      `External operators must be prefixed with 'mylib_'. Got: '${entry.metadata.name}'`
    );
  }
});

// Call removeGuard() to detach it when no longer needed
removeGuard();
```

Guards fire for both external and internal registrations, but you can filter on `entry.metadata.source`.

### Post-registration hooks

Observe-only callbacks that run after a successful registration. Cannot block the registration.

```ts
const unsubscribe = OperatorRegistry.onRegister(entry => {
  console.log(`Registered: ${entry.metadata.name} (${entry.metadata.kind})`);
});

unsubscribe(); // detach
```

### Unregistering

Remove a registered operator. Use this in tests to clean up after registrations.

```ts
OperatorRegistry.unregister("mylib_slidingAverage");
```

Unregistering patches the prototype method back to `undefined` and removes the entry from the registry.

### Test isolation

Cross-test contamination is a common issue with prototype-patched registrations. The `afterEach` pattern keeps tests isolated:

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

## Custom enumerator architecture

The `TyneqEnumerator` base class implements a state machine lifecycle for you. Understanding it makes writing correct enumerators much easier.

### State machine

An enumerator goes through these states:

```
Created -> [initialize()] -> Running -> [earlyComplete() or source exhausted] -> Done
```

1. **Created**: `constructor` has run, `initialize()` has not been called yet.
2. **`initialize()`**: called once, before the first `handleNext()`. For streaming operators, override this if you need setup (e.g. preloading a buffer). For buffering operators, this is where you read the full source.
3. **`handleNext()`**: called for each element requested. Return `{ done: false, value }` to yield an element, or `{ done: true, value: undefined }` to end.
4. **Done**: either `handleNext` returned `done: true`, or `earlyComplete()` was called.

### `sourceEnumerator`

Inside `handleNext()`, pull elements from upstream via `this.sourceEnumerator.next()`. Never call `this.sourceEnumerator.next()` inside `initialize()` for streaming operators - the state machine is not ready yet.

```ts
protected override handleNext(): IteratorResult<T> {
  const next = this.sourceEnumerator.next();
  if (next.done) return next;
  // process next.value
  return { done: false, value: transform(next.value) };
}
```

### Buffering pattern

Read everything in `initialize()`, then serve from your internal buffer in `handleNext()`:

```ts
@operator("sort", "buffer")
class SortEnumerator<T> extends TyneqEnumerator<T, T> {
  private sorted: T[] = [];
  private index = 0;

  public constructor(source: Enumerator<T>, private readonly compareFn: (a: T, b: T) => number) {
    super(source);
  }

  protected override initialize(): void {
    const all: T[] = [];
    let next = this.sourceEnumerator.next();
    while (!next.done) {
      all.push(next.value);
      next = this.sourceEnumerator.next();
    }
    this.sorted = all.sort(this.compareFn);
  }

  protected override handleNext(): IteratorResult<T> {
    if (this.index >= this.sorted.length) return { done: true, value: undefined };
    return { done: false, value: this.sorted[this.index++] };
  }
}
```

### Multi-input operators

If your operator needs two sources (like `zip` or `join`), pass the second source as a constructor argument. Use `Enumerable<T>` (not `Enumerator<T>`) for it so you can iterate it from within the enumerator lifecycle:

```ts
@operator("interleave", "streaming")
class InterleaveEnumerator<T> extends TyneqEnumerator<T, T> {
  private otherIter: Iterator<T>;
  private useOther = false;

  public constructor(source: Enumerator<T>, private readonly other: Enumerable<T>) {
    super(source);
    this.otherIter = other[Symbol.iterator]();
  }

  protected override handleNext(): IteratorResult<T> {
    this.useOther = !this.useOther;
    if (this.useOther) {
      const r = this.otherIter.next();
      if (!r.done) return r;
    }
    return this.sourceEnumerator.next();
  }
}
```

### Choosing the right base class

There are four base classes. Which one you extend depends on what the operator is called on:

| Base class | Extends from source | Use when |
|---|---|---|
| `TyneqEnumerator<TInput, TOutput>` | `Enumerator<TInput>` | Operator on any sequence (`@operator`) |
| `TyneqOrderedEnumerator<TSource>` | `OrderedEnumerable<TSource>` | Operator only on ordered sequences (`@orderedOperator`) |
| `TyneqCachedEnumerator<TSource>` | `CachedEnumerable<TSource>` | Operator only on cached sequences (`@cachedOperator`) |
| `TyneqBaseEnumerator<TOutput>` | (none - bring your own source) | Enumerator with no upstream, or fully custom source wiring |

**`TyneqEnumerator`** is the standard choice for custom operators. It holds the upstream as `this.sourceEnumerator: Enumerator<TInput>` and disposes it automatically.

**`TyneqOrderedEnumerator`** and **`TyneqCachedEnumerator`** receive the full sequence object (not just an enumerator) as `this.orderedSource` and `this.cachedSource` respectively. This is necessary because ordered and cached sequences own their own lifecycle - the enumerator must not dispose them. It also gives you access to sequence-level properties (e.g. the sort key chain on an ordered sequence).

**`TyneqBaseEnumerator`** is the raw foundation all others build on. Use it when you need total control - for example an enumerator that generates values without a source, or one that holds multiple heterogeneous sources. You are responsible for disposal in `disposeSource()` and `disposeAdditional()`.

---

## Utility helpers

These are available from `tyneq/utility` and are used extensively in built-in operators.

### `ArgumentUtility`

A facade over guards for common argument validation. Pass a single-key object so error messages include the argument name automatically.

```ts
import { ArgumentUtility } from "tyneq/utility";

function validateWindow(windowSize: number): void {
  ArgumentUtility.checkNotOptional({ windowSize }); // throws if null or undefined
  ArgumentUtility.checkInteger({ windowSize });      // throws if not an integer
  ArgumentUtility.checkPositive({ windowSize });     // throws if <= 0
}

// Or inline in validate callback:
createGeneratorOperator({
  name: "slidingAverage",
  category: "streaming",
  validate(windowSize: number) {
    ArgumentUtility.checkNotOptional({ windowSize });
    ArgumentUtility.checkPositive({ windowSize });
  },
  // ...
});
```

### `TypeGuardUtility`

Type guard helpers for use inside custom operators:

```ts
import { TypeGuardUtility } from "tyneq/utility";

TypeGuardUtility.isIterable(value);   // value is Iterable<unknown>
TypeGuardUtility.isIterator(value);   // value is Iterator<unknown>
TypeGuardUtility.isEnumerable(value); // value is Enumerable<unknown>
TypeGuardUtility.isEnumerator(value); // value is Enumerator<unknown>
```

### `TyneqComparer`

Provides tested, stable comparers for ordering logic. Prefer these over inline comparers.

```ts
import { TyneqComparer } from "tyneq";

TyneqComparer.defaultComparer;          // generic <, > comparison
TyneqComparer.numericComparer;          // a - b (numbers only)
TyneqComparer.localeComparer();         // locale-aware string comparison
TyneqComparer.caseInsensitiveEqualityComparer; // EqualityComparer<string>
TyneqComparer.reverse(cmp);            // reverses any Comparer<T>
TyneqComparer.defaultEqualityComparer; // === equality
```

---

## Debugging plugin issues

If a custom operator does not appear on sequences:

1. Confirm the registration module is actually imported (side-effect imports are tree-shaken if unused).
2. Check `OperatorRegistry.has("yourOperator")` - if `false`, registration did not run.
3. Look for guard failures - add `OperatorRegistry.onRegister(e => console.log(e))` before importing the plugin.
4. Verify the `declare module "tyneq"` block is in scope for TypeScript (included in `tsconfig.json` includes or referenced directly).
5. Check for name collisions - registering a name that already exists throws `RegistryError`.

If behavior is wrong at runtime, print the query plan and verify operator position and arguments:

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
    index.ts                # imports all operators for side effects
  package.json
```

```ts
// src/index.ts
export * from "./operators/mylib_smoothing";
export * from "./operators/mylib_percentile";
// Re-export types your consumers need
export type { MySmoothingOptions } from "./operators/mylib_smoothing";
```

```ts
// Consumer - once in entry point
import "@my-org/tyneq-plugin-analytics";

// Now available everywhere
Tyneq.from(data).mylib_smoothing({ window: 5 }).toArray();
```
