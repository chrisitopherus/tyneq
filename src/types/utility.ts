/**
 * A type that is either a value of type `T` or `null`.
 *
 * @remarks
 * Represents a value that may be `null` but not `undefined`. Use for APIs that explicitly
 * allow `null` while treating `undefined` as "not provided".
 *
 * @typeParam T - The underlying value type.
 *
 * @see {@link Optional} for allowing both `null` and `undefined`.
 * @see {@link Undefinedable} for the `undefined`-only variant.
 *
 * @group Types
 */
export type Nullable<T> = T | null;

/**
 * A type that is either a value of type `T` or `undefined`.
 *
 * @remarks
 * Represents an optional value that may be `undefined` but not `null`. Use for APIs that allow
 * omission while treating explicit `null` as a meaningful value.
 *
 * @typeParam T - The underlying value type.
 *
 * @see {@link Optional} for allowing both `null` and `undefined`.
 * @see {@link Nullable} for the `null`-only variant.
 *
 * @group Types
 */
export type Undefinedable<T> = T | undefined;

/**
 * A type that is `T`, `null`, or `undefined`.
 *
 * @remarks
 * The most permissive optional type, equivalent to JavaScript's implicit handling of missing values.
 * Use {@link Nullable} or {@link Undefinedable} when the distinction between `null` and `undefined`
 * matters.
 *
 * @typeParam T - The underlying value type.
 *
 * @see {@link Nullable} for the `null`-only variant.
 * @see {@link Undefinedable} for the `undefined`-only variant.
 *
 * @group Types
 */
export type Optional<T> = T | null | undefined;

/**
 * A structural type for objects with a `length` property.
 *
 * @remarks
 * Matches arrays, strings, and any object with a numeric `length` property. Used by utility
 * functions that operate on anything with measurable length, such as empty-collection checks.
 *
 * @group Types
 */
export type HasLength = { length: number };

/**
 * A catch-all type for function references where argument types are not relevant.
 *
 * @remarks
 * Defined as `(...x: never[]) => unknown`. Accepts no arguments at the call site and returns
 * `unknown`. Useful when storing or passing functions generically without caring about their
 * specific signature.
 *
 * @group Types
 */
export type GenericFunction = (...x: never[]) => unknown;

/**
 * A conditional type that narrows `T` to a subtype of `U` if assignable, otherwise returns `U`.
 *
 * @remarks
 * If `T` extends `U`, resolves to `T` (preserving the more specific type). If `T` is not
 * assignable to `U`, resolves to `U` (falling back to the constraint).
 *
 * @typeParam T - The actual type being checked.
 * @typeParam U - The required constraint and fallback type.
 *
 * @see {@link Cast} for unconditional type identity.
 *
 * @group Types
 */
export type Assume<T, U> = T extends U ? T : U;

/**
 * A pass-through type that explicitly declares a type's identity.
 *
 * @remarks
 * Has no runtime effect. Evaluates to exactly `T` without any narrowing or widening, serving
 * as a documentation or assertion tool to make implicit type assumptions explicit.
 *
 * @typeParam T - The type being cast (identity).
 *
 * @see {@link Assume} for conditional type narrowing based on constraints.
 *
 * @group Types
 */
export type Cast<T> = T;