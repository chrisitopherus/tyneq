/**
 * `T | null` — explicitly nullable, but not `undefined`.
 *
 * @remarks
 * Use when `null` is a valid value but `undefined` means "not provided".
 *
 * @see {@link Optional} for `T | null | undefined`.
 * @see {@link Undefinedable} for `T | undefined`.
 *
 * @group Types
 */
export type Nullable<T> = T | null;

/**
 * `T | undefined` — optionally absent, but not `null`.
 *
 * @remarks
 * Use when omission is valid but an explicit `null` carries distinct meaning.
 *
 * @see {@link Optional} for `T | null | undefined`.
 * @see {@link Nullable} for `T | null`.
 *
 * @group Types
 */
export type Undefinedable<T> = T | undefined;

/**
 * `T | null | undefined` — the most permissive optional type.
 *
 * @remarks
 * Use {@link Nullable} or {@link Undefinedable} when the distinction between `null` and `undefined` matters.
 *
 * @see {@link Nullable} for `T | null`.
 * @see {@link Undefinedable} for `T | undefined`.
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
 * Identity type alias — evaluates to exactly `T`.
 *
 * @remarks
 * Has no runtime effect. Use to make implicit type assumptions explicit at the call site.
 *
 * @see {@link Assume} for conditional narrowing against a constraint.
 *
 * @group Types
 */
export type Cast<T> = T;