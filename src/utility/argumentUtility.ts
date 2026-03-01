import { ArgumentError } from '../core/errors/argument/ArgumentError';
import { ArgumentNullError } from '../core/errors/argument/ArgumentNullError';
import { ArgumentOutOfRangeError } from '../core/errors/argument/ArgumentOutOfRangeError';
import { ArgumentTypeError } from '../core/errors/argument/ArgumentTypeError';
import type { IEnumerable, IEnumerator, KeyValuePair } from '../types/core';
import { HasLength, Nullable, Optional, Undefinedable } from "../types/utility";
import { nameof } from './nameof';
import { TypeGuardUtility } from './typeGuardUtility';

/**
 * Utility class providing comprehensive argument validation methods for the Tyneq library.
 * 
 * @remarks
 * `ArgumentUtility` is a static utility class that centralizes all parameter validation logic
 * used throughout the Tyneq library. It provides type-safe assertion methods using TypeScript's
 * `asserts` keyword, which narrows types after successful validation.
 * 
 * All validation methods throw descriptive errors ({@link ArgumentError}, {@link ArgumentNullError},
 * or {@link ArgumentOutOfRangeError}) when validation fails, including the parameter name in the
 * error for improved debugging.
 * 
 * **Key Features:**
 * - Type assertion methods that narrow TypeScript types after validation
 * - Null/undefined/empty value checks for various types
 * - Numeric validation (range, sign, integer, finiteness)
 * - String validation (whitespace, emptiness)
 * - Generic predicate-based validation
 * - Type checking for functions, iterables, iterators, enumerables, enumerators, and instances
 * 
 * **Usage Pattern:**
 * Methods are designed to be called at the start of functions to validate inputs before processing.
 * The `asserts` return type means that TypeScript knows the value is valid after the check passes.
 * Validation methods support two invocation styles:
 * 1) explicit value + parameter name (e.g. `checkNotNull(value, 'value')`)
 * 2) object shorthand for automatic name inference (e.g. `checkNotNull({ value })`)
 * 
 * @example
 * ```typescript
 * import { ArgumentUtility } from './utility/argumentUtility';
 * 
 * function processItems<T>(items: Nullable<T[]>, count: number): T[] {
 *   // Validate parameters
 *   ArgumentUtility.checkNotNull(items, 'items');
 *   ArgumentUtility.checkNonNegative(count, 'count');
 *   
 *   // TypeScript knows items is T[] here (not null)
 *   return items.slice(0, count);
 * }
 * ```
 * 
 * @see {@link ArgumentError} - Base class for argument validation errors
 * @see {@link ArgumentNullError} - Thrown when null check fails
 * @see {@link ArgumentOutOfRangeError} - Thrown when range/numeric validation fails
 */
export class ArgumentUtility {
    /**
     * Private constructor prevents instantiation of this static utility class.
     */
    private constructor() { }

    /**
     * Validates that a value is not null.
     * 
     * @remarks
     * This is a type assertion method that narrows the type from `Nullable<T>` to `T` upon success.
     * It checks only for `null`, not `undefined`. For checking both, use {@link checkNotOptional}.
     * Supports both invocation styles: `checkNotNull(value, 'value')` and `checkNotNull({ value })`.
     * 
     * The method uses TypeScript's `asserts` keyword, meaning that after this call, TypeScript
     * knows the value is definitely not null.
     * 
     * @typeParam T - The type of the value being validated
     * @param value - The value to check for null
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentNullError} If value is null
     * 
     * @example
     * ```typescript
     * function process(data: string | null) {
     *   ArgumentUtility.checkNotNull(data, 'data');
     *   // TypeScript knows data is string here
     *   console.log(data.length);
     * }
     * ```
     */
    public static checkNotNull<T>(param: Record<string, Nullable<T>>): asserts param is Record<string, T>;
    public static checkNotNull<T>(param: Nullable<T>, paramName: string): asserts param is T;
    public static checkNotNull<T>(param: Record<string, Nullable<T>> | Nullable<T>, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (value === null) {
            throw new ArgumentNullError(extractedParamName);
        }
    }

