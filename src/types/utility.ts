/**
 * A type that is either a value of type `T` or `null`.
 * 
 * @remarks
 * Represents a value that may be `null` but not `undefined`. This type is useful for
 * APIs that explicitly allow `null` while treating `undefined` as "not provided".
 * 
 * This distinction enables more precise type contracts compared to just using `T | null | undefined`.
 * 
 * @typeParam T - The underlying value type.
 * 
 * @example
 * ```typescript
 * function process(value: Nullable<string>) {
 *     // value is string | null, but not undefined
 *     if (value === null) {
 *         console.log('null received');
 *     } else {
 *         console.log(value.length); // Safe: string is not null
 *     }
 * }
 * 
 * process('hello');   // OK
 * process(null);      // OK
 * process(undefined); // ERROR: Type 'undefined' is not assignable to 'Nullable<string>'
 * ```
 * 
 * @see {@link Optional} for allowing both `null` and `undefined`
 * @see {@link Undefinedable} for distinguishing `undefined` from the absence of undefined
 */
export type Nullable<T> = T | null;

/**
 * A type that is either a value of type `T` or `undefined`.
 * 
 * @remarks
 * Represents an optional value that may be `undefined` but not `null`. This type is useful for
 * APIs that allow omission (no value provided) while treating explicit `null` as a meaningful value.
 * 
 * Complements `Nullable<T>` for cases where the distinction between "not provided" (`undefined`)
 * and "explicitly null" (`null`) matters.
 * 
 * @typeParam T - The underlying value type.
 * 
 * @example
 * ```typescript
 * function configure(timeout: Undefinedable<number>) {
 *     // timeout is number | undefined, but not null
 *     const finalTimeout = timeout ?? 5000; // 5000ms default
 * }
 * 
 * configure(3000);       // OK
 * configure(undefined);  // OK: Use default
 * configure(null);       // ERROR: Type 'null' is not assignable to 'Undefinedable<number>'
 * ```
 * 
 * @see {@link Optional} for allowing both `null` and `undefined`
 * @see {@link Nullable} for distinguishing `null` from the absence of null
 */
export type Undefinedable<T> = T | undefined;

/**
 * A type that is `T`, `null`, or `undefined`.
 * 
 * @remarks
 * Represents a value that may be absent in either sense: `null` or `undefined`. This is the most
 * permissive optional type and is equivalent to standard JavaScript's implicit handling of missing values.
 * 
 * Use this type when the distinction between `null` and `undefined` is not meaningful for your API.
 * Use {@link Nullable} or {@link Undefinedable} when you need to distinguish between the two meanings.
 * 
 * @typeParam T - The underlying value type.
 * 
 * @example
 * ```typescript
 * interface Config {
 *     name: Optional<string>;
 * }
 * 
 * const cfg: Config = { name: 'App' };       // OK
 * const cfg2: Config = { name: null };       // OK
 * const cfg3: Config = { name: undefined };  // OK
 * const cfg4: Config = { name: 123 };        // ERROR: Type 'number' is not assignable
 * ```
 * 
 * @see {@link Nullable} for distinguishing `null` from the absence of null
 * @see {@link Undefinedable} for distinguishing `undefined` from the absence of undefined
 */
export type Optional<T> = T | null | undefined;

/**
 * A structural type for objects with a `length` property.
 * 
 * @remarks
 * Matches any type that has a numeric `length` property, including:
 * - Arrays: `{ length: number }`
 * - Strings: `{ length: number }`
 * - Array-like objects: `{ length: number, ...other properties }`
 * - Custom types with a length property
 * 
 * This is a duck-typing interface used by utility functions that operate on anything
 * with measurable length, especially in validation predicates like checking for empty collections.
 * 
 * @example
 * ```typescript
 * function checkNotEmpty<T extends HasLength>(value: T): T {
 *     if (value.length === 0) {
 *         throw new Error('Value cannot be empty');
 *     }
 *     return value;
 * }
 * 
 * checkNotEmpty([1, 2, 3]);           // OK: Array has length
 * checkNotEmpty('hello');              // OK: String has length
 * checkNotEmpty({ length: 5 });       // OK: Object has length property
 * checkNotEmpty({ value: 10 });       // ERROR: Missing length property
 * ```
 */
