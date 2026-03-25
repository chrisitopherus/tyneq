# Building Custom Enumerators

This guide walks through building class-based operators from scratch using `TyneqEnumerator` as the foundation. Each pattern is illustrated by re-implementing an operator you already know how to *use* — so you can focus on the mechanics rather than the problem domain.

> **Prerequisites**: read [Custom Operators](/guide/extensibility) first. That page covers the five registration APIs and when each applies. This page focuses exclusively on the class-based path and the enumerator lifecycle.

## When to Use the Class-Based API

The functional APIs (`createStreamingOperator`, `createOperator`) cover most cases. Reach for `TyneqEnumerator` when:

- You need early termination that triggers upstream disposal (`take`, `first`).
- You buffer the full source in `initialize()` before yielding (`orderBy`, `reverse`).
- You hold a secondary resource (a second enumerator, a large lookup set) that must be released on disposal.
- The logic is complex enough that a class with named fields is cleaner than a closure.

For simple stateless transforms, `createStreamingOperator` is less ceremony.

---

## The Base-Class Hierarchy

```
TyneqBaseEnumerator<TInput, TOutput>   ← root; manages lifecycle state
  └── TyneqEnumerator<TInput, TOutput>  ← wraps an upstream Enumerator; use this
```

You will almost always extend `TyneqEnumerator`. It adds:

- `sourceEnumerator` — the upstream enumerator passed from the operator factory.
- `disposeSource()` — calls `sourceEnumerator.return()` safely when early termination occurs.

`TyneqBaseEnumerator` is the correct base only when there is **no upstream source** (source generators such as `range` or `random`). Never extend it for pipeline operators.

---

## Enumerator Skeleton

Every class-based operator follows this template:

```ts
import { operator, TyneqEnumerator, ArgumentUtility } from "tyneq";
import type { Enumerator } from "tyneq";

@operator<[/* arg types */]>("myOp", (/* args */) => {
    // Validate args here — runs eagerly at the call site before any iteration.
    // Throw ArgumentError / RangeError etc. Do NOT validate in the constructor.
})
export class MyOpEnumerator<TSource> extends TyneqEnumerator<TSource> {
    // Store operator arguments as fields.

    public constructor(sourceEnumerator: Enumerator<TSource> /*, args */) {
        super(sourceEnumerator);         // always first — validates sourceEnumerator
        // Assign this.myArg = myArg.  Do NOT re-validate here.
    }

    // Optional — override for buffer operators only.
    protected override initialize(): void { }

    // Required — the core iteration logic.
    protected override handleNext(): IteratorResult<TSource> {
        // Use this.sourceEnumerator.next() to pull from upstream.
        // Return one of: this.yield(v), this.done(), this.doneWithYield(v), this.earlyComplete()
    }

    // Optional — release internal state (buffers, lookup tables) on early exit.
    protected override disposeAdditional(value?: unknown): void { }
}
```

**The one non-negotiable rule for constructors:** only call `super(sourceEnumerator)` and assign fields. The `validate` callback in `@operator` already ran before construction — don't repeat validation here. Anything you throw from the constructor runs during the *factory* step (lazy), not at the call site, which defeats the eager-error contract.

---

## Choosing the Right Completion Helper

Every `handleNext()` must return exactly one result. The choice depends on what the source returned and whether the operator is stopping early:

| Situation | Return |
|---|---|
| Element available; sequence continues | `this.yield(value)` |
| Source exhausted; nothing left to emit | `this.done()` |
| Source exhausted; one final element | `this.doneWithYield(value)` |
| Operator stops **before** source is exhausted | `this.earlyComplete()` |

