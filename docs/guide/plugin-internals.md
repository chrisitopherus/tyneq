# Plugin Internals

This guide is for advanced usage: writing custom enumerators, understanding how plugin registration is wired, and using utility classes correctly.

If you only need to publish one custom operator quickly, start with [Extensibility](/guide/extensibility). Use this page when you need architectural context.

## When to Use Which API

| Goal | Preferred API | Why |
|---|---|---|
| Simple streaming transform | `createGeneratorOperator` | Smallest surface area, easiest to maintain |
| Custom cursor behavior or non-trivial state machine | `createOperator` + `EnumeratorFactory` | Full control over enumeration behavior |
| Class-based operator with reusable internals | `@operator` + `TyneqEnumerator` | Encapsulates state and lifecycle cleanly |
| Class-based terminal | `@terminal` + `TyneqTerminalOperator` | Best for complex terminal logic |
| Introspection/guarding/cleanup | `OperatorRegistry` | Registry visibility and test isolation |

## Mental Model

Registration happens at import time and patches methods onto sequence prototypes through the plugin pipeline.

1. You call a registration API (`createOperator`, decorator, etc.).
2. Tyneq validates metadata and registration rules.
3. Entry is added to `OperatorRegistry`.
4. The operator method becomes callable on sequences.

Because registration is a side effect, plugin modules should usually be imported once in the app entry point.

```ts
// app bootstrap
import "@my-org/tyneq-plugin-analytics";
```

## Writing a Custom Enumerator

Use this path when generator-based APIs are too limited.

### Option A: `createOperator` with `EnumeratorFactory`

```ts
import { createOperator } from "tyneq";
import type { Enumerable, Enumerator, EnumeratorFactory } from "tyneq";

createOperator({
  name: "stride",
  category: "streaming",
  factory(source: Enumerable<unknown>, step: number): EnumeratorFactory<unknown> {
    return {
      getEnumerator(): Enumerator<unknown> {
        let index = 0;
        const iter = source[Symbol.iterator]();

        return {
          next() {
            while (true) {
              const r = iter.next();
              if (r.done) return r;
              if (index++ % step === 0) return r;
            }
          }
        };
      }
    };
  },
  validate(step) {
    if (typeof step !== "number" || step < 1) {
      throw new RangeError("step must be >= 1");
    }
  }
});
```

### Option B: `@operator` with `TyneqEnumerator`

Use this when a class is easier to reason about than closures.

```ts
import { operator, TyneqEnumerator } from "tyneq";
import type { Enumerator } from "tyneq";

@operator("everyOther", "streaming")
class EveryOtherEnumerator<T> extends TyneqEnumerator<T, T> {
  private emit = false;

  public constructor(source: Enumerator<T>) {
    super(source);
  }

  protected override handleNext(): IteratorResult<T> {
    while (true) {
      const next = this.sourceEnumerator.next();
      if (next.done) return next;

      this.emit = !this.emit;
      if (this.emit) return next;
    }
  }
}
```

### Buffering Custom Enumerators

Use `"buffer"` category and load data in `initialize()` when full-source access is required.

```ts
@operator("stableWindow", "buffer")
class StableWindowEnumerator<T> extends TyneqEnumerator<T, T[]> {
  private readonly items: T[] = [];
  private index = 0;

  public constructor(source: Enumerator<T>, private readonly size: number) {
    super(source);
  }

  protected override initialize(): void {
    let next = this.sourceEnumerator.next();
    while (!next.done) {
      this.items.push(next.value);
      next = this.sourceEnumerator.next();
    }
  }

  protected override handleNext(): IteratorResult<T[]> {
    if (this.index + this.size > this.items.length) {
      return { done: true, value: undefined };
    }

    const window = this.items.slice(this.index, this.index + this.size);
    this.index++;
    return { done: false, value: window };
  }
}
```

## Validation Placement Rules

Validation should happen at registration call boundaries, not deep in lazy execution paths.

- Do: validate in `validate(...)` callbacks for registration APIs.
- Do: validate in decorator validation callbacks.
- Do not: validate in enumerator constructors or `handleNext()` if you want eager argument errors.

This keeps error timing predictable and consistent with built-in operators.

## Operator Registry Workflow

`OperatorRegistry` is useful for plugin governance, diagnostics, and tests.

```ts
import { OperatorRegistry } from "tyneq";

OperatorRegistry.list();
OperatorRegistry.listByKind("terminal");
OperatorRegistry.listBySource("external");
OperatorRegistry.get("select");
OperatorRegistry.has("myPlugin_op");
```

### Enforce naming policy

```ts
const removeGuard = OperatorRegistry.addGuard(entry => {
  const isExternal = entry.metadata.source === "external";
  if (isExternal && !entry.metadata.name.startsWith("analytics_")) {
    throw new Error("Plugin operators must use the analytics_ prefix");
  }
});

// later
removeGuard();
```

### Test isolation

```ts
import { afterEach } from "vitest";
import { OperatorRegistry } from "tyneq";

let registeredName: string | null = null;

afterEach(() => {
  if (registeredName) {
    OperatorRegistry.unregister(registeredName);
    registeredName = null;
  }
});
```

## Utility Classes and Helpers

For plugin/operator authoring, these are the most relevant utility exports.

| Utility | Typical use |
|---|---|
| `ArgumentUtility` | Null/undefined/range/type argument checks |
| `ValidationBuilder` | Compose reusable validation contracts |
| `TypeGuardUtility` | Type-guard helper patterns |
| `TyneqComparer` | Stable comparer behavior for ordering logic |

### `ArgumentUtility` pattern

```ts
import { ArgumentUtility } from "tyneq/utility";

function validateWindowSize(windowSize: number): void {
  ArgumentUtility.checkNotOptional({ windowSize });
  ArgumentUtility.checkInteger({ windowSize });
  ArgumentUtility.checkPositive({ windowSize });
}
```

Use single-key object parameters so Tyneq can produce argument-name-aware errors.

## Plugin Packaging Pattern

A practical package layout:

1. One file per operator registration.
2. A single entry file that imports all registrations for side effects.
3. One module augmentation block per operator (or a central `.d.ts` file).
4. Consumer imports the plugin entry once.

```ts
// my-plugin/index.ts
import "./operators/analytics_windowAverage";
import "./operators/analytics_percentile";
```

```ts
// consumer app
import "@my-org/tyneq-plugin-analytics";
```

## Debugging Plugin Behavior

If a custom operator does not appear:

1. Confirm plugin module import actually runs.
2. Check `OperatorRegistry.has("yourOperator")`.
3. Check for guard failures in registration.
4. Verify module augmentation is in scope for TypeScript.
5. Verify operator name does not collide with existing registrations.

If behavior is wrong at runtime, print query plans and verify operator position and arguments before stepping into enumerator internals.

## Related Pages

- [Extensibility](/guide/extensibility)
- [Contributing](/guide/contributing)
- [Terminology](/guide/terminology)
- [Best Practices](/guide/best-practices)