    /**
     * Validates that a value is not undefined.
     * 
     * @remarks
     * This is a type assertion method that narrows the type from `Undefinedable<T>` to `T` upon success.
     * It checks only for `undefined`, not `null`. For checking both, use {@link checkNotOptional}.
     * Supports both invocation styles: `checkNotUndefined(value, 'value')` and `checkNotUndefined({ value })`.
     * 
     * @typeParam T - The type of the value being validated
     * @param value - The value to check for undefined
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentError} If value is undefined
     * 
     * @example
     * ```typescript
     * function configure(options: { timeout?: number } | undefined) {
     *   ArgumentUtility.checkNotUndefined(options, 'options');
     *   // TypeScript knows options is { timeout?: number } here
     *   const timeout = options.timeout ?? 5000;
     * }
     * ```
     */
    public static checkNotUndefined<T>(param: Record<string, Undefinedable<T>>): asserts param is Record<string, T>;
    public static checkNotUndefined<T>(param: Undefinedable<T>, paramName: string): asserts param is T;
    public static checkNotUndefined<T>(param: Record<string, Undefinedable<T>> | Undefinedable<T>, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (value === undefined) {
            throw new ArgumentError(`'${extractedParamName}' cannot be undefined.`, extractedParamName);
        }
    }

    /**
     * Validates that a value is neither null nor undefined.
     * 
     * @remarks
     * This is a type assertion method that narrows the type from `Optional<T>` (which is `T | null | undefined`)
     * to `T` upon success. It's a convenience method that combines {@link checkNotNull} and {@link checkNotUndefined}.
     * Supports both invocation styles: `checkNotOptional(value, 'value')` and `checkNotOptional({ value })`.
     * 
     * Use this for parameters that must have a definite value and where both null and undefined are invalid.
     * 
     * @typeParam T - The type of the value being validated
     * @param value - The value to check for null or undefined
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentNullError} If value is null
     * @throws {ArgumentError} If value is undefined
     * 
     * @example
     * ```typescript
     * function transform(input: string | null | undefined, mapper: Function | null | undefined) {
     *   ArgumentUtility.checkNotOptional(input, 'input');
     *   ArgumentUtility.checkNotOptional(mapper, 'mapper');
     *   // TypeScript knows both are defined here
     *   return mapper(input);
     * }
     * ```
     */
    public static checkNotOptional<T>(param: Record<string, Optional<T>>): asserts param is Record<string, T>;
    public static checkNotOptional<T>(param: Optional<T>, paramName: string): asserts param is T;
    public static checkNotOptional<T>(param: Record<string, Optional<T>> | Optional<T>, paramName?: string): void {
        const {key: extractedParamName, value} = this.extractParameter(param, paramName);
        this.checkNotNull(value, extractedParamName);
        this.checkNotUndefined(value, extractedParamName);
    }

    /**
     * Validates that a value is not null and not empty (has non-zero length).
     * 
     * @remarks
     * This method checks that a value is not null and has a `length` property greater than 0.
     * It works with arrays, strings, and any object with a numeric `length` property.
     * Supports both invocation styles: `checkNotNullOrEmpty(value, 'value')` and `checkNotNullOrEmpty({ value })`.
     * 
     * This does not check for `undefined`. For that, use {@link checkNotOptionalOrEmpty}.
     * 
     * @typeParam T - The type of the value, must have a `length` property
     * @param value - The value to check for null and emptiness
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentNullError} If value is null
     * @throws {ArgumentError} If value is empty (length === 0)
     * 
     * @example
     * ```typescript
     * function processArray(items: number[] | null) {
     *   ArgumentUtility.checkNotNullOrEmpty(items, 'items');
     *   // TypeScript knows items is number[] and has at least one element
     *   return items[0];
     * }
     * ```
     */
    public static checkNotNullOrEmpty<T extends HasLength>(param: Record<string, Nullable<T>>): asserts param is Record<string, T>;
    public static checkNotNullOrEmpty<T extends HasLength>(param: Nullable<T>, paramName: string): asserts param is T;
    public static checkNotNullOrEmpty<T extends HasLength>(param: Record<string, Nullable<T>> | Nullable<T>, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        this.checkNotNull(value, extractedParamName);

        if (value.length === 0) {
            throw new ArgumentError(`'${extractedParamName}' cannot be empty.`, extractedParamName);
        }
    }

    /**
     * Validates that a value is neither null, nor undefined, nor empty.
     * 
     * @remarks
     * This method combines null/undefined checking with emptiness validation for values with a `length` property.
     * It ensures the value is defined and contains at least one element/character.
     * Supports both invocation styles: `checkNotOptionalOrEmpty(value, 'value')` and `checkNotOptionalOrEmpty({ value })`.
     * 
     * @typeParam T - The type of the value, must have a `length` property
     * @param value - The value to check for null, undefined, and emptiness
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentNullError} If value is null
     * @throws {ArgumentError} If value is undefined or empty (length === 0)
     * 
     * @example
     * ```typescript
     * function joinStrings(parts: string[] | null | undefined) {
     *   ArgumentUtility.checkNotOptionalOrEmpty(parts, 'parts');
     *   // TypeScript knows parts is string[] with length > 0
     *   return parts.join(',');
     * }
     * ```
     */
    public static checkNotOptionalOrEmpty<T extends HasLength>(param: Record<string, Optional<T>>): asserts param is Record<string, T>;
    public static checkNotOptionalOrEmpty<T extends HasLength>(param: Optional<T>, paramName: string): asserts param is T;
    public static checkNotOptionalOrEmpty<T extends HasLength>(param: Record<string, Optional<T>> | Optional<T>, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        this.checkNotOptional(value, extractedParamName);

        if (value.length === 0) {
            throw new ArgumentError(`'${extractedParamName}' cannot be empty.`, extractedParamName);
        }
    }

