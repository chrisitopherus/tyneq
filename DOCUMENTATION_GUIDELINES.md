# Documentation Guidelines — Tyneq

## Purpose

This document is the single source of truth for documentation standards across the
Tyneq library. It covers every TypeScript construct category present in the codebase.
Any contributor — human or AI agent — must follow these guidelines when writing or
reviewing doc comments.

**Toolchain:** TypeDoc with `typedoc-plugin-markdown`. All doc comments must be valid
TSDoc that TypeDoc can process. The output configuration (`typedoc.json`) enforces
`excludePrivate`, `excludeProtected`, and `excludeInternal`, so only `public` and
`export`-ed symbols need full documentation.

**Target reader of the generated docs:** Experienced developers familiar with LINQ,
Rx.js, or similar pipeline libraries. They want precise semantics, execution model
clarity, and correct TypeScript — not introductory tutorials.

---

## Terminology

Use these terms exactly and consistently. Do not substitute synonyms.

| Term | Meaning |
|---|---|
| **sequence** | Any `IEnumerable<T>` value |
| **source** | The upstream sequence passed into an operator |
| **element** | A single item produced by a sequence during iteration |
| **predicate** | A `(item: T) => boolean` function |
| **selector** | A `(item: T) => TResult` projection function |
| **accumulator** | A `(acc: TResult, item: T) => TResult` fold function |
| **comparer** | A `(a: T, b: T) => number` comparison function; negative = less than, 0 = equal, positive = greater than |
| **streaming operator** | Yields elements one-at-a-time without buffering; O(1) space; execution is deferred |
| **buffering operator** | Accumulates the entire source before yielding any output; O(n) space; execution is deferred |
| **terminal operator** | Consumes the sequence and returns a concrete value; execution is immediate |
| **deferred execution** | The source is not iterated until the returned sequence is itself iterated |
| **immediate execution** | The source is fully iterated at the point of the method call |

---

## TypeDoc Integration

### Configuration context

The active `typedoc.json` sets these relevant options:

| Option | Value | Implication |
|---|---|---|
| `excludePrivate` | `true` | `private` members are not rendered; do not document them |
| `excludeProtected` | `true` | `protected` members are not rendered; do not document them |
| `excludeInternal` | `true` | Symbols tagged `@internal` are not rendered |
| `categorizeByGroup` | `true` | `@group` controls navigation grouping |
| `parametersFormat` | `"table"` | `@param` entries render as a table; keep descriptions concise |

### Tags to use

