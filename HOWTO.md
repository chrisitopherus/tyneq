# HOWTO — Implementing New Operators

This document walks through the full workflow for adding a new operator to Tyneq,
covering every decision point: base class choice, registration API choice, validation
contract, QueryNode threading, and the special cases for ordered and cached enumerables.

---

## 1. Decide the operator category

| Category | Description | Base class |
|---|---|---|
| **Streaming** | Transforms elements one-at-a-time; O(1) space | `TyneqEnumerator<TSource, TResult>` |
| **Buffer** | Must see some/all elements before yielding; O(n) space | `TyneqEnumerator<TSource, TResult>` |
| **Terminal** | Consumes the sequence and returns a concrete value | `TyneqTerminalOperator<TSource, TResult>` |

Use streaming unless the operator requires random access, sorting, or set operations.
Use terminal when the result is a value (number, boolean, array, etc.), not a sequence.

---

## 2. Choose the registration API

Two APIs are available and both route through `OperatorRegistry`:

| API | When to use |
|---|---|
| `@operator` / `@terminal` decorator | You already have a class with constructor logic (most library operators) |
| `createOperator` / `createStreamingOperator` / `createTerminalOperator` | Simple one-off or third-party operators; generator functions preferred |

The two are interchangeable in terms of runtime behaviour. Pick whichever fits
the amount of structural ceremony you want.

---

## 3. Path A — Class-based with `@operator`

### 3a. Write the enumerator class

```ts
// src/enumerators/streaming/myOp.ts
import { TyneqEnumerator } from '../../core/enumerators/TyneqEnumerator';
import { operator } from '../../extensions/operator';
import { ArgumentUtility } from '../../utility/argumentUtility';

@operator<[threshold: unknown]>('myOp', (threshold) => {
    ArgumentUtility.checkNotOptional({ threshold });
    ArgumentUtility.checkPositive({ threshold });   // example validation
})
export class MyOpEnumerator<TSource> extends TyneqEnumerator<TSource, TSource> {
    private readonly threshold: number;

    public constructor(sourceEnumerator: Enumerator<TSource>, threshold: number) {
        super(sourceEnumerator);
        // Do NOT re-validate threshold here — it was already validated by @operator.
        this.threshold = threshold;
    }

    protected override handleNext(): IteratorResult<TSource> {
        // ... iteration logic ...
    }
}
```

**Key rules for the constructor**:
- The first parameter must be `sourceEnumerator: Enumerator<TSource>` (infrastructure — never validate it).
- User arguments come after; do NOT re-validate them — `@operator`'s `validate` runs first.
- Throw `ArgumentError` / `ArgumentNullError` / `ArgumentOutOfRangeError` from `validate`, not from the constructor.

**Enumerator lifecycle** (for `TyneqEnumerator`):
- `initialize()` — called once on the first `next()`. Override to set up buffers.
- `handleNext()` — called on every subsequent `next()`. Return `{ value, done: false }` or `{ value: undefined, done: true }`.
- `dispose(value?)` — override for early-termination cleanup.

**Buffer operators** follow the same pattern but declare `'buffer'` explicitly and override
`initialize()` to fill their buffer before `handleNext()` is called:

```ts
// src/enumerators/buffer/myBufferOp.ts
import { TyneqEnumerator } from '../../core/enumerators/TyneqEnumerator';
import { Enumerator } from '../../types/core';
import { operator } from '../../extensions/operator';
import { ArgumentUtility } from '../../utility/argumentUtility';
import { EnumeratorUtility } from '../../utility/EnumeratorUtility';

@operator<[selector: unknown]>('myBufferOp', 'buffer', (selector) => {
    ArgumentUtility.checkNotOptional({ selector });
})
export class MyBufferOpEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly selector: (item: TSource) => TKey;
    private buffer: TSource[] = [];
    private index = 0;

    public constructor(sourceEnumerator: Enumerator<TSource>, selector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.selector = selector;
    }

    protected override initialize(): void {
        // Buffer the entire source — runs once before the first handleNext()
        this.buffer = Array.from(EnumeratorUtility.toIterable(this.sourceEnumerator));
        this.buffer.sort((a, b) => /* ... */ 0);
        this.index = 0;
    }

    protected override handleNext(): IteratorResult<TSource> {
        if (this.index >= this.buffer.length) {
            return this.done();
        }
        return this.yield(this.buffer[this.index++]);
    }
}
```

