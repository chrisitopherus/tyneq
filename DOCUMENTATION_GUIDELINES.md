# Documentation Guidelines — Tyneq

Single source of truth for JSDoc/TSDoc across the Tyneq library.
**Toolchain:** TypeDoc + `typedoc-plugin-markdown`. Comments must be valid TSDoc.
**Target reader:** Developers familiar with LINQ or Rx.js. No tutorials — precise semantics only.

---

## Terminology

Use exactly. No synonyms.

| Term | Meaning |
|---|---|
| **sequence** | Any `IEnumerable<T>` value |
| **source** | The upstream sequence passed into an operator |
| **element** | A single item produced by a sequence during iteration |
| **predicate** | `(item: T) => boolean` |
| **selector** | `(item: T) => TResult` projection |
| **accumulator** | `(acc: TResult, item: T) => TResult` fold |
| **comparer** | `(a: T, b: T) => number`; negative = less than, 0 = equal, positive = greater than |
| **streaming operator** | O(1) space; yields elements one-at-a-time; deferred |
| **buffering operator** | O(n) space; materialises source before yielding; deferred |
| **terminal operator** | Returns a concrete value; forces immediate evaluation |
| **deferred execution** | Source not iterated until the returned sequence is iterated |
| **immediate execution** | Source fully iterated at the point of the method call |

---

## Required Tags

### `@group` (required on every exported symbol)

| Symbol kind | `@group` |
|---|---|
| Interfaces | `Interfaces` |
| Abstract or concrete classes | `Classes` |
| Streaming / buffering / terminal operator classes | `Operators` |
| Enumerator classes | `Enumerators` |
| Error classes | `Errors` |
| Type aliases | `Types` |
| Decorator functions | `Decorators` |
| Utility classes | `Utilities` |
| QueryPlan types | `QueryPlan` |

### `@category` (operator classes only)

| Operator kind | `@category` |
|---|---|
| Streaming | `Streaming` |
| Buffering | `Buffering` |
| Terminal | `Terminal` |

### `@internal`

Apply to: enumerator classes, abstract base classes not in the public extensibility API,
utility classes used only internally. TypeDoc excludes `@internal` symbols from generated docs.

---

## Execution Model

First sentence of `@remarks` — verbatim, no paraphrase:

**Streaming:**
> This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.

**Buffering:**
> This method uses deferred execution. The source sequence is fully buffered on first iteration of the returned sequence.

**Terminal:**
> This method uses immediate execution. The source sequence is fully enumerated when this method is called.

---

## Templates

### Interface

```ts
/**
 * [What this contract represents.]
 *
 * @remarks
 * [Guarantees: invariants, protocol requirements, re-iterability contract.
 *  What this interface adds beyond any parent it extends.]
 *
 * @typeParam T - [Role in this contract.]
 *
 * @see {@link RelatedType}
 *
 * @group Interfaces
 */
export interface IExample<T> { ... }
```

Member:

```ts
/**
 * [What calling this does or what this property holds.]
 *
 * @remarks
 * [Contract callers can rely on. Does each call return an independent instance?]
 *
 * @returns [Shape and guarantee of the return value.]
 */
methodName(): ReturnType;
```

Rules:
- Document the contract, not an implementation.
- No `@example` on interface members — examples belong on concrete classes or factory methods.
- If the interface extends another, document what it *adds*, not what the parent already covers.

---

### Concrete / Abstract Class

```ts
/**
 * [What this class is and does.]
 *
 * @remarks
 * [Key characteristics: laziness, re-iterability, how instances are obtained.
 *  For abstract classes: which methods subclasses must override and what they must guarantee.]
 *
 * @typeParam TSource - [Meaning.]
 *
 * @example
 * ```ts
 * const seq = Tyneq.from([1, 2, 3]).where(n => n > 1);
 * ```
 *
 * @see {@link TyneqEnumerableBase}
 *
 * @group Classes
 */
export class TyneqExample<TSource> { ... }
```

Rules:
- Abstract base classes not in the public extensibility API → add `@internal`.
- If only obtained via a factory (not `new`), say so in `@remarks`.
- Omit `@example` for `@internal` classes.

---

### Streaming Operator

```ts
/**
 * [What the operator does to the sequence. Starts with a verb.]
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the
 * returned sequence is iterated.
 *
 * [Order preservation, predicate call count, what is yielded.]
 *
 * **Performance:** O(1) space. O(n) time when fully enumerated.
 *
 * @typeParam TSource - Element type of the source sequence.
 * @typeParam TResult - Element type of the output sequence. [Omit if same as TSource.]
 *
 * @see {@link CorrespondingEnumerator}
 * @see {@link ITyneqEnumerable.methodName}
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
@operator('methodName')
export class ExampleOperator<TSource> extends TyneqOperatorEnumerable<TSource> { ... }
```

Rules:
- Always `@internal`. No `@example` (belongs on the interface method).
- `@see` to enumerator and public API method are mandatory.

---

### Buffering Operator

Same as streaming with:
- Execution model sentence: `...fully buffered on first iteration of the returned sequence.`
- Performance: `**Performance:** O(n) space (full buffer). O(n) time when fully enumerated.`
- `@category Buffering`

---

### Terminal Operator