| Tag | When to use |
|---|---|
| `@group` | **Required on every exported class, interface, type, and function.** Assigns the symbol to a navigation group. |
| `@category` | Optional sub-grouping within a `@group` (e.g., `@category Streaming` inside the `Operators` group). |
| `@internal` | Mark implementation-only exports that should not appear in the generated docs. |
| `@remarks` | Extended description: semantics, execution model, performance, caveats. |
| `@typeParam` | Document every generic type parameter. One entry per parameter. |
| `@param` | Document every constructor and method parameter. |
| `@returns` | Describe the return value: shape, laziness, reference stability. |
| `@throws` | One entry per thrown error type, with exact condition. |
| `@example` | Code example in a fenced ` ```ts ` block. |
| `@see` | Cross-link to related symbols using `{@link Symbol}`. |
| `@deprecated` | Mark deprecated symbols with migration instructions. |

### Required `@group` values

Use exactly these group names to keep the generated navigation consistent:

| Symbol kind | `@group` value |
|---|---|
| Core interfaces (`IEnumerable`, `ITyneqEnumerable`, etc.) | `Interfaces` |
| Abstract base classes | `Classes` |
| Concrete implementation classes | `Classes` |
| Streaming operator classes | `Operators` |
| Buffering operator classes | `Operators` |
| Terminal operator classes | `Operators` |
| Enumerator classes | `Enumerators` |
| Error classes | `Errors` |
| Type aliases | `Types` |
| Decorator functions | `Decorators` |
| Utility classes | `Utilities` |

---

## Execution Model

Every operator doc comment **must** state its execution model using one of the three
sentences below verbatim as the **first sentence** of `@remarks`.

**Streaming (deferred):**
> This method uses deferred execution. The source sequence is not enumerated until the
> returned sequence is iterated.

**Buffering (deferred):**
> This method uses deferred execution. The source sequence is fully buffered on first
> iteration of the returned sequence.

**Terminal (immediate):**
> This method uses immediate execution. The source sequence is fully enumerated when
> this method is called.

This convention mirrors .NET LINQ documentation and makes execution semantics
immediately visible in the generated docs.

---

## Construct-Specific Standards

---

### Interfaces

**Applies to:** `IEnumerator<T>`, `IEnumeratorFactory<T>`, `IEnumerable<T>`,
`ITyneqEnumerable<T>`, `ITyneqOrderedEnumerable<T>`, `ITyneqCachedEnumerable<T>`, etc.

Interfaces define contracts. Document **what implementers must guarantee** and
**what callers can rely on** — not how any particular class implements it.

#### Interface-level comment

```ts
/**
 * [Summary — what this contract represents. One sentence, starts with a verb or noun phrase.]
 *
 * @remarks
 * [What the contract guarantees: behavior invariants, protocol requirements (e.g.,
 *  iterator protocol), thread-safety assumptions, re-iterability contract.]
 * [State which interfaces this extends and why — do not just echo the `extends` clause.]
 *
 * @typeParam T - [Role of this type in the contract.]
 *
 * @see {@link RelatedType} [One-line note.]
 *
 * @group Interfaces
 */
export interface IExample<T> { ... }
```

#### Interface member comment

Document every `public` method and property on an interface.

```ts
/**
 * [Summary — what calling this method does or what this property holds.]
 *
 * @remarks
 * [Contract: what callers can assume. What implementations must guarantee.
 *  Especially: does each call return an independent instance? Can it return null?]
 *
 * @returns [Shape of the return value and the guarantee it provides.]
 */
methodName(): ReturnType;
```

**Rules:**
- Document the contract, not an implementation. Do not say "calls `somePrivateField`".
- If the interface extends another, describe what this interface *adds* — not what
  the parent already documents.
- Do not add `@example` to interface members; examples belong on the concrete class
  or factory methods that users actually call.

---

### Abstract Classes

**Applies to:** `TyneqEnumerableBase<T>`, `TyneqBaseEnumerator<TInput, TOutput>`,
`TyneqEnumerator<T>`, `TyneqOperatorEnumerable<T>`, `TyneqTerminalOperator<T, R>`, etc.

Abstract classes establish the skeleton for all concrete implementations. They are
not instantiated by library users, but they are extended by contributors and agents
writing new operators or enumerators.

#### Class-level comment

```ts
/**
 * [Summary — what role this base class plays in the hierarchy.]
 *
 * @remarks
 * [Describe: what the class provides to subclasses (template methods, shared state,
 *  lifecycle hooks). Which methods subclasses must override. Which are optional.
 *  Any invariants subclasses must uphold.]
 *
 * @typeParam TSource - [Meaning in this context.]
 *
 * @see {@link ConcreteSubclass} [Note.]
 *
 * @group Classes
 * @internal
 */
export abstract class TyneqBase<TSource> { ... }
```

> Note: Abstract base classes that are not part of the public extensibility API should
> be tagged `@internal` to exclude them from generated docs.

#### Abstract method comment

```ts
/**
 * [Summary — what subclasses must implement here.]
 *
 * @remarks
 * [When this method is called in the lifecycle. What it must return. What it must not do.
 *  Side-effect expectations (e.g., must not mutate source).]
 *
 * @returns [Contract on the return value.]
 */