The only difference from a streaming operator is the `'buffer'` kind argument and the use of
`initialize()` to fill the buffer. The base class (`TyneqEnumerator`) is identical.

### 3b. Register by importing the module

The `@operator` decorator fires at class-evaluation time. The class module must be
imported before the method is available on `TyneqEnumerableBase.prototype`.

Add a **named import** to `src/core/TyneqEnumerableBase.ts`:

```ts
// src/core/TyneqEnumerableBase.ts — streaming enumerators section
import { MyOpEnumerator } from '../enumerators/streaming/myOp';
```

Then add the method body that delegates to the enumerator:

```ts
public myOp(threshold: number): TyneqSequence<TSource> {
    const node = this.createOperatorNode(MyOpEnumerator, [threshold]);
    return this.createEnumerable(
        { getEnumerator: () => new MyOpEnumerator<TSource>(this.getEnumerator(), threshold) },
        node
    );
}
```

---

## 4. Path B — Functional with `createOperator`

Use a config-object API. The three choices, in ascending order of ceremony:

```ts
// src/enumerators/streaming/myOp.ts — createStreamingOperator (lowest ceremony)
import { createStreamingOperator } from '../../extensions/createStreamingOperator';
import { ArgumentUtility } from '../../utility/argumentUtility';

createStreamingOperator({
    name: 'myOp',
    validate(threshold: unknown) {
        ArgumentUtility.checkNotOptional({ threshold });
    },
    *generator(source: Iterable<unknown>, threshold: number) {
        for (const item of source) {
            if (/* condition based on threshold */) {
                yield item;
            }
        }
    }
});
```

```ts
// src/enumerators/streaming/myOp.ts — createOperator (when you need full EnumeratorFactory control)
import { createOperator } from '../../extensions/createOperator';

createOperator({
    name: 'myOp',
    kind: 'streaming',   // or 'buffer'; defaults to 'streaming'
    validate(threshold: unknown) { /* ... */ },
    factory(source, threshold: number) {
        return {
            getEnumerator() { /* return Enumerator<TResult> */ }
        };
    }
});
```

Add a **named import** to `src/core/TyneqEnumerableBase.ts` so the registration runs at module-load time:

```ts
// src/core/TyneqEnumerableBase.ts — streaming enumerators section
import '../enumerators/streaming/myOp';
```

---

## 5. Terminal operators with `@terminal`

```ts
// src/operators/terminal/myTerminal.ts
import { terminal } from '../../extensions/terminal';
import { TyneqTerminalOperator } from '../../core/TyneqTerminalOperator';
import { ArgumentUtility } from '../../utility/argumentUtility';

@terminal<[selector: unknown]>('myTerminal', (selector) => {
    ArgumentUtility.checkNotOptional({ selector });
    ArgumentUtility.checkFunction({ selector });
})
export class MyTerminalOperator<TSource> extends TyneqTerminalOperator<TSource, number> {
    private readonly selector: (item: TSource) => number;

    public constructor(source: Enumerable<TSource>, selector: (item: TSource) => number) {
        super(source);
        this.selector = selector;
    }

    public process(): number {
        let result = 0;
        for (const item of this.source) {
            result += this.selector(item);
        }
        return result;
    }
}
```

`@terminal` injects a method on `TyneqEnumerableBase.prototype` that:
1. Runs `validate` eagerly.
2. Constructs the operator and calls `process()`.
3. Returns the result directly (not wrapped in an enumerable).

---

## 6. Declare the method signature on `TyneqEnumerableBase`

TypeScript needs a `declare` stub so the IDE and type-checker know the method exists:

```ts
// src/core/TyneqEnumerableBase.ts — in the appropriate section

// ── Streaming operators ───────────────────────────────────────────────────
declare myOp: (threshold: number) => TyneqSequence<TSource>;

// ── Terminal operators ────────────────────────────────────────────────────
declare myTerminal: (selector: (item: TSource) => number) => number;
```

Place it in the correct section (`streaming`, `buffer`, or `terminal`).

---

## 7. QueryNode threading (query plan visibility)

Operators registered via `@operator`, `@terminal`, or `createOperator` automatically
receive a `QueryNode` capturing the operator name, args, and source node. No extra work
is needed for these paths.

**The automatic node is created by the registration infrastructure** inside
`operatorDecorators.ts` / `createOperator.ts` using `inferOperatorKind`.

