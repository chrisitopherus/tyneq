# HOWTO — Implementing New Operators

This document walks through the full workflow for adding a new operator to Tyneq,
covering every decision point: base class choice, registration API choice, validation
contract, QueryNode threading, and the special cases for ordered and cached enumerables.

---

## 1. Decide the operator category

| Category | Description | Base class |
|---|---|---|
| **Streaming** | Transforms elements one-at-a-time; O(1) space | `TyneqEnumerator<TSource, TResult>` |
| **Buffer** | Must see some/all elements before yielding; O(n) space | `TyneqEnumerableEnumerator<TSource, TResult>` |
| **Terminal** | Consumes the sequence and returns a concrete value | `TyneqTerminalOperator<TSource, TResult>` |

Use streaming unless the operator requires random access, sorting, or set operations.
Use terminal when the result is a value (number, boolean, array, etc.), not a sequence.

---

## 2. Choose the registration API

Two APIs are available and both route through `OperatorRegistry`:

| API | When to use |
|---|---|
| `@operator` / `@terminal` decorator | You already have a class with constructor logic (most library operators) |
| `createOperator` / `createGeneratorOperator` / `createTerminalOperator` | Simple one-off or third-party operators; generator functions preferred |

The two are interchangeable in terms of runtime behaviour. Pick whichever fits
the amount of structural ceremony you want.

---

## 3. Path A — Class-based with `@operator`

### 3a. Write the enumerator class

```ts
// src/enumerators/streaming/myOp.ts
import { TyneqEnumerator } from '../../core/enumerators/TyneqEnumerator';
import { operator } from '../../extensibility/operatorDecorators';
import { ArgumentUtility } from '../../utility/argumentUtility';

@operator<[threshold: unknown]>('myOp', (threshold) => {
    ArgumentUtility.checkNotOptional({ threshold });
    ArgumentUtility.checkPositive({ threshold });   // example validation
})
export class MyOpEnumerator<TSource> extends TyneqEnumerator<TSource, TSource> {
    private readonly threshold: number;

    public constructor(sourceEnumerator: IEnumerator<TSource>, threshold: number) {
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
- The first parameter must be `sourceEnumerator: IEnumerator<TSource>` (infrastructure — never validate it).
- User arguments come after; do NOT re-validate them — `@operator`'s `validate` runs first.
- Throw `ArgumentError` / `ArgumentNullError` / `ArgumentOutOfRangeError` from `validate`, not from the constructor.

**Enumerator lifecycle** (for `TyneqEnumerator` / `TyneqEnumerableEnumerator`):
- `initialize()` — called once on the first `next()`. Override to set up buffers.
- `handleNext()` — called on every subsequent `next()`. Return `{ value, done: false }` or `{ value: undefined, done: true }`.
- `dispose(value?)` — override for early-termination cleanup.

### 3b. Register by importing the module

The `@operator` decorator fires at class-evaluation time. The class module must be
imported before the method is available on `TyneqEnumerableBase.prototype`.

Add the import to the operator barrel file that is re-exported by `src/index.ts`:

```ts
// src/operators/extensions/index.ts
export * from '../../enumerators/streaming/myOp';
```

---

## 4. Path B — Functional with `createOperator`

```ts
// src/operators/streaming/myOp.ts
import { createGeneratorOperator } from '../../extensibility/createOperator';
import { ArgumentUtility } from '../../utility/argumentUtility';

createGeneratorOperator<[threshold: unknown]>(
    'myOp',
    (threshold) => {
        ArgumentUtility.checkNotOptional({ threshold });
    },
    function* (source, threshold: number) {
        for (const item of source) {
            if (/* condition based on threshold */) {
                yield item;
            }
        }
    }
);
```

Add the import to the same barrel file so it runs at module-load time.

---

## 5. Terminal operators with `@terminal`

```ts
// src/operators/terminal/myTerminal.ts
import { terminal } from '../../extensibility/operatorDecorators';
import { TyneqTerminalOperator } from '../../core/operator/TyneqTerminalOperator';
import { ArgumentUtility } from '../../utility/argumentUtility';

@terminal<[selector: unknown]>('myTerminal', (selector) => {
    ArgumentUtility.checkNotOptional({ selector });
    ArgumentUtility.checkFunction({ selector });
})
export class MyTerminalOperator<TSource> extends TyneqTerminalOperator<TSource, number> {
    private readonly selector: (item: TSource) => number;

    public constructor(source: IEnumerable<TSource>, selector: (item: TSource) => number) {
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
declare myOp: (threshold: number) => ITyneqEnumerable<TSource>;

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
const node = new QueryNode('orderBy', [keySelector, comparer], this.queryNode, 'buffer');
return this.createOrderedEnumerable(keySelector, resolvedComparer, false, node);
```

The node is then stored on the resulting `TyneqOrderedEnumerable` or `TyneqCachedEnumerable`.

### Special case: `thenBy` / `thenByDescending`

These live on `TyneqOrderedEnumerable` and also create their own nodes:

```ts
// Already done — shown here for reference only
const node = new QueryNode('thenBy', [keySelector, comparer], this.queryNode, 'buffer');
return new TyneqOrderedEnumerable(..., this, node);
```

### Adding a new method directly on `TyneqEnumerableBase` (rare)

If you add a method directly to the base class (bypassing `@operator`), you must create
the `QueryNode` manually:

```ts
public myDirectMethod(arg: number): ITyneqEnumerable<TSource> {
    const node = new QueryNode('myDirectMethod', [arg], this.queryNode, 'streaming');
    return this.createEnumerable({
        getEnumerator: () => new MyDirectEnumerator(this.getEnumerator(), arg)
    }, node);
}
```

---

## 8. IQueryPlanVisitor — integrating ordered and cached enumerables

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
import { Tyneq, QueryPlanPrinter } from 'tyneq';

const seq = Tyneq.from([1, 2, 3])
    .where(x => x > 1)
    .orderBy(x => x)
    .select(x => x * 2);

// Print to console:
QueryPlanPrinter.print(seq.queryNode!);

// Capture as string (no console output):
const plan = QueryPlanPrinter.print(seq.queryNode!, { output: 'none' });

// Write to a file:
QueryPlanPrinter.print(seq.queryNode!, { output: './query-plan.txt' });
```

Output:
```
from([...3 items])
  → where(<fn>)
  → orderBy(<fn>, undefined)
  → select(<fn>)
```

For a custom visitor (optimizer, serializer, linter), implement `IQueryPlanVisitor<T>`:

```ts
import type { IQueryNode, IQueryPlanVisitor } from 'tyneq';

class OperatorCounter implements IQueryPlanVisitor<number> {
    visit(node: IQueryNode): number {
        return 1 + (node.source ? this.visit(node.source) : 0);
    }
}

const depth = seq.queryNode!.accept(new OperatorCounter());
```

---

## 10. Checklist

- [ ] Chose the right base class (streaming / buffer / terminal)
- [ ] Chose registration API (`@operator` / `createOperator` / `@terminal`)
- [ ] `validate` runs eagerly; constructor does NOT re-validate user args
- [ ] Constructor only validates `sourceEnumerator` being present (infrastructure check)
- [ ] `declare` stub added to `TyneqEnumerableBase` in the correct section
- [ ] Module imported in the correct barrel (`src/operators/extensions/index.ts`)
- [ ] QueryNode is threaded (automatic for `@operator`; manual for base-class methods)
- [ ] `npx tsc --noEmit` passes
- [ ] Tests added for the new operator