protected abstract methodName(): ReturnType;
```

**Rules:**
- Focus on the contract the subclass must fulfill, not on what any specific subclass does.
- Document protected template-method hooks (`initialize`, `handleNext`, `dispose`, etc.)
  because contributors implementing new enumerators depend on them.

---

### Concrete Classes

**Applies to:** `TyneqEnumerable<T>`, `TyneqOrderedEnumerable<T>`,
`TyneqCachedEnumerable<T>`, `TyneqComparer<T>`, etc.

These are the runtime classes users interact with (usually indirectly via factory methods).

#### Class-level comment

```ts
/**
 * [Summary — what this class is and what it represents.]
 *
 * @remarks
 * [Key characteristics: lazy vs. eager, re-iterability, internal factory pattern,
 *  how instances are typically obtained (factory method vs. direct construction),
 *  performance model.]
 * [How this class relates to the interfaces it implements.]
 *
 * @typeParam TSource - [Meaning.]
 *
 * @example
 * ```ts
 * // Typical usage via factory method
 * const seq = Tyneq.from([1, 2, 3]).where(n => n > 1);
 * ```
 *
 * @see {@link TyneqEnumerableBase} [Inherited operators.]
 *
 * @group Classes
 */
export class TyneqExample<TSource> extends TyneqBase<TSource> { ... }
```

#### Constructor comment

```ts
/**
 * Creates a new [ClassName].
 *
 * @remarks
 * [When construction validates eagerly vs. lazily. What is stored vs. evaluated.]
 *
 * @param param - [Meaning. Null/undefined behavior. Whether read eagerly.]
 *
 * @throws {ArgumentNullError} When `param` is `null`.
 * @throws {ArgumentError} When `param` is `undefined`.
 */
public constructor(param: Type) { ... }
```

#### Public method comment (non-operator)

```ts
/**
 * [Summary.]
 *
 * @remarks
 * [Semantics. Whether a new instance is returned. Shared-reference implications.]
 *
 * @returns [What the caller receives.]
 */
public methodName(): ReturnType { ... }
```

**Rules:**
- If the class is only obtained via a factory method (not `new`), say so in `@remarks`.
- Document public properties with a one-line comment; omit `@remarks` unless there is
  a non-obvious contract.

---

### Streaming Operator Classes

**Applies to:** All classes in `src/operators/streaming/` decorated with `@operator()`.

These classes implement deferred, one-at-a-time transformations. They extend
`TyneqOperatorEnumerable` and delegate iteration to a corresponding enumerator class.

#### Template

```ts
/**
 * [Summary — describe what the operator does to the sequence. Starts with a verb.
 *  E.g., "Filters elements of a sequence based on a predicate."]
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the
 * returned sequence is iterated.
 *
 * [Additional semantics: order preservation, predicate call count, what is yielded.]
 * [Contrast with a related operator if helpful (use a Markdown table).]
 *
 * **Performance:** O(1) space. O(n) time when fully enumerated.
 *
 * @typeParam TSource - Element type of the source sequence.
 * @typeParam TResult - Element type of the output sequence. [Omit if same as TSource.]
 *
 * @see {@link CorrespondingEnumerator} Implementation of the iteration logic.
 * @see {@link ITyneqEnumerable.methodName} Public API method.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
@operator('methodName')
export class ExampleOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> { ... }
```

#### Constructor comment

```ts
/**
 * @param source    - The source sequence to transform.
 * @param predicate - [Meaning. Called once per element. Must not throw for normal elements.]
 */