    /**
     * Validates that a string is not null, undefined, empty, or consisting only of whitespace.
     * 
     * @remarks
     * This method performs comprehensive string validation, checking that the value:
     * 1. Is not null
     * 2. Is not undefined
     * 3. After trimming whitespace, has non-zero length
     * Supports both invocation styles: `checkNotNullOrWhiteSpace(value, 'value')` and `checkNotNullOrWhiteSpace({ value })`.
     * 
     * Whitespace-only strings (spaces, tabs, newlines) are considered invalid.
     * 
     * @param value - The string value to validate
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentNullError} If value is null
     * @throws {ArgumentError} If value is undefined, empty, or whitespace-only
     * 
     * @example
     * ```typescript
     * function greet(name: string | null | undefined) {
     *   ArgumentUtility.checkNotNullOrWhiteSpace(name, 'name');
     *   // TypeScript knows name is a non-empty, non-whitespace string
     *   console.log(`Hello, ${name}!`);
     * }
     * 
     * greet('Alice');  // OK
     * greet('   ');    // Throws: 'name' cannot be empty or whitespace
     * greet('');       // Throws: 'name' cannot be empty or whitespace
     * ```
     */
    public static checkNotNullOrWhiteSpace(param: Record<string, Optional<string>>): asserts param is Record<string, string>;
    public static checkNotNullOrWhiteSpace(param: Optional<string>, paramName: string): asserts param is string;
    public static checkNotNullOrWhiteSpace(param: Record<string, Optional<string>> | Optional<string>, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        this.checkNotOptional(value, extractedParamName);

        if (value.trim().length === 0) {
            throw new ArgumentError(`'${extractedParamName}' cannot be empty or whitespace.`, extractedParamName);
        }
    }

    /**
     * Validates that a number is finite and non-negative (>= 0).
     * 
     * @remarks
     * This method checks that a numeric value:
     * 1. Is finite (not Infinity, -Infinity, or NaN)
     * 2. Is greater than or equal to 0
     * Supports both invocation styles: `checkNonNegative(value, 'value')` and `checkNonNegative({ value })`.
     * 
     * Commonly used for count, length, and index parameters where negative values are meaningless.
     * 
     * @param value - The numeric value to validate
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentOutOfRangeError} If value is not finite or is negative
     * 
     * @example
     * ```typescript
     * function allocate(size: number) {
     *   ArgumentUtility.checkNonNegative(size, 'size');
     *   return new Array(size);
     * }
     * 
     * allocate(10);   // OK
     * allocate(0);    // OK
     * allocate(-1);   // Throws: 'size' must be a non-negative number
     * allocate(NaN);  // Throws: 'size' must be a non-negative number
     * ```
     */
    public static checkNonNegative(param: Record<string, number>): void;
    public static checkNonNegative(param: number, paramName: string): void;
    public static checkNonNegative(param: Record<string, number> | number, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (!Number.isFinite(value) || value < 0) {
            throw new ArgumentOutOfRangeError(extractedParamName, `'${extractedParamName}' must be a non-negative number.`);
        }
    }

    /**
     * Validates that a number is finite and positive (> 0).
     * 
     * @remarks
     * This method checks that a numeric value:
     * 1. Is finite (not Infinity, -Infinity, or NaN)
     * 2. Is strictly greater than 0
     * Supports both invocation styles: `checkPositive(value, 'value')` and `checkPositive({ value })`.
     * 
     * Use this for parameters where zero is invalid (e.g., divisors, timeouts, batch sizes).
     * For parameters where zero is acceptable, use {@link checkNonNegative} instead.
     * 
     * @param value - The numeric value to validate
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentOutOfRangeError} If value is not finite or is not positive
     * 
     * @example
     * ```typescript
     * function divide(dividend: number, divisor: number) {
     *   ArgumentUtility.checkPositive(divisor, 'divisor');
     *   return dividend / divisor;
     * }
     * 
     * divide(10, 2);   // OK: 5
     * divide(10, 0);   // Throws: 'divisor' must be a positive number
     * divide(10, -5);  // Throws: 'divisor' must be a positive number
     * ```
     */
    public static checkPositive(param: Record<string, number>): void;
    public static checkPositive(param: number, paramName: string): void;
    public static checkPositive(param: Record<string, number> | number, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (!Number.isFinite(value) || value <= 0) {
            throw new ArgumentOutOfRangeError(extractedParamName, `'${extractedParamName}' must be a positive number.`);
        }
    }

