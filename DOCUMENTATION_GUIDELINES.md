# Documentation Guidelines — Tyneq

**Toolchain:** TypeDoc + `typedoc-plugin-markdown`. All comments must be valid TSDoc.
**Target reader:** Developers familiar with LINQ or RxJS. Assume fluency with TypeScript generics.

---

## The One Rule

> **A comment must tell the reader something the signature cannot.**

If the reader can infer it from the name, the types, and common sense — omit it.
Documentation that restates the obvious creates noise and maintenance debt.

| Adds value | Doesn't |
|---|---|
| Empty-sequence behavior | That the method accepts a predicate |
| Stable vs. unstable sort guarantee | That it returns `this` type |
| When deferred becomes immediate | That it "filters elements" (the name is `where`) |
| Exact error type and trigger condition | `@param value - The value.` |

---

## Terminology

Use exactly. No synonyms.

| Term | Meaning |
|---|---|
| **sequence** | Any `IEnumerable<T>` value |
| **source** | The upstream sequence passed into an operator |
| **element** | A single item produced by a sequence |
| **predicate** | `(item: T) => boolean` |
| **selector** | `(item: T) => TResult` projection |
| **accumulator** | `(acc: TResult, item: T) => TResult` fold |
| **comparer** | `(a: T, b: T) => number` — negative = less than, 0 = equal, positive = greater than |
| **streaming operator** | O(1) space; yields one element at a time; deferred |
| **buffering operator** | O(n) space; materialises the full source before yielding; deferred |
| **terminal operator** | Returns a concrete value; forces immediate evaluation |
| **deferred execution** | Source not iterated until the returned sequence is iterated |
| **immediate execution** | Source fully iterated at the point of the method call |

---

## What to Document

### Always

- **`@throws`** — the exact error class and the exact condition. Callers can't see this in the type system.
- **Edge-case behavior** — empty sequences, `null`/`undefined` elements, zero-length ranges.
- **Non-obvious ordering or stability guarantees** — e.g. stable sort, original-index preservation.
- **Execution model for operators** — deferred or immediate, and when buffering occurs.

### When it adds clarity

- **`@param`** — only when the meaning isn't obvious from the name and type together. Skip `count`, `predicate`, `selector` when their role is self-evident from context.
- **`@returns`** — only when the return value has semantics beyond its type (e.g. "returns the first matching element, or `undefined` if none").
- **`@example`** — wherever calling the API is non-obvious or the output is surprising. Prefer one focused example over a comprehensive one.
- **`@remarks`** — for behavioral caveats, performance notes, or constraints the summary line can't hold. Not for restating the summary.
- **`@see`** — when a related symbol is genuinely helpful for navigation. Not as a reflex.

### Never

- Don't describe what the TypeScript signature already says.
- Don't document `@internal` symbols beyond what contributors need to safely override or extend them.
- Don't add `@param` entries that just repeat the parameter name: `@param value - The value.`
- Don't write `@example` on `@internal` classes or interface members — put examples on the concrete public API.
- Don't document inherited members unless behavior differs from the parent.

---

## Execution Model (Operators)

State execution model as the **first line of `@remarks`** on every operator. Use these standard phrases so readers build pattern recognition across the library:

| Kind | Standard phrasing |
|---|---|
| Streaming | `Deferred. Source is not enumerated until the returned sequence is iterated.` |
| Buffering | `Deferred. Source is fully buffered on the first iteration of the returned sequence.` |
| Terminal | `Immediate. Source is fully enumerated when this method is called.` |

Adapt only when an operator has genuinely unusual semantics (e.g. partial buffering). In that case, explain what actually happens — don't force a misfit phrase.

---

## TypeDoc Metadata

These tags control grouping in generated docs. They are metadata, not documentation.

| Tag | When to apply |
|---|---|
| `@group Operators` | All operator classes |
| `@group Interfaces` / `Classes` / `Errors` / `Types` / `Decorators` / `Utilities` / `QueryPlan` | Other exported symbols by kind |
| `@category Streaming` / `Buffering` / `Terminal` | Operator classes only |
| `@internal` | Enumerators, abstract bases not in the public extensibility API, utility classes |

Keep these on a single line at the end of the block. They don't need prose around them.

---

## Templates

Templates show the **minimum viable** comment. Add only what passes the one rule.

### Interface

```ts
/**
 * [What contract this represents. One sentence.]
 *
 * @remarks
 * [Guarantees: invariants, re-iterability, what it adds beyond its parent — only if non-obvious.]
 *
 * @typeParam T - [Role in the contract, if not obvious.]
 *
 * @group Interfaces
 */
export interface IExample<T> { ... }
```

Interface **members** — document the contract, not an implementation. Omit if the signature is self-explanatory.