public constructor(source: IEnumerable<TSource>, predicate: (item: TSource) => boolean) { ... }
```

**Rules:**
- Tag with `@internal` unless the class is part of the public extensibility API.
  The public API for end users is the method on `ITyneqEnumerable`, not this class.
- Do **not** include `@example` — examples belong on the interface method.
- The `@see` to `ITyneqEnumerable.methodName` is mandatory so TypeDoc links the
  operator class to its public entry point.
- Always specify `@category Streaming` inside `@group Operators`.

---

### Buffering Operator Classes

**Applies to:** All classes in `src/operators/buffer/` decorated with `@operator()`.

Same structure as streaming operators with two differences:

1. The execution model sentence is:
   > This method uses deferred execution. The source sequence is fully buffered on first
   > iteration of the returned sequence.

2. Performance must document space complexity:
   > **Performance:** O(n) space (full buffer). O(n) time when fully enumerated.

#### Template (diff from streaming)

```ts
/**
 * [Summary.]
 *
 * @remarks
 * This method uses deferred execution. The source sequence is fully buffered on first
 * iteration of the returned sequence.
 *
 * [What the buffer contains and when it is built.]
 * [Whether element order is preserved or changed.]
 *
 * **Performance:** O(n) space (full buffer). O(n) time when fully enumerated.
 *
 * ...
 * @category Buffering
 */
```

---

### Terminal Operator Classes

**Applies to:** All classes in `src/operators/terminal/` decorated with `@terminal()`.

These classes consume the sequence immediately and return a concrete value.
They extend `TyneqTerminalOperator` and implement `process()`.

#### Template

```ts
/**
 * [Summary — describe what this terminal operation computes.
 *  E.g., "Returns the minimum and maximum elements in a single enumeration pass."]
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when
 * this method is called.
 *
 * [Additional semantics: what happens on an empty sequence, default comparer behavior,
 *  whether a custom comparer is optional.]
 *
 * **Performance:** O(n) time. O(1) space. [Adjust if buffering is needed.]
 *
 * @typeParam T - Element type of the source sequence.
 *
 * @see {@link ReturnType} Shape of the return value.
 * @see {@link ITyneqEnumerable.methodName} Public API method.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('methodName')
export class ExampleTerminalOperator<T> extends TyneqTerminalOperator<T, ResultType> { ... }
```

#### `process()` method comment

```ts
/**
 * Executes the terminal operation and returns the result.
 *
 * @returns [What is returned. Be specific about shape and reference.]
 *
 * @throws {SequenceContainsNoElementsError} When the source sequence is empty.
 * [Add more @throws entries as applicable.]
 */
public override process(): ResultType { ... }
```

**Rules:**
- Always document what happens on an **empty source** — this is the most common
  edge case for terminal operators. Either it throws or it returns a defined default.
- Tag with `@internal` if not part of the public extensibility surface.
- Always specify `@category Terminal` inside `@group Operators`.

---

### Enumerator Classes

**Applies to:** All classes in `src/enumerators/`. These are the internal iteration
engines backing operator classes.

Enumerator classes are never used directly by library consumers. They are the
implementation detail behind `getEnumerator()` in operator classes.

#### Rules

- Always tag `@internal` — enumerators are excluded from the generated docs.
- Document protected overrides (`initialize`, `handleNext`, `dispose`) so contributors
  can understand the lifecycle.
- The summary line should describe what iteration step this class performs
  (e.g., "Enumerator that yields elements satisfying a predicate.").
- No `@example` required.
- Cross-link to the operator class that uses this enumerator via `@see`.

#### Template

```ts
/**
 * Enumerator that [what it does during iteration].
 *
 * @remarks
 * [Lifecycle: when initialize() is called, what handleNext() does per step,
 *  what dispose() releases.]
 * [State it maintains: buffers, indices, flags.]
 *
 * @typeParam TInput  - Element type of the source enumerator.
 * @typeParam TOutput - Element type this enumerator yields. [Omit if same as TInput.]
 *
 * @see {@link CorrespondingOperatorEnumerable}
 *
 * @internal
 */
export class ExampleEnumerator<TInput, TOutput> extends TyneqBaseEnumerator<TInput, TOutput> { ... }
```

---

### Error Classes

**Applies to:** `TyneqError`, `ArgumentError`, `ArgumentNullError`,
`ArgumentOutOfRangeError`, `ArgumentTypeError`, `InvalidOperationError`,
`SequenceContainsNoElementsError`, `KeyNotFoundError`, `NotSupportedError`, etc.

#### Class-level comment

```ts
/**
 * [Summary — what condition this error signals. One sentence.]
 *
 * @remarks
 * [When this error is thrown by the library. Which operations produce it.
 *  Whether it wraps an inner error. How to distinguish it from related error types.]
 *
 * @example
 * ```ts
 * try {
 *   Tyneq.from([]).first();
 * } catch (e) {
 *   if (e instanceof SequenceContainsNoElementsError) {
 *     // handle empty sequence
 *   }
 * }
 * ```
 *
 * @see {@link TyneqError} Base class for all Tyneq errors.
 *
 * @group Errors
 */