### Special case: `orderBy` / `orderByDescending` / `memoize`

These are implemented directly on `TyneqEnumerableBase` (not via `@operator`) and feed
into `createOrderedEnumerable` / `createCachedEnumerable` factory methods. They create
their own `QueryNode` explicitly and thread it through the factory call:

```ts
// Already done — shown here for reference only
const node = new QueryNode('orderBy', [keySelector, comparer], this[tyneqQueryNode], 'buffer');
return this.createOrderedEnumerable(keySelector, resolvedComparer, false, node);
```

The node is then stored on the resulting `TyneqOrderedEnumerable` or `TyneqCachedEnumerable`.

### Special case: `thenBy` / `thenByDescending`

These live on `TyneqOrderedEnumerable` and also create their own nodes:

```ts
// Already done — shown here for reference only
const node = new QueryNode('thenBy', [keySelector, comparer], this[tyneqQueryNode], 'buffer');
return new TyneqOrderedEnumerable(..., this, node);
```

### Adding a new method directly on `TyneqEnumerableBase` (rare)

If you add a method directly to the base class (bypassing `@operator`), you must create
the `QueryNode` manually:

```ts
public myDirectMethod(arg: number): TyneqSequence<TSource> {
    const node = new QueryNode('myDirectMethod', [arg], this[tyneqQueryNode], 'streaming');
    return this.createEnumerable({
        getEnumerator: () => new MyDirectEnumerator(this.getEnumerator(), arg)
    }, node);
}
```

---

## 8. QueryPlanVisitor — integrating ordered and cached enumerables

`TyneqOrderedEnumerable` and `TyneqCachedEnumerable` now carry a real `queryNode`. Their
nodes appear in the chain just like any other operator's node. No special visitor handling
is needed — `visit(node)` walks the `node.source` chain uniformly.

Example chain for `.orderBy(fn).thenBy(fn).select(fn)`:

```
from([...])              category: source
  → orderBy(<fn>)        category: buffer
  → thenBy(<fn>)         category: buffer
  → select(<fn>)         category: streaming
```

A visitor can distinguish sort-related operators by `node.operatorName` or
`node.category === 'buffer'`.

---

## 9. Printing and inspecting query plans

Use `QueryPlanPrinter` to render any query node chain as a human-readable string:

```ts
import { Tyneq, QueryPlanPrinter, tyneqQueryNode } from 'tyneq';

const seq = Tyneq.from([1, 2, 3])
    .where(x => x > 1)
    .orderBy(x => x)
    .select(x => x * 2);

// Render the plan to a string:
const plan = QueryPlanPrinter.print(seq[tyneqQueryNode]!);
console.log(plan);

// Custom formatting:
const compact = QueryPlanPrinter.print(seq[tyneqQueryNode]!, { indent: '  ', arrow: '->' });
```

Output:
```
from([...3 items])
  → where(<fn>)
  → orderBy(<fn>)
  → select(<fn>)
```

For a custom visitor (optimizer, serializer, linter), implement `QueryPlanVisitor<T>`:

```ts
import type { IQueryNode, QueryPlanVisitor } from 'tyneq';

class OperatorCounter implements QueryPlanVisitor<number> {
    visit(node: IQueryNode): number {
        return 1 + (node.source ? this.visit(node.source) : 0);
    }
}

const depth = seq[tyneqQueryNode]!.accept(new OperatorCounter());
```

---

## 10. Validating multiple arguments

When an operator has more than one user argument, use `ValidationBuilder` to accumulate all
errors before throwing. This gives the caller all problems at once rather than forcing them
to fix one at a time.

```ts
import { operator } from '../../extensions/operator';
import { ArgumentUtility } from '../../utility/argumentUtility';
import { ValidationBuilder } from '../../utility/ValidationBuilder';

@operator<[size: unknown, selector: unknown]>('paginate', (size, selector) => {
    new ValidationBuilder()
        .check(() => ArgumentUtility.checkPositive({ size: size as number }))
        .check(() => ArgumentUtility.checkNotOptional({ selector }))
        .throwIfAny();
    // throwIfAny() throws a ValidationError listing ALL failures if any check failed.
    // If no checks failed, execution continues normally.
})
export class PaginateEnumerator<T> extends TyneqEnumerator<T, T[]> { ... }
```