```ts
/**
 * [What this terminal operation computes.]
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when
 * this method is called.
 *
 * [Empty-sequence behavior. Default comparer behavior if applicable.]
 *
 * **Performance:** O(n) time. O(1) space. [Adjust space if buffering is needed.]
 *
 * @typeParam T - Element type of the source sequence.
 *
 * @see {@link ITyneqEnumerable.methodName}
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('methodName')
export class ExampleTerminalOperator<T> extends TyneqTerminalOperator<T, ResultType> { ... }
```

`process()`:

```ts
/**
 * Executes the terminal operation.
 *
 * @returns [What is returned.]
 *
 * @throws {SequenceContainsNoElementsError} When the source is empty.
 */
public override process(): ResultType { ... }
```

Rules:
- Always document empty-sequence behavior — throws or returns a defined default.
- Always `@internal`.

---

### Enumerator

```ts
/**
 * Enumerator that [what it does during iteration].
 *
 * @remarks
 * [Lifecycle: what initialize() sets up, what handleNext() does per step,
 *  what dispose() releases. State maintained between calls.]
 *
 * @typeParam TInput  - Source element type.
 * @typeParam TOutput - Output element type. [Omit if same as TInput.]
 *
 * @see {@link CorrespondingOperatorClass}
 *
 * @internal
 */
export class ExampleEnumerator<TInput, TOutput> extends TyneqBaseEnumerator<TInput, TOutput> { ... }
```

Rules:
- Always `@internal`. No `@example`. Document lifecycle hooks for contributors.

---

### Error

```ts
/**
 * [What condition this error signals. One sentence.]
 *
 * @remarks
 * [When the library throws this. How to distinguish from related error types.]
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
 *
 * @group Errors
 */
export class SpecificError extends TyneqError { ... }
```

Rules:
- `@example` must show a `try/catch` with `instanceof`. Required.
- Do not document inherited `.name`, `.message`, `.stack`.

---

### Type Alias

```ts
/**
 * [What this type represents.]
 *
 * @remarks
 * [When to use vs. related types. TypeScript-specific behavior.]
 *
 * @typeParam T - [Meaning.]
 *
 * @example
 * ```ts
 * const value: Nullable<string> = null;   // → valid
 * const bad: Nullable<string> = undefined; // → compile error
 * ```
 *
 * @see {@link Optional}
 *
 * @group Types
 */
export type Nullable<T> = T | null;
```

Rules:
- `@example` required when the distinction from related types is non-obvious.
- For conditional types, show at least one true case and one false case.

---

### Decorator Function

```ts
/**
 * [What the decorator does when applied. Starts with a verb.]
 *
 * @remarks
 * [When registration happens. What the decorated class must extend.
 *  What happens if the name is already registered.]
 *
 * @param name - The method name to inject on `TyneqEnumerableBase.prototype`.
 *
 * @example
 * ```ts
 * \@operator('double')
 * export class DoubleOperator<T extends number> extends TyneqOperatorEnumerable<T> {
 *   constructor(source: IEnumerable<T>) { super(source); }
 *   getEnumerator() { return new DoubleEnumerator(this.source[Symbol.iterator]()); }
 * }
 * // seq.double() is now available on every ITyneqEnumerable instance
 * ```
 *
 * @throws {Error} When `name` is already registered on `TyneqEnumerableBase.prototype`.
 *
 * @group Decorators
 */
export function operator(name: string) { ... }
```

Rules:
- `@example` required with a realistic end-to-end registration.
- Use `\@operator` (escaped) inside example code blocks.

---

### Utility Class

```ts
/**
 * [What category of helpers this groups.]
 *
 * @remarks
 * [Internal only, contributor use, or public. Any global state or side effects.]
 *
 * @group Utilities
 * @internal
 */
export class ExampleUtility { ... }
```

Method (only document if the method is public API):

```ts
/**
 * [What this method does. Starts with a verb.]
 *
 * @param value - [Meaning. What triggers a throw vs. a pass.]
 *
 * @throws {ArgumentNullError} When `value` is `null`.
 */
public static methodName(value: unknown): void { ... }
```

---

## Style

- **Active voice:** "Returns", "Throws", "Yields" — not "is returned", "will be thrown".
- **Precise:** `does / returns / throws` for guaranteed behavior; `may` only when genuinely conditional.
- **No marketing language:** no "powerful", "elegant", "seamlessly", "easy-to-use".
- **One term per concept:** use the Terminology table; no synonyms.
- **`@param` describes meaning**, not the type signature. Never write `@param value - The value.`
- **Expected output:** `// → value` as inline comment, not a `console.log`.
- **No `any`:** use `unknown` or a concrete generic.
- **Concise:** cut filler, not meaning. If it fits in one sentence, don't use three.

---

## What NOT to Do

- Do not describe behavior not confirmed by reading the implementation.
- Do not omit the execution model sentence from any operator `@remarks`.
- Do not write examples that won't type-check against the actual exported signature.
- Do not reference `private`, `protected`, or `@internal` symbols as stable API.
- Do not add `@example` to interface members or `@internal` classes.
- Do not write `@param value - The value parameter.` — describe meaning, not the name.

---

## Definition of Done

- [ ] `@group` present (and `@category` for operators).
- [ ] Execution model sentence verbatim as the **first sentence** of `@remarks` (operators only).
- [ ] Every `@param` states meaning and null/undefined behavior.
- [ ] Every `@throws` names the exact error class and the condition that triggers it.
- [ ] `@example` present where required and compiles against the actual exported signature.
- [ ] `@see` links: enumerator backing an operator, public API method, related siblings.
- [ ] Prose is precise, terse, no filler.