export class SpecificError extends TyneqError { ... }
```

#### Constructor comment

```ts
/**
 * Creates a new [ErrorClassName].
 *
 * @param message - Human-readable description of what went wrong.
 * @param options - Optional. `options.inner` wraps a root-cause error for chaining.
 */
public constructor(message: string, options?: { inner?: Error }) { ... }
```

**Rules:**
- The class-level `@example` must show a `try/catch` that catches this specific error
  type via `instanceof`.
- Document the `inner` property on `TyneqError` (the base); derived classes do not
  need to repeat it unless they add their own fields.
- Do not document the inherited `.name`, `.message`, or `.stack` properties — they
  are standard `Error` properties.

---

### Type Aliases

**Applies to:** `Nullable<T>`, `Undefinedable<T>`, `Optional<T>`, `HasLength`,
`GenericFunction`, `Assume<T, U>`, `Cast<T>`, result types like `MinMaxResult<T>`, etc.

#### Template

```ts
/**
 * [Summary — what this type represents. One noun phrase or sentence.]
 *
 * @remarks
 * [When to use this type vs. related types. What it enables or constrains.
 *  Any TypeScript-specific behavior (distributive conditional types, etc.).]
 *
 * @typeParam T - [Meaning.]
 *
 * @example
 * ```ts
 * // [Show both valid and invalid usages where helpful]
 * const value: Nullable<string> = null;  // OK
 * const bad: Nullable<string> = undefined; // Error
 * ```
 *
 * @see {@link RelatedType} [Contrast.]
 *
 * @group Types
 */
export type Nullable<T> = T | null;
```

**Rules:**
- `@example` is required for types that have a non-obvious distinction from
  similar types (e.g., `Nullable` vs. `Optional` vs. `Undefinedable`).
- For structural types (`HasLength`), show what satisfies and what does not.
- For conditional types (`Assume<T, U>`), show at least two cases: one where the
  condition is true and one where it is false.
- Do not explain TypeScript mechanics already visible in the type definition —
  focus on *intent* and *when to use*.

---

### Decorator Functions

**Applies to:** `operator(name)`, `terminal(name)` in `src/extensibility/`.

These are factory functions that return TC39 class decorators. They are part of the
public extensibility API — library consumers and contributors use them to register
custom operators without modifying `TyneqEnumerableBase`.

#### Template

```ts
/**
 * [Summary — what the decorator does when applied.
 *  E.g., "Registers a streaming operator on all TyneqEnumerable instances."]
 *
 * @remarks
 * [When registration happens (module evaluation / first import). What it patches.
 *  What the decorated class must extend and what constructor signature it must have.
 *  What happens if the same name is registered twice (error).]
 *
 * @param name - The method name to inject on `TyneqEnumerableBase.prototype`.
 *
 * @example
 * ```ts
 * // Registering a custom streaming operator
 * \@operator('double')
 * export class DoubleOperator<T extends number> extends TyneqOperatorEnumerable<T> {
 *   constructor(source: IEnumerable<T>) { super(source); }
 *   getEnumerator() { return new DoubleEnumerator(this.source[Symbol.iterator]()); }
 * }
 * // seq.double() is now available on every ITyneqEnumerable instance
 * ```
 *
 * @throws {Error} When a method named `name` is already defined on
 *   `TyneqEnumerableBase.prototype`.
 *
 * @group Decorators
 */