export type HasLength = { length: number };

/**
 * A type representing any function that accepts no arguments and returns a value.
 * 
 * @remarks
 * Defined as `(...x: never[]) => unknown`, this type:
 * - Accepts no arguments (due to `never[]` parameter)
 * - Returns `unknown` (any possible value)
 * - Represents the broadest possible function signature
 * 
 * This is useful as a catch-all type for function references in cases where:
 * - You need to store or pass functions generically without caring about their signature
 * - Type precision is less important than flexibility
 * - Duck-typing polymorphism is desired
 * 
 * Note: While this type technically accepts no arguments, callers attempting to pass
 * arguments will receive a type error due to the `never[]` parameter type.
 * 
 * @example
 * ```typescript
 * // Store arbitrary functions
 * const functions: GenericFunction[] = [
 *     () => 42,
 *     () => 'hello',
 *     () => new Date(),
 *     () => undefined
 * ];
 * 
 * // Can invoke them
 * functions.forEach(fn => {
 *     const result: unknown = fn(); // Result is typed as unknown
 * });
 * 
 * // Cannot pass arguments (type error)
 * functions[0](123); // ERROR: Expected 0 arguments, got 1
 * ```
 * 
 * @returns `unknown` - Any return type is valid.
 */
export type GenericFunction = (...x: never[]) => unknown;

/**
 * A conditional type that narrows `T` to a subtype of `U` if assignable, otherwise returns `U`.
 * 
 * @remarks
 * This is a conditional type that implements a "safe subtype narrowing" pattern:
 * - If `T` is assignable to `U`, returns `T` (preserves the more specific type)
 * - If `T` is not assignable to `U`, returns `U` (falls back to the constraint)
 * 
 * This is useful for generic functions that want to ensure a value conforms to a constraint
 * while preserving type precision when possible.
 * 
 * Conceptually similar to C# generic method constraints but expressed as a type operation.
 * 
 * @typeParam T - The actual type being checked.
 * @typeParam U - The required constraint and fallback type.
 * 
 * @example
 * ```typescript
 * // Assume<string, string | number> => string (T extends U, so returns T)
 * type A = Assume<string, string | number>; // string
 * 
 * // Assume<boolean, string | number> => string | number (T doesn't extend U)
 * type B = Assume<boolean, string | number>; // string | number
 * 
 * // Practical usage in generics
 * function identity<T, U>(value: T, _constraint: U): Assume<T, U> {
 *     // Ensures T is compatible with U, otherwise narrows to U
 *     return value as Assume<T, U>;
 * }
 * 
 * identity('test', 'anything');        // Returns: string
 * identity(123, 'string or number');   // Returns: string or number
 * ```
 * 
 * @see {@link Cast} for unconditional type identity
 */
export type Assume<T, U> = T extends U ? T : U;

/**
 * A pass-through type that explicitly declares a type's identity.
 * 
 * @remarks
 * This type has no runtime effect and serves purely as a documentation or assertion tool
 * in the type system. It evaluates to exactly `T` without any narrowing or widening.
 * 
 * Use cases:
 * - Making implicit type assumptions explicit in generic code
 * - Creating readable type aliases that emphasize intent without changing semantics
 * - Asserting that a value is of a specific type without modifying it
 * 
 * Unlike {@link Assume}, which conditionally narrows based on constraints, `Cast`
 * is unconditional and transparent-it always returns exactly `T`.
 * 
 * @typeParam T - The type being cast (identity).
 * 
 * @example
 * ```typescript
 * // Make type intent explicit
 * type UserId = Cast<number>;
 * 
 * const id: UserId = 42; // OK: Just a number, but semantically a UserId
 * 
 * // Use in generic constraints
 * function processId<T extends number>(id: T): Cast<T> {
 *     return id; // Returns exactly type T, unchanged
 * }
 * 
 * const result = processId(100 as const); // result is 100 (literal type preserved)
 * ```
 * 
 * @see {@link Assume} for conditional type narrowing based on constraints
 */
export type Cast<T> = T;