    /**
     * Validates that a number is finite and within a specified inclusive range.
     * 
     * @remarks
     * This method checks that a numeric value:
     * 1. Is finite (not Infinity, -Infinity, or NaN)
     * 2. Is greater than or equal to `min`
     * 3. Is less than or equal to `max`
     * Supports both invocation styles: `checkInRange(value, min, max, 'value')` and `checkInRange({ value }, min, max)`.
     * 
     * The range is inclusive on both ends: [min, max].
     * 
     * @param value - The numeric value to validate
     * @param min - The minimum acceptable value (inclusive)
     * @param max - The maximum acceptable value (inclusive)
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentOutOfRangeError} If value is not finite or outside the range [min, max]
     * 
     * @example
     * ```typescript
     * function setVolume(level: number) {
     *   ArgumentUtility.checkInRange(level, 0, 100, 'level');
     *   // level is guaranteed to be between 0 and 100
     * }
     * 
     * setVolume(50);   // OK
     * setVolume(0);    // OK (inclusive)
     * setVolume(100);  // OK (inclusive)
     * setVolume(101);  // Throws: 'level' must be in range [0, 100]
     * ```
     */
    public static checkInRange(param: Record<string, number>, min: number, max: number): void;
    public static checkInRange(param: number, min: number, max: number, paramName: string): void;
    public static checkInRange(param: Record<string, number> | number, min: number, max: number, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (!Number.isFinite(value) || value < min || value > max) {
            throw new ArgumentOutOfRangeError(extractedParamName, `'${extractedParamName}' must be in range [${min}, ${max}].`);
        }
    }

    /**
     * Validates that a number is finite and an integer (no fractional component).
     * 
     * @remarks
     * This method checks that a numeric value:
     * 1. Is finite (not Infinity, -Infinity, or NaN)
     * 2. Is an integer as determined by `Number.isInteger()`
     * Supports both invocation styles: `checkInteger(value, 'value')` and `checkInteger({ value })`.
     * 
     * Use this for parameters representing counts, indices, or other discrete values.
     * 
     * @param value - The numeric value to validate
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentError} If value is not finite or not an integer
     * 
     * @example
     * ```typescript
     * function getElement(index: number) {
     *   ArgumentUtility.checkInteger(index, 'index');
     *   // index is guaranteed to be an integer
     * }
     * 
     * getElement(5);     // OK
     * getElement(0);     // OK
     * getElement(-3);    // OK (integers can be negative)
     * getElement(5.5);   // Throws: 'index' must be an integer
     * ```
     */
    public static checkInteger(param: Record<string, number>): void;
    public static checkInteger(param: number, paramName: string): void;
    public static checkInteger(param: Record<string, number> | number, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (!Number.isFinite(value) || !Number.isInteger(value)) {
            throw new ArgumentError(`'${extractedParamName}' must be an integer.`, extractedParamName);
        }
    }

    /**
     * Validates a value against a custom predicate function.
     * 
     * @remarks
     * This is a generic validation method that allows custom validation logic via a predicate function.
     * If the predicate returns `false`, an {@link ArgumentError} is thrown with the provided message.
     * Supports both invocation styles: `check(value, 'value', predicate, message)` and `check({ value }, predicate, message)`.
     * 
     * Use this for complex or domain-specific validation that doesn't fit the standard validation methods.
     * 
     * @typeParam T - The type of the value being validated
     * @param value - The value to validate
     * @param paramName - The name of the parameter being validated (for error messages)
     * @param predicate - A function that returns true if the value is valid, false otherwise
     * @param message - The error message to include in the exception if validation fails
     * @throws {ArgumentError} If the predicate returns false
     * 
     * @example
     * ```typescript
     * function processUser(user: User) {
     *   ArgumentUtility.check(
     *     user.age,
     *     'user.age',
     *     age => age >= 18 && age <= 120,
     *     'User age must be between 18 and 120'
     *   );
     * }
     * ```
     */
    public static check<T>(
        param: Record<string, T>,
        predicate: (v: T) => boolean,
        message: string
    ): void;
    public static check<T>(
        param: T,
        paramName: string,
        predicate: (v: T) => boolean,
        message: string
    ): void;
    public static check<T>(
        param: Record<string, T> | T,
        paramNameOrPredicate: string | ((v: T) => boolean),
        predicateOrMessage: ((v: T) => boolean) | string,
        message?: string
    ): void {
        const hasExplicitParamName = typeof paramNameOrPredicate === 'string';
        const predicate = (hasExplicitParamName ? predicateOrMessage : paramNameOrPredicate) as (v: T) => boolean;
        const validationMessage = (hasExplicitParamName ? message : predicateOrMessage) as string;
        const extracted = hasExplicitParamName
            ? this.extractParameter(param as T, paramNameOrPredicate)
            : this.extractParameter(param as Record<string, T>);

        const { key: extractedParamName, value } = extracted;
        if (!predicate(value)) {
            throw new ArgumentError(validationMessage, extractedParamName);
        }
    }