export function operator(name: string) { ... }
```

**Rules:**
- `@example` is required and must show a realistic end-to-end operator registration.
- Use `\@operator` (escaped) inside example code blocks to prevent TSDoc from
  misinterpreting the decorator syntax.
- Document the duplicate-registration guard (`@throws`) — this is a common mistake.

---

### Utility Classes

**Applies to:** `ArgumentUtility`, `EnumeratorUtility`, `nameof`, etc.

These classes expose static helper methods used internally and, in some cases,
by contributors writing custom operators.

#### Class-level comment

```ts
/**
 * [Summary — what category of helpers this class groups.]
 *
 * @remarks
 * [Whether this is intended for internal use only, contributor use, or public use.
 *  Any global state or side effects.]
 *
 * @group Utilities
 * @internal  [if not part of the public API]
 */
export class ExampleUtility { ... }
```

#### Static method comment

```ts
/**
 * [Summary — what this method does. Starts with a verb.]
 *
 * @remarks
 * [When to call this. Side effects. Whether it throws or returns a boolean.]
 *
 * @param value - [Meaning. What triggers a throw vs. a pass.]
 *
 * @throws {ArgumentNullError} When `value` is `null`.
 * @throws {ArgumentError} When `value` is `undefined`.
 */
public static methodName(value: unknown): void { ... }
```

**Rules:**
- If the class is only used internally, tag it `@internal` at the class level;
  do not tag each method individually.
- If individual static methods are public API (exported and documented), give each
  a full comment following the template above.

---

## Style and Tone

- **Active voice.** "Returns", "Throws", "Yields", "Filters" — not "is returned", "will be thrown".
- **Precise language.** Use `does / returns / throws / yields` for guaranteed behavior.
  Use `may / might` only when behavior is genuinely conditional.
- **No marketing language.** No "powerful", "elegant", "seamlessly", "easy-to-use".
- **One term per concept.** Use the terms from the Terminology table; do not alternate synonyms.
- **Do not restate the type signature.** `@param predicate` should say what the predicate
  *means*, not that it "is a function from T to boolean" (the signature already says that).
- **Concise but complete.** Cut filler words, not meaning.
- **`// → value` for expected output.** Show expected output as an inline comment on
  the result expression, not in a separate `console.log`.

---

## What NOT to Do

- Do not describe behavior that has not been confirmed by reading the implementation.
- Do not omit the execution model sentence from any operator `@remarks`.
- Do not write examples that will not type-check against the actual exported signature.
- Do not reference `private`, `protected`, or `@internal` symbols as stable API.
- Do not use `any` in doc comments or examples; use `unknown` or a concrete generic type.
- Do not add `@example` to interface members or internal classes.
- Do not write `@param value - The value parameter.` — describe meaning, not the name.

---

## Dependency-Aware Checklist

Before finalizing any doc comment, verify:

- [ ] Read the implementation of the symbol being documented
- [ ] Read every helper, validator, and dependency it calls
- [ ] Confirmed the execution model (deferred-streaming / deferred-buffering / immediate)
- [ ] Confirmed all thrown error types and the exact conditions that trigger them
- [ ] Confirmed optional parameter defaults from code, not assumptions
- [ ] Confirmed whether empty-source behavior throws or returns a default
- [ ] Confirmed performance characteristics (time and space complexity)
- [ ] Confirmed whether element order is preserved

If any item is ambiguous after reading the code, add an `@remarks` note:
> **Implementation note:** [Description of the uncertainty and which file/line to check.]

---

## Definition of Done

A doc comment is complete when:

1. The `@group` (and `@category` for operators) tag is present.
2. The execution model sentence is present verbatim in `@remarks` (operators only).
3. Every `@param` states meaning and null/undefined behavior — not just the type.
4. Every `@throws` names the exact error class and the condition that triggers it.
5. `@example` is present where required by this guide and compiles against the
   actual exported signature.
6. `@see` links cover: the enumerator backing an operator, the public API method,
   and at least one closely related sibling.
7. The prose reads like a .NET LINQ reference page: precise, terse, no filler.