```ts
/**
 * [What this does or holds. One sentence. Omit if obvious from the name.]
 *
 * @returns [Guarantee beyond the return type — e.g. "always a new instance".]
 * @throws {SomeError} When [exact condition].
 */
memberName(): ReturnType;
```

---

### Streaming Operator

```ts
/**
 * [Verb phrase: what the operator does to the sequence.]
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * [Ordering guarantee. Per-element call count. Any other non-obvious behavioral contract.]
 *
 * **Performance:** O(1) space. O(n) time.
 *
 * @typeParam TResult - [Only if different from TSource and not obvious.]
 *
 * @see {@link CorrespondingEnumerator}
 * @see {@link ITyneqEnumerable.methodName}
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
```

---

### Buffering Operator

Same as streaming, with:
- `Deferred. Source is fully buffered on the first iteration of the returned sequence.`
- `**Performance:** O(n) space (full buffer). O(n) time.`
- `@category Buffering`

---

### Terminal Operator

```ts
/**
 * [Verb phrase: what this computes.]
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * [Empty-sequence behavior — throws or returns a defined value. Always document this.]
 *
 * **Performance:** O(n) time. O(1) space. [Adjust if buffering occurs.]
 *
 * @see {@link ITyneqEnumerable.methodName}
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
```

`process()` — document only throws and non-obvious return value:

```ts
/**
 * @returns [What is returned.]
 * @throws {SequenceContainsNoElementsError} When the source is empty.
 */
public override process(): ResultType { ... }
```

---

### Enumerator

Document only what contributors need to safely override:

```ts
/**
 * Enumerates [what it does step by step].
 *
 * @remarks
 * [What `initialize()` sets up. What `handleNext()` produces per step. What `dispose()` releases.]
 *
 * @internal
 */
```

No `@example`. No `@group`. Enumerators are contributor-facing only.

---

### Error

```ts
/**
 * Thrown when [exact condition, one sentence].
 *
 * @remarks
 * [How to distinguish from related error types — only if genuinely ambiguous.]
 *
 * @example
 * ```ts
 * try {
 *   Tyneq.from([]).first();
 * } catch (e) {
 *   if (e instanceof SequenceContainsNoElementsError) { ... }
 * }
 * ```
 *
 * @see {@link TyneqError}
 * @group Errors
 */
```

`@example` with `instanceof` catch is required — it shows how callers handle the error.

---

### Decorator Function

```ts
/**
 * [Verb phrase: what the decorator does when applied.]
 *
 * @remarks
 * [When registration happens. What the decorated class must extend. Duplicate-name behavior.]
 *
 * @param name - The method name to register on `TyneqEnumerableBase.prototype`.
 *
 * @example
 * ```ts
 * \@operator('double')
 * export class DoubleOperator<T extends number> extends TyneqOperatorEnumerable<T> {
 *   constructor(source: IEnumerable<T>) { super(source); }
 *   getEnumerator() { return new DoubleEnumerator(this.source[Symbol.iterator]()); }
 * }
 * // seq.double() is now available on every ITyneqEnumerable
 * ```
 *
 * @throws {Error} When `name` is already registered.
 * @group Decorators
 */
```

---

### Type Alias

```ts
/**
 * [What this type represents.]
 *
 * @remarks
 * [When to prefer this over a related type — only if the distinction is non-obvious.]
 *
 * @example
 * ```ts
 * const a: Nullable<string> = null;      // → valid
 * const b: Nullable<string> = undefined; // → compile error
 * ```
 *
 * @group Types
 */
```

`@example` only when the distinction from a similar type would otherwise be unclear.

---

### Utility Class

```ts
/**
 * [What category of helpers this groups. One sentence.]
 *
 * @group Utilities
 * @internal
 */
```

Document public static methods only. Skip `@internal` methods — the code is the doc.

---

## Style

- **Active voice.** "Returns", "Throws", "Yields" — not "is returned", "will be thrown".
- **Certainty language.** `returns` / `throws` for guaranteed behavior. `may` only when genuinely conditional.
- **No marketing.** "powerful", "elegant", "seamless", "easy-to-use" are banned.
- **Expected output.** Use `// → value` as an inline comment, not `console.log`.
- **`@param` describes meaning, not the name.** "The maximum number of elements to return" not "The count parameter."
- **If it fits in one sentence, use one sentence.**

---

## Definition of Done

A documented symbol is done when:

1. Every `@throws` names the exact error class and exact trigger condition.
2. Every operator has an execution model statement as the first line of `@remarks`.
3. Empty-sequence behavior is stated for every terminal operator.
4. `@example` is present wherever it's required (errors, decorators, non-obvious operators).
5. No comment restates what the TypeScript signature already says.
6. `@group` (and `@category` for operators) is present on every exported symbol.
7. Prose is active voice, terse, no filler.