    /**
     * Validates that a number is finite (not Infinity or NaN).
     * 
     * @remarks
     * This method checks that a numeric value is finite using `Number.isFinite()`.
     * Rejects `Infinity`, `-Infinity`, and `NaN`.
     * Supports both invocation styles: `checkFinite(value, 'value')` and `checkFinite({ value })`.
     * 
     * @param value - The numeric value to validate
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentError} If value is not finite
     * 
     * @example
     * ```typescript
     * function calculate(x: number) {
     *   ArgumentUtility.checkFinite(x, 'x');
     *   return Math.sqrt(x);
     * }
     * 
     * calculate(16);        // OK: 4
     * calculate(Infinity);  // Throws: 'x' must be a finite number
     * calculate(NaN);       // Throws: 'x' must be a finite number
     * ```
     */
    public static checkFinite(param: Record<string, number>): void;
    public static checkFinite(param: number, paramName: string): void;
    public static checkFinite(param: Record<string, number> | number, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (!Number.isFinite(value)) {
            throw new ArgumentError(`'${extractedParamName}' must be a finite number.`, extractedParamName);
        }
    }

    /**
     * Validates that a number is not NaN (Not-a-Number).
     * 
     * @remarks
     * This method explicitly checks for NaN values. Unlike {@link checkFinite}, this allows
     * `Infinity` and `-Infinity` but rejects only `NaN`.
     * Supports both invocation styles: `checkNotNaN(value, 'value')` and `checkNotNaN({ value })`.
     * 
     * @param value - The numeric value to validate
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentError} If value is NaN
     * 
     * @example
     * ```typescript
     * function multiply(a: number, b: number) {
     *   ArgumentUtility.checkNotNaN(a, 'a');
     *   ArgumentUtility.checkNotNaN(b, 'b');
     *   return a * b;
     * }
     * 
     * multiply(5, 10);      // OK: 50
     * multiply(NaN, 10);    // Throws: 'a' cannot be NaN
     * multiply(5, Infinity); // OK: Infinity (NaN check allows Infinity)
     * ```
     */
    public static checkNotNaN(param: Record<string, number>): void;
    public static checkNotNaN(param: number, paramName: string): void;
    public static checkNotNaN(param: Record<string, number> | number, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (Number.isNaN(value)) {
            throw new ArgumentError(`'${extractedParamName}' cannot be NaN.`, extractedParamName);
        }
    }

    /**
     * Validates that a number is a safe integer within JavaScript's safe integer range.
     * 
     * @remarks
     * This method checks that a numeric value is a safe integer using `Number.isSafeInteger()`.
     * Safe integers are those in the range [-(2^53 - 1), 2^53 - 1], inclusive.
     * Supports both invocation styles: `checkSafeInteger(value, 'value')` and `checkSafeInteger({ value })`.
     * 
     * Beyond this range, JavaScript cannot accurately represent all integers due to floating-point
     * precision limitations. Use this for values that must maintain exact integer precision.
     * 
     * @param value - The numeric value to validate
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentError} If value is not a safe integer
     * 
     * @example
     * ```typescript
     * function processId(id: number) {
     *   ArgumentUtility.checkSafeInteger(id, 'id');
     *   // id is guaranteed to be exact
     * }
     * 
     * processId(42);                           // OK
     * processId(Number.MAX_SAFE_INTEGER);      // OK: 9007199254740991
     * processId(Number.MAX_SAFE_INTEGER + 1);  // Throws: 'id' must be a safe integer
     * processId(3.14);                         // Throws: 'id' must be a safe integer
     * ```
     */
    public static checkSafeInteger(param: Record<string, number>): void;
    public static checkSafeInteger(param: number, paramName: string): void;
    public static checkSafeInteger(param: Record<string, number> | number, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (!Number.isSafeInteger(value)) {
            throw new ArgumentError(`'${extractedParamName}' must be a safe integer.`, extractedParamName);
        }
    }

