# ATTENTION — Items Needing Awareness or Future Work

Items in this file are not bugs. They are deliberate trade-offs, known limitations, or
architectural decisions that don't fit cleanly into any of the four refactoring tasks
but deserve to be documented so future maintainers aren't surprised.

---

## 1. Constructor Constraint `any[]` in Decorators — Intentional

**Location**: `src/extensibility/operatorDecorators.ts`

```ts
<TClass extends new (...args: any[]) => any>        // @operator
<TClass extends new (...args: any[]) => { process(): unknown }> // @terminal
```

These are the only remaining `any` usages in the codebase, and they are **intentional**.

**Why they can't be removed**: TypeScript class decorator constraints must accept a
constructor signature broad enough to match any decorated class. Using `unknown[]` in the
constructor position fails because TypeScript's contravariant function-parameter checking
rejects it — no concrete enumerator class could satisfy `new (...args: unknown[]) => any`
in practice. The `any[]` here is a TypeScript decorator idiom, not a runtime bypass; the
actual user-arg types are enforced through the typed `validate` parameter (TArgs), not
through the constructor constraint.

**What guards correctness**: The `validate` function receives `TArgs`-typed parameters and
runs eagerly before the enumerator is constructed. The constructor constraint is purely
structural glue for the decorator factory pattern.

---

## 2. Dual Registration Systems — Candidates for Convergence

**Location**: `src/extensibility/operatorDecorators.ts` and `src/extensibility/createOperator.ts`

The codebase has two operator registration APIs:
- `@operator` / `@terminal` decorators (class-based, TC39 stage 3)
- `createOperator` / `createGeneratorOperator` / `createTerminalOperator` (functional)

Both route through `OperatorRegistry.register()`, but they differ in ergonomics and
ceremony level. Long-term, they could be unified under a single functional API that also
accepts class constructors, but this is a larger DX decision.

**Current recommendation**: Keep both. The decorator path is natural for library-internal
operators that already have class structure. The functional path is better for simple
one-off or third-party operators.

---

## 3. `TyneqOrderedEnumerable` and `TyneqCachedEnumerable` — `queryNode` Always `null`

**Location**: `src/core/ordering/TyneqOrderedEnumerable.ts`, `src/core/cache/TyneqCachedEnumerable.ts`

Both subclasses declare `public readonly queryNode: IQueryNode | null = null` as a fixed
`null`. This means that when `orderBy` or `memoize` are the root operators, their
`queryNode` is `null` rather than a meaningful `QueryNode`.

**Why**: `TyneqOrderedEnumerable` and `TyneqCachedEnumerable` are created directly by
their respective operator impls (`@operator` + enumerator class for `orderBy`, and the
`memoize` class for memoize). The `createEnumerable` chain that threads `QueryNode`s
does not currently feed into the constructor of these concrete subclasses.

**Correct fix** (deferred): Thread a `node?: IQueryNode | null` constructor parameter
through `TyneqOrderedEnumerable` and `TyneqCachedEnumerable`, and pass the node from the
registered `impl` function. This is straightforward but touches class constructors that
were intentionally left minimal.

---

## 4. `createEnumerable` Protected Access — Structural Cast Pattern

**Location**: `src/extensibility/operatorDecorators.ts`, `src/extensibility/createOperator.ts`

```ts
interface IWithCreateEnumerable {
    createEnumerable(factory: { getEnumerator(): unknown }, node?: IQueryNode | null): unknown;
    readonly queryNode: IQueryNode | null;
}
// ...
return (this as unknown as IWithCreateEnumerable).createEnumerable(factory, node);
```

`createEnumerable` is `protected` on `TyneqEnumerableBase`. The registration impls run
with `this` typed as `TyneqEnumerableBase<unknown>`, which cannot directly call protected
methods from outside the class hierarchy.

The `IWithCreateEnumerable` structural interface sidesteps this by describing the shape
at the call site without violating TypeScript's access modifier rules. The double-cast
`as unknown as IWithCreateEnumerable` is required because `TyneqEnumerableBase` does not
have an index signature.

**This is safe**: At runtime, `this` is always a `TyneqEnumerable` or subclass instance,
so `createEnumerable` always exists and behaves correctly. The cast is purely a type-level
accommodation for the `protected` modifier.

---

## 5. Divergent Enumerator Hierarchies

**Location**: `src/core/enumerators/TyneqEnumerator.ts`, `src/core/operator/TyneqTerminalOperator.ts`

The two base classes have similar structural purposes (wrap a source, produce output) but
entirely different APIs:

- `TyneqEnumerator<TSource, TResult>` — wraps `IEnumerator<TSource>`, implements `IEnumerator<TResult>` (streaming/buffering)
- `TyneqTerminalOperator<TSource, TResult>` — wraps `IEnumerable<TSource>`, exposes `process(): TResult` (terminal)

A unified `IOperator<TInput, TOutput>` interface could describe both, enabling shared
introspection, testing utilities, and documentation tooling. However, the semantic
difference (iterators vs. functions) makes unification non-trivial without adding
unnecessary abstraction.

**Current recommendation**: Leave the hierarchies separate. Document the distinction
clearly so operators land in the right base class.

---

## 6. `argumentUtility.ts` — Candidate for Splitting

**Location**: `src/utility/argumentUtility.ts` (~930 lines)

This file is large enough that it should be split into focused modules:

| Module                     | Contents                                    |
|----------------------------|---------------------------------------------|
| `nullGuards.ts`            | `checkNotOptional`, `checkNotNull`          |
| `numericGuards.ts`         | `checkPositive`, `checkNonNegative`, `checkInteger`, `checkInRange` |
| `typeGuards.ts`            | `checkFunction`, `checkString`, `checkBoolean` |
| `collectionGuards.ts`      | `checkIterable`, `checkIterator`, `checkNotEmpty` |

The `ArgumentUtility` static class would remain as a re-export facade for backwards
compatibility. No behavioural changes needed.

---

## 7. `QueryNode` Args Capture Lambdas by Reference

**Location**: `src/queryplan/QueryNode.ts`, all operator registration impls

`IQueryNode.args` stores the raw `unknown[]` args array passed at registration time,
which may include lambda functions (e.g., `(x) => x.name`). This is correct for
structural inspection, but:

- **Serialization**: Functions are not JSON-serializable. Visitor implementations that
  serialize query plans must handle `typeof arg === 'function'` explicitly.
- **Memory**: Long-lived query nodes hold references to closure objects. If those closures
  capture large data, the query plan tree will retain it.

**No action needed** for the core library — this is expected behaviour documented in
`IQueryNode.args`. Visitor authors should be aware.

---

## 8. `Tyneq.empty()` QueryNode Chains Through `from([])`

**Location**: `src/core/tyneq.ts` — `Tyneq.empty<T>()`

```ts
public static empty<TSource>(): ITyneqEnumerable<TSource> {
    return this.from<TSource>([]);
}
```

`empty()` delegates to `from([])`, so its `queryNode` will be `QueryNode('from', [[]], null, 'source')`.
This accurately describes what happened at runtime (wrapped an empty array), but a
dedicated `QueryNode('empty', [], null, 'source')` would be more semantically correct for
query plan inspection.

**Low priority** — a visitor can detect `from` with an empty array arg if needed.