The critical distinction is between `done()` and `earlyComplete()`: `done()` does **not** call `dispose()` because the upstream source also terminated naturally. `earlyComplete()` **does** call `dispose()`, which propagates `return()` to the upstream source and releases its resources. Using `done()` when the source is not yet exhausted is a **resource leak** — see [Common Pitfalls](/guide/pitfalls#missing-earlycomplete).

---

## Pattern 1 — Streaming Filter (`where`)

The simplest pattern: inspect each upstream element and either pass it through or skip it.

```ts
import { operator, TyneqEnumerator } from "tyneq";
import type { Enumerator } from "tyneq";

@operator<[predicate: unknown]>("myWhere", (predicate) => {
    if (typeof predicate !== "function") throw new TypeError("myWhere: predicate must be a function");
})
export class MyWhereEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: (item: T) => boolean;

    public constructor(sourceEnumerator: Enumerator<T>, predicate: (item: T) => boolean) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<T> {
        while (true) {
            const result = this.sourceEnumerator.next();
            if (result.done) return this.done();             // source exhausted naturally
            if (this.predicate(result.value)) return this.yield(result.value);
            // predicate false → skip this element, loop to the next
        }
    }
}

declare module "tyneq" {
    interface TyneqSequence<TSource> {
        myWhere(predicate: (item: TSource) => boolean): TyneqSequence<TSource>;
    }
}
```

**Key points:**
- The loop keeps pulling from `sourceEnumerator` until it either finds a matching element or the source ends.
- When the source ends (`result.done`), the source was fully consumed — use `this.done()`, not `this.earlyComplete()`.
- No state beyond the predicate. This operator never needs `initialize()` or `disposeAdditional()`.

---

## Pattern 2 — Early Termination (`take`)

`take(n)` stops consuming the source once `n` elements have been emitted. The source may have more elements — so the operator must call `earlyComplete()` to release it.

```ts
import { operator, TyneqEnumerator } from "tyneq";
import type { Enumerator } from "tyneq";

@operator<[count: unknown]>("myTake", (count) => {
    if (typeof count !== "number" || count < 0) throw new RangeError("myTake: count must be a non-negative number");
})
export class MyTakeEnumerator<T> extends TyneqEnumerator<T> {
    private readonly count: number;
    private emitted = 0;

    public constructor(sourceEnumerator: Enumerator<T>, count: number) {
        super(sourceEnumerator);
        this.count = count;
    }

    protected override handleNext(): IteratorResult<T> {
        if (this.emitted >= this.count) return this.earlyComplete(); // limit reached before source ran out

        const result = this.sourceEnumerator.next();
        if (result.done) return this.done();                         // source ran out before limit

        this.emitted++;
        if (this.emitted === this.count) return this.doneWithYield(result.value); // last allowed element
        return this.yield(result.value);
    }
}

declare module "tyneq" {
    interface TyneqSequence<TSource> {
        myTake(count: number): TyneqSequence<TSource>;
    }
}
```

**Key points:**
- Three distinct exit paths require three distinct helpers:
  1. Limit reached before pulling from source → `earlyComplete()` (source not yet checked, may still have elements).
  2. Source exhausted before limit → `done()` (natural end).
  3. Pulling the last allowed element → `doneWithYield(value)` (natural end, one final element).
- `this.emitted` is instance state — safe because each re-iteration of the parent sequence creates a fresh `MyTakeEnumerator` instance.

---

## Pattern 3 — Type-Transforming Operator (`select`)

When `TInput ≠ TOutput`, declare both type parameters on `TyneqEnumerator<TInput, TOutput>`.

```ts
import { operator, TyneqEnumerator } from "tyneq";
import type { Enumerator } from "tyneq";

@operator<[selector: unknown]>("mySelect", (selector) => {
    if (typeof selector !== "function") throw new TypeError("mySelect: selector must be a function");
})
export class MySelectEnumerator<TSource, TResult> extends TyneqEnumerator<TSource, TResult> {
    private readonly selector: (item: TSource) => TResult;

    public constructor(sourceEnumerator: Enumerator<TSource>, selector: (item: TSource) => TResult) {
        super(sourceEnumerator);
        this.selector = selector;
    }

    protected override handleNext(): IteratorResult<TResult> {
        const result = this.sourceEnumerator.next();
        if (result.done) return this.done();
        return this.yield(this.selector(result.value));
    }
}

declare module "tyneq" {
    interface TyneqSequence<TSource> {
        mySelect<TResult>(selector: (item: TSource) => TResult): TyneqSequence<TResult>;
    }
}
```

**Key points:**
- `TyneqEnumerator<TSource, TResult>` — first parameter is the *input* element type, second is the *output*.
- `handleNext()` returns `IteratorResult<TResult>`, not `IteratorResult<TSource>`.
- Straightforward one-to-one transform: pull one element, map it, yield it.

---

## Pattern 4 — Buffer Operator (`reverse`)

Buffer operators must see the **full** source before producing any output. Override `initialize()` to fill an internal buffer, then `handleNext()` drains it.

```ts
import { operator, TyneqEnumerator } from "tyneq";
import type { Enumerator } from "tyneq";

@operator("myReverse", "buffer", null)   // null = no arguments to validate
export class MyReverseEnumerator<T> extends TyneqEnumerator<T> {
    private buffer: T[] = [];
    private index = 0;

    public constructor(sourceEnumerator: Enumerator<T>) {
        super(sourceEnumerator);
    }

    protected override initialize(): void {
        // Runs once, before the first handleNext() call.
        // At this point sourceEnumerator has not been touched yet.
        while (true) {
            const result = this.sourceEnumerator.next();
            if (result.done) break;
            this.buffer.push(result.value);
        }
        this.index = this.buffer.length - 1;
    }

    protected override handleNext(): IteratorResult<T> {
        if (this.index < 0) return this.done();
        return this.yield(this.buffer[this.index--]);
    }

    protected override disposeAdditional(): void {
        this.buffer = [];   // release element references on early exit
    }
}

declare module "tyneq" {
    interface TyneqSequence<TSource> {
        myReverse(): TyneqSequence<TSource>;
    }
}
```

**Key points:**
- `"buffer"` is the second argument to `@operator` — this sets `OperatorMetadata.kind` correctly so `OperatorRegistry.listByKind("buffer")` and query plan introspection report the right category. Without it the operator is silently registered as `"streaming"`.
- `null` as the third argument explicitly opts out of validation (no user arguments to validate).
- `initialize()` fully consumes `sourceEnumerator`. After it returns, the source is exhausted and `disposeSource()` does not need to call `return()` on it — but it still will (idempotent, safe).
- `disposeAdditional()` clears the buffer array when a consumer breaks out early, releasing element references for GC. Without this override the buffer lives until the enumerator itself is collected. For small buffers this is acceptable; for large ones it is worth the override.

---

## Pattern 5 — Holding a Secondary Resource (`zip`)

Some operators hold a **second** enumerator alongside the primary source. That second enumerator must also be disposed on early exit.

```ts
import { operator, TyneqEnumerator } from "tyneq";
import type { Enumerable, Enumerator } from "tyneq";

@operator<[other: unknown]>("myZip", (other) => {
    if (other == null) throw new TypeError("myZip: other must not be null or undefined");
})
export class MyZipEnumerator<T, U> extends TyneqEnumerator<T, [T, U]> {
    private readonly other: Enumerable<U>;
    private otherEnumerator: Enumerator<U> | null = null;

    public constructor(sourceEnumerator: Enumerator<T>, other: Enumerable<U>) {
        super(sourceEnumerator);
        this.other = other;
    }

    protected override initialize(): void {
        this.otherEnumerator = this.other[Symbol.iterator]() as Enumerator<U>;
    }

    protected override handleNext(): IteratorResult<[T, U]> {
        const left  = this.sourceEnumerator.next();
        const right = this.otherEnumerator!.next();
        if (left.done || right.done) return this.earlyComplete();  // shorter sequence ends first
        return this.yield([left.value, right.value]);
    }

    protected override disposeAdditional(): void {
        if (this.otherEnumerator) {
            this.otherEnumerator.return?.();
            this.otherEnumerator = null;
        }
    }
}

declare module "tyneq" {
    interface TyneqSequence<TSource> {
        myZip<TOther>(other: TyneqSequence<TOther>): TyneqSequence<[TSource, TOther]>;
    }
}
```

**Key points:**
- The secondary enumerator is created in `initialize()` — not the constructor — because `initialize()` runs at the moment iteration begins, which matches the lazy contract.
- When either sequence runs out first, `earlyComplete()` is correct: the other sequence may still have elements and must be released.
- `disposeAdditional()` calls `return()` on the secondary enumerator. `disposeSource()` (inherited from `TyneqEnumerator`) handles the primary source.
- Note the optional chaining `return?.()` — `Enumerator.return` is optional per the iterator protocol.

---

## The `initialize()` Contract

`initialize()` runs **exactly once**, immediately before the first `handleNext()` call. Key constraints:

- At the time `initialize()` runs, `sourceEnumerator` has not been touched. You may pull from it freely.
- `handleNext()` will not be called until after `initialize()` returns.
- Do **not** call `this.yield()`, `this.done()`, etc. from `initialize()` — these are only meaningful return values for `handleNext()`.
- If you allocate resources in `initialize()`, release them in `disposeAdditional()`.

Buffer operators should drain the entire source in `initialize()` and store the result. Streaming operators typically leave `initialize()` empty.

---

## Registering Without Arguments

For no-arg operators, `validate` can be omitted entirely or set to `null`:

```ts
@operator("myReverse", "buffer")          // validate omitted — streaming: @operator("opName")
@operator("myReverse", "buffer", null)    // explicit opt-out — same runtime effect
```

---

## Common Mistakes

### 1. Calling `done()` when the source is not exhausted

```ts
// ❌ Wrong — source still has elements; upstream resources are leaked
protected override handleNext(): IteratorResult<T> {
    if (this.emitted >= this.count) return this.done();
    // ...
}

// ✅ Correct
protected override handleNext(): IteratorResult<T> {
    if (this.emitted >= this.count) return this.earlyComplete();
    // ...
}
```

### 2. Validating in the constructor

```ts
// ❌ Wrong — error fires during factory construction (deferred), not at call site
public constructor(sourceEnumerator: Enumerator<T>, count: number) {
    super(sourceEnumerator);
    if (count < 0) throw new RangeError("count must be >= 0");
}

// ✅ Correct — validate callback fires eagerly at the call site
@operator<[count: unknown]>("myTake", (count) => {
    if (typeof count !== "number" || count < 0) throw new RangeError("count must be >= 0");
})
```

### 3. Forgetting `"buffer"` on a buffer operator

```ts
// ❌ Kind defaults to "streaming" — OperatorRegistry and query plans will misreport it
@operator("myReverse", null)

// ✅ Explicit kind
@operator("myReverse", "buffer", null)
```

### 4. Allocating the secondary enumerator in the constructor

```ts
// ❌ Wrong — breaks lazy contract; the secondary sequence is iterated at construction time
public constructor(sourceEnumerator: Enumerator<T>, other: Enumerable<U>) {
    super(sourceEnumerator);
    this.otherEnumerator = other[Symbol.iterator]() as Enumerator<U>;
}

// ✅ Correct — allocate in initialize(), which runs at the start of iteration
protected override initialize(): void {
    this.otherEnumerator = this.other[Symbol.iterator]() as Enumerator<U>;
}
```

### 5. Returning a raw object instead of a helper

```ts
// ❌ Works, but inconsistent — misses doneWithYield / earlyComplete opportunities
return { done: false, value: item };

// ✅ Consistent — uses the typed helpers the base class provides
return this.yield(item);
```

---

## Related Pages

- [Custom Operators](/guide/extensibility) — functional registration APIs and the full operator authoring workflow
- [Common Pitfalls](/guide/pitfalls) — lazy evaluation traps including the missing `earlyComplete` resource-leak pattern
- [API Reference: TyneqEnumerator](/api/reference/) — full generated docs for base class methods