    /**
     * Validates that a value is a valid array index for a given array or length.
     * 
     * @remarks
     * This method checks that a numeric value:
     * 1. Is a safe integer
     * 2. Is non-negative
     * 3. Is less than the specified array length (or maximum length if not provided)
     * Supports both invocation styles: `checkArrayIndex(value, 'value', arrayLength)` and `checkArrayIndex({ value }, arrayLength)`.
     * 
     * @param value - The numeric value to validate as an array index
     * @param paramName - The name of the parameter being validated (for error messages)
     * @param arrayLength - Optional array length to validate against (defaults to `Number.MAX_SAFE_INTEGER`)
     * @throws {ArgumentError} If value is not a safe integer
     * @throws {ArgumentOutOfRangeError} If value is negative or >= arrayLength
     * 
     * @example
     * ```typescript
     * function getItem<T>(array: T[], index: number): T {
     *   ArgumentUtility.checkArrayIndex(index, 'index', array.length);
     *   return array[index];
     * }
     * 
     * getItem([1, 2, 3], 0);   // OK: 1
     * getItem([1, 2, 3], 3);   // Throws: 'index' must be in range [0, 3)
     * getItem([1, 2, 3], -1);  // Throws: 'index' must be in range [0, 3)
     * ```
     */
    public static checkArrayIndex(param: Record<string, number>, arrayLength?: number): void;
    public static checkArrayIndex(param: number, paramName: string, arrayLength?: number): void;
    public static checkArrayIndex(
        param: Record<string, number> | number,
        paramNameOrArrayLength?: string | number,
        arrayLength?: number
    ): void {
        const hasExplicitParamName = typeof paramNameOrArrayLength === 'string';
        const extracted = hasExplicitParamName
            ? this.extractParameter(param as number, paramNameOrArrayLength)
            : this.extractParameter(param as Record<string, number>);

        const { key: extractedParamName, value } = extracted;
        this.checkSafeInteger(value, extractedParamName);

        const resolvedArrayLength = hasExplicitParamName ? arrayLength : paramNameOrArrayLength;
        const maxLength = resolvedArrayLength ?? Number.MAX_SAFE_INTEGER;

        if (value < 0 || value >= maxLength) {
            throw new ArgumentOutOfRangeError(
                extractedParamName,
                `'${extractedParamName}' must be in range [0, ${maxLength}).`,
                value
            );
        }
    }

    /**
     * Validates that a number is finite and negative (< 0).
     * 
     * @remarks
     * This method checks that a numeric value:
     * 1. Is finite (not Infinity, -Infinity, or NaN)
     * 2. Is strictly less than 0
     * Supports both invocation styles: `checkNegative(value, 'value')` and `checkNegative({ value })`.
     * 
     * This is the complement to {@link checkPositive}. For allowing zero, use {@link checkNonPositive}.
     * 
     * @param value - The numeric value to validate
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentOutOfRangeError} If value is not finite or is not negative
     * 
     * @example
     * ```typescript
     * function processDebt(amount: number) {
     *   ArgumentUtility.checkNegative(amount, 'amount');
     *   // amount is guaranteed to be < 0
     * }
     * 
     * processDebt(-100);  // OK
     * processDebt(0);     // Throws: 'amount' must be a negative number
     * processDebt(50);    // Throws: 'amount' must be a negative number
     * ```
     */
    public static checkNegative(param: Record<string, number>): void;
    public static checkNegative(param: number, paramName: string): void;
    public static checkNegative(param: Record<string, number> | number, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (!Number.isFinite(value) || value >= 0) {
            throw new ArgumentOutOfRangeError(extractedParamName, `'${extractedParamName}' must be a negative number.`, value);
        }
    }

    /**
     * Validates that a number is finite and non-positive (<= 0).
     * 
     * @remarks
     * This method checks that a numeric value:
     * 1. Is finite (not Infinity, -Infinity, or NaN)
     * 2. Is less than or equal to 0
     * Supports both invocation styles: `checkNonPositive(value, 'value')` and `checkNonPositive({ value })`.
     * 
     * This is the complement to {@link checkNonNegative}. Zero is accepted.
     * 
     * @param value - The numeric value to validate
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentOutOfRangeError} If value is not finite or is positive
     * 
     * @example
     * ```typescript
     * function processBalance(balance: number) {
     *   ArgumentUtility.checkNonPositive(balance, 'balance');
     *   // balance is guaranteed to be <= 0
     * }
     * 
     * processBalance(-100);  // OK
     * processBalance(0);     // OK
     * processBalance(50);    // Throws: 'balance' must be a non-positive number
     * ```
     */
    public static checkNonPositive(param: Record<string, number>): void;
    public static checkNonPositive(param: number, paramName: string): void;
    public static checkNonPositive(param: Record<string, number> | number, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (!Number.isFinite(value) || value > 0) {
            throw new ArgumentOutOfRangeError(extractedParamName, `'${extractedParamName}' must be a non-positive number.`, value);
        }
    }