Key points:
- `check()` **does not throw** — it catches the error and records the message.
- `throwIfAny()` throws a single `ValidationError` with all messages if any check failed.
- Each `.check()` call takes a zero-argument function wrapping the validation call.
- For a single argument, just call `ArgumentUtility` directly without `ValidationBuilder`.

---

## 11. Adding a third-party operator

External packages can extend Tyneq without modifying the library. The pattern has three parts:

### 11a. Register the operator at runtime

```ts
// my-tyneq-operators/src/repeatEach.ts
import { createStreamingOperator, OperatorMetadata } from 'tyneq/extensions';
import { ArgumentUtility } from 'tyneq/utility';  // if exported; otherwise use own validation

createStreamingOperator({
    name: 'repeatEach',
    // source defaults to 'external' — no need to specify
    validate(times: unknown) {
        ArgumentUtility.checkPositive({ times: times as number });
    },
    *generator(source: Iterable<unknown>, times: number) {
        for (const item of source) {
            for (let i = 0; i < times; i++) yield item;
        }
    }
});
```

Register with extra metadata using the `extensions` bag:

```ts
createStreamingOperator({
    name: 'repeatEach',
    ...
});

// Or with OperatorMetadata directly for OperatorRegistry.register():
OperatorRegistry.register({
    metadata: OperatorMetadata.streaming('repeatEach', { version: '1.0', author: 'me' }),
    impl: function (this, ...args) { ... }
});
```

### 11b. Augment the TypeScript type surface

Registration patches the prototype at runtime, but TypeScript won't know about the new
method until you augment `TyneqSequence`:

```ts
// my-tyneq-operators/src/repeatEach.ts (continued)
declare module 'tyneq' {
    interface TyneqSequence<TSource> {
        repeatEach(times: number): TyneqSequence<TSource>;
    }
}
```

### 11c. Import in the consumer's entry point

```ts
// consumer's main.ts or index.ts
import 'my-tyneq-operators/src/repeatEach';  // side-effect import triggers registration

Tyneq.from([1, 2, 3]).repeatEach(2);  // → [1, 1, 2, 2, 3, 3]
```

---

## 12. Troubleshooting

**"My operator isn't showing up / method does not exist at runtime"**
→ Confirm the operator file is imported as a named import in `src/core/TyneqEnumerableBase.ts`
  (for library operators) or in the consumer's entry point (for third-party operators).
  The `@operator` decorator and `createOperator` only run when the module is imported —
  a missing import means the prototype is never patched.

**"TypeScript says the method doesn't exist (`Property 'myOp' does not exist`)"**
→ For library operators: confirm the method body is in `TyneqEnumerableBase` in the
  correct section, and the signature is in `TyneqSequence` in `src/types/core.ts`.
→ For third-party operators: confirm you added the `declare module 'tyneq'` augmentation
  augmenting `TyneqSequence`.

**"Validation fires too late — error thrown during iteration, not at the call site"**
→ The validation logic is in the constructor instead of in the `validate` callback.
  Move it to the `validate` callback (second/third arg of `@operator`).
  Constructors run lazily; the `validate` callback runs eagerly at the call site.

**"I get `[tyneq] Cannot register '...' already registered` on hot-reload"**
→ Common in test environments or dev servers that re-import modules. Use
  `OperatorRegistry.unregister(name)` in `afterEach` / `beforeAll` teardown, or check
  that the operator file isn't imported twice through different paths (which causes the
  module to execute twice).

**"My buffer operator is registered as `kind: 'streaming'`"**
→ All operators extend `TyneqEnumerator`, so kind inference always returns `'streaming'`.
  Pass the kind explicitly: `@operator('myOp', 'buffer')` or `@operator('myOp', 'buffer', validate)`.

---

## 13. Checklist

- [ ] Chose the right base class (streaming / buffer / terminal)
- [ ] Chose registration API (`@operator` / `createOperator` / `@terminal`)
- [ ] `validate` runs eagerly; constructor does NOT re-validate user args
- [ ] Constructor only validates `sourceEnumerator` being present (infrastructure check)
- [ ] `declare` stub added to `TyneqEnumerableBase` in the correct section
- [ ] Named import added to `src/core/TyneqEnumerableBase.ts`; method body delegates to the operator class
- [ ] QueryNode is threaded (automatic for `@operator`; manual for base-class methods)
- [ ] `npx tsc --noEmit` passes
- [ ] Tests added for the new operator