    /**
     * Validates that a value is a function.
     * 
     * @remarks
     * This method checks that a value has type 'function'. This is useful for validating
     * callback parameters, predicates, selectors, and other function arguments.
     * Supports both invocation styles: `checkFunction(value, 'value')` and `checkFunction({ value })`.
     * 
     * The type assertion narrows the type to `Function` upon success.
     * 
     * @param value - The value to check
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentTypeError} If value is not a function
     * 
     * @example
     * ```typescript
     * function forEach<T>(items: T[], callback: unknown) {
     *   ArgumentUtility.checkFunction(callback, 'callback');
     *   // TypeScript knows callback is Function here
     *   items.forEach(item => callback(item));
     * }
     * ```
     */
    public static checkFunction(param: Record<string, unknown>): asserts param is Record<string, Function>;
    public static checkFunction(param: unknown, paramName: string): asserts param is Function;
    public static checkFunction(param: Record<string, unknown> | unknown, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (typeof value !== 'function') {
            throw new ArgumentTypeError(extractedParamName, 'function', typeof value);
        }
    }

    /**
     * Validates that a value is iterable (has a callable `[Symbol.iterator]()` method).
     *
     * @remarks
     * This method asserts that the provided value conforms to the JavaScript iterable protocol.
     * Supports both invocation styles: `checkIterable(value, 'value')` and `checkIterable({ value })`.
     *
     * @typeParam T - The expected item type produced by the iterable
     * @param value - The value to validate
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentTypeError} If value is not iterable
     */
    public static checkIterable<T = unknown>(param: Record<string, unknown>): asserts param is Record<string, Iterable<T>>;
    public static checkIterable<T = unknown>(param: unknown, paramName: string): asserts param is Iterable<T>;
    public static checkIterable<T = unknown>(param: Record<string, unknown> | unknown, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (!TypeGuardUtility.isIterable<T>(value)) {
            const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
            throw new ArgumentTypeError(extractedParamName, 'iterable', actualType);
        }
    }

    /**
     * Validates that a value is an iterator (has a callable `next()` method).
     *
     * @remarks
     * This method asserts that the provided value conforms to the JavaScript iterator protocol.
     * Supports both invocation styles: `checkIterator(value, 'value')` and `checkIterator({ value })`.
     *
     * @typeParam T - The expected item type produced by the iterator
     * @param value - The value to validate
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentTypeError} If value is not an iterator
     */
    public static checkIterator<T = unknown>(param: Record<string, unknown>): asserts param is Record<string, Iterator<T>>;
    public static checkIterator<T = unknown>(param: unknown, paramName: string): asserts param is Iterator<T>;
    public static checkIterator<T = unknown>(param: Record<string, unknown> | unknown, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (!TypeGuardUtility.isIterator<T>(value)) {
            const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
            throw new ArgumentTypeError(extractedParamName, 'iterator', actualType);
        }
    }

    /**
     * Validates that a value is a Tyneq enumerable (implements iterable protocol and `getEnumerator()`).
     *
     * @remarks
     * This method asserts that the provided value conforms to the Tyneq `IEnumerable<T>` contract.
     * Supports both invocation styles: `checkEnumerable(value, 'value')` and `checkEnumerable({ value })`.
     *
     * @typeParam T - The expected item type produced by the enumerable
     * @param value - The value to validate
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentTypeError} If value is not an enumerable
     */
    public static checkEnumerable<T = unknown>(param: Record<string, unknown>): asserts param is Record<string, IEnumerable<T>>;
    public static checkEnumerable<T = unknown>(param: unknown, paramName: string): asserts param is IEnumerable<T>;
    public static checkEnumerable<T = unknown>(param: Record<string, unknown> | unknown, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (!TypeGuardUtility.isEnumerable<T>(value)) {
            const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
            throw new ArgumentTypeError(extractedParamName, 'IEnumerable', actualType);
        }
    }

    /**
     * Validates that a value is a Tyneq enumerator (implements iterator protocol with optional return/throw).
     *
     * @remarks
     * This method asserts that the provided value conforms to the Tyneq `IEnumerator<T>` contract.
     * Supports both invocation styles: `checkEnumerator(value, 'value')` and `checkEnumerator({ value })`.
     *
     * @typeParam T - The expected item type produced by the enumerator
     * @param value - The value to validate
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentTypeError} If value is not an enumerator
     */
    public static checkEnumerator<T = unknown>(param: Record<string, unknown>): asserts param is Record<string, IEnumerator<T>>;
    public static checkEnumerator<T = unknown>(param: unknown, paramName: string): asserts param is IEnumerator<T>;
    public static checkEnumerator<T = unknown>(param: Record<string, unknown> | unknown, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (!TypeGuardUtility.isEnumerator<T>(value)) {
            const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
            throw new ArgumentTypeError(extractedParamName, 'IEnumerator', actualType);
        }
    }

    /**
     * Validates that a value is an instance of a specified constructor.
     * 
     * @remarks
     * This method uses the `instanceof` operator to verify that a value is an instance of
     * the specified constructor function. This provides runtime type checking for class instances.
     * Supports both invocation styles: `checkInstanceOf(value, Constructor, 'value')` and `checkInstanceOf({ value }, Constructor)`.
     * 
     * The type assertion narrows the type to `T` upon success.
     * 
     * @typeParam T - The expected instance type
     * @param value - The value to check
     * @param constructor - The constructor function to check against
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentTypeError} If value is not an instance of the constructor
     * 
     * @example
     * ```typescript
     * function processDate(value: unknown) {
     *   ArgumentUtility.checkInstanceOf(value, Date, 'value');
     *   // TypeScript knows value is Date here
     *   return value.getFullYear();
     * }
     * 
     * processDate(new Date());    // OK: 2026
     * processDate("2026-01-01");  // Throws: 'value' must be an instance of Date
     * ```
     */
    public static checkInstanceOf<T>(
        param: Record<string, unknown>,
        constructor: new (...args: any[]) => T
    ): asserts param is Record<string, T>;
    public static checkInstanceOf<T>(
        param: unknown,
        constructor: new (...args: any[]) => T,
        paramName: string
    ): asserts param is T;
    public static checkInstanceOf<T>(
        param: Record<string, unknown> | unknown,
        constructor: new (...args: any[]) => T,
        paramName?: string
    ): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (!(value instanceof constructor)) {
            const constructorName = constructor.name || 'unknown';
            const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
            throw new ArgumentTypeError(extractedParamName, constructorName, actualType);
        }
    }

    /**
     * Validates that a value has a numeric `length` property (array-like objects).
     * 
     * @remarks
     * This method checks that a value has a `length` property of type 'number'.
     * This is useful for validating array-like objects such as arrays, strings, typed arrays,
     * and custom collections that implement the length property.
     * Supports both invocation styles: `checkHasLength(value, 'value')` and `checkHasLength({ value })`.
     * 
     * @param value - The value to check for a length property
     * @param paramName - The name of the parameter being validated (for error messages)
     * @throws {ArgumentTypeError} If value does not have a numeric length property
     * 
     * @example
     * ```typescript
     * function getCount(collection: unknown): number {
     *   ArgumentUtility.checkHasLength(collection, 'collection');
     *   // collection has a numeric length property
     *   return (collection as HasLength).length;
     * }
     * 
     * getCount([1, 2, 3]);        // OK: 3
     * getCount("hello");          // OK: 5
     * getCount({length: 10});     // OK: 10
     * getCount({});               // Throws: 'collection' must have a numeric length property
     * ```
     */
    public static checkHasLength(param: Record<string, unknown>): asserts param is Record<string, HasLength>;
    public static checkHasLength(param: unknown, paramName: string): asserts param is HasLength;
    public static checkHasLength(param: Record<string, unknown> | unknown, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (typeof value !== 'object' || value === null || typeof (value as any).length !== 'number') {
            throw new ArgumentTypeError(extractedParamName, 'object with numeric length property', typeof value);
        }
    }

    public static extractParameter<T>(param: Record<string, T>): KeyValuePair<string, T>;
    public static extractParameter<T>(param: T, paramName: string): KeyValuePair<string, T>;
    public static extractParameter<T>(param: Record<string, T> | T, paramName?: string): KeyValuePair<string, T>;
    public static extractParameter<T>(param: Record<string, T> | T, paramName?: string): KeyValuePair<string, T> {
        const [extractedParamName, value] = paramName ? [paramName, param as T] : nameof(param as Record<string, T>);
        return {
            key: extractedParamName,
            value: value
        }
    }
}