import { ArgumentError } from '../core/errors/argument/ArgumentError';
import { ArgumentNullError } from '../core/errors/argument/ArgumentNullError';
import { ArgumentOutOfRangeError } from '../core/errors/argument/ArgumentOutOfRangeError';
import { ArgumentTypeError } from '../core/errors/argument/ArgumentTypeError';
import type { IEnumerable, IEnumerator, KeyValuePair } from '../types/core';
import { HasLength, Nullable, Optional, Undefinedable } from "../types/utility";
import { nameof } from './nameof';
import { TypeGuardUtility } from './typeGuardUtility';

/**
 * Static utility class centralising argument validation for the Tyneq library.
 *
 * @remarks
 * All methods are type-asserting — they narrow the parameter type on success using TypeScript's
 * `asserts` keyword. Each method supports two invocation styles:
 * - Explicit: `checkNotNull(value, 'paramName')` — pass the value and name separately.
 * - Shorthand: `checkNotNull({ value })` — the parameter name is inferred from the object key.
 *
 * On failure, methods throw {@link ArgumentNullError}, {@link ArgumentError},
 * {@link ArgumentOutOfRangeError}, or {@link ArgumentTypeError}, always including the
 * parameter name in the error message.
 *
 * @see {@link ArgumentError}
 * @see {@link ArgumentNullError}
 * @see {@link ArgumentOutOfRangeError}
 *
 * @group Utilities
 * @internal
 */
export class ArgumentUtility {
    private constructor() { }

    /**
     * Asserts that value is not `null`, narrowing from `Nullable<T>` to `T`.
     *
     * @remarks
     * Checks only for `null`; use {@link checkNotOptional} to reject both `null` and `undefined`.
     *
     * @throws {ArgumentNullError} When the value is `null`.
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
     * Asserts that value is not `undefined`, narrowing from `Undefinedable<T>` to `T`.
     *
     * @remarks
     * Checks only for `undefined`; use {@link checkNotOptional} to reject both `null` and `undefined`.
     *
     * @throws {ArgumentError} When the value is `undefined`.
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
     * Asserts that value is neither `null` nor `undefined`, narrowing from `Optional<T>` to `T`.
     *
     * @throws {ArgumentNullError} When the value is `null`.
     * @throws {ArgumentError} When the value is `undefined`.
     */
    public static checkNotOptional<T>(param: Record<string, Optional<T>>): asserts param is Record<string, T>;
    public static checkNotOptional<T>(param: Optional<T>, paramName: string): asserts param is T;
    public static checkNotOptional<T>(param: Record<string, Optional<T>> | Optional<T>, paramName?: string): void {
        const {key: extractedParamName, value} = this.extractParameter(param, paramName);
        this.checkNotNull(value, extractedParamName);
        this.checkNotUndefined(value, extractedParamName);
    }

    /**
     * Asserts that value is not `null` and not empty (`length > 0`).
     *
     * @remarks
     * Works with arrays, strings, and any object with a numeric `length` property.
     * Does not check for `undefined`; use {@link checkNotOptionalOrEmpty} for that.
     *
     * @throws {ArgumentNullError} When the value is `null`.
     * @throws {ArgumentError} When `length === 0`.
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
     * Asserts that value is not `null`, not `undefined`, and not empty (`length > 0`).
     *
     * @throws {ArgumentNullError} When the value is `null`.
     * @throws {ArgumentError} When the value is `undefined` or `length === 0`.
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
     * Asserts that value is a non-null, non-undefined, non-whitespace string.
     *
     * @remarks
     * Whitespace-only strings (e.g. `'   '`, `'\t'`) are treated as empty.
     *
     * @throws {ArgumentNullError} When the value is `null`.
     * @throws {ArgumentError} When the value is `undefined`, empty, or whitespace-only.
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
     * Asserts that value is a finite number ≥ 0.
     *
     * @throws {ArgumentOutOfRangeError} When not finite or negative.
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
     * Asserts that value is a finite number > 0.
     *
     * @remarks
     * Zero is not accepted; use {@link checkNonNegative} when zero is valid.
     *
     * @throws {ArgumentOutOfRangeError} When not finite or ≤ 0.
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
     * Asserts that value is a finite number in the inclusive range `[min, max]`.
     *
     * @param min - Inclusive lower bound.
     * @param max - Inclusive upper bound.
     *
     * @throws {ArgumentOutOfRangeError} When not finite or outside `[min, max]`.
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
     * Asserts that value is a finite integer.
     *
     * @throws {ArgumentError} When not finite or not an integer.
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
     * Asserts that value satisfies a custom predicate.
     *
     * @param predicate - Returns `true` if the value is valid.
     * @param message - Error message when the predicate returns `false`.
     *
     * @throws {ArgumentError} When the predicate returns `false`.
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
     * Asserts that value is a finite number (not `Infinity`, `-Infinity`, or `NaN`).
     *
     * @throws {ArgumentError} When not finite.
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
     * Asserts that value is not `NaN`.
     *
     * @remarks
     * Unlike {@link checkFinite}, allows `Infinity` and `-Infinity`.
     *
     * @throws {ArgumentError} When the value is `NaN`.
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
     * Asserts that value is a safe integer (within `[-(2^53 − 1), 2^53 − 1]`).
     *
     * @remarks
     * Outside this range, JavaScript cannot represent all integers exactly due to
     * floating-point precision limits.
     *
     * @throws {ArgumentError} When not a safe integer.
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
     * Asserts that value is a valid zero-based index for an array of length `arrayLength`.
     *
     * @param arrayLength - Upper bound (exclusive); if omitted, only checks for non-negative safe integer.
     *
     * @throws {ArgumentError} When not a safe integer.
     * @throws {ArgumentOutOfRangeError} When `< 0` or `>= arrayLength`.
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
     * Asserts that value is a finite number < 0.
     *
     * @remarks
     * Complement of {@link checkPositive}; zero is not accepted. Use {@link checkNonPositive}
     * when zero is valid.
     *
     * @throws {ArgumentOutOfRangeError} When not finite or ≥ 0.
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
     * Asserts that value is a finite number ≤ 0.
     *
     * @remarks
     * Complement of {@link checkNonNegative}; zero is accepted.
     *
     * @throws {ArgumentOutOfRangeError} When not finite or positive.
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
     * Asserts that value is a function.
     *
     * @throws {ArgumentTypeError} When value is not a function.
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
     * Asserts that value is iterable (has a callable `[Symbol.iterator]`).
     *
     * @throws {ArgumentTypeError} When value is not iterable.
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
     * Asserts that value is an iterator (has a callable `next()`).
     *
     * @throws {ArgumentTypeError} When value is not an iterator.
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
     * Asserts that value is an {@link IEnumerable}.
     *
     * @throws {ArgumentTypeError} When value is not an `IEnumerable`.
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
     * Asserts that value is an {@link IEnumerator}.
     *
     * @throws {ArgumentTypeError} When value is not an `IEnumerator`.
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
     * Asserts that value is an instance of `constructor`.
     *
     * @throws {ArgumentTypeError} When value is not an instance of `constructor`.
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
     * Asserts that value has a numeric `length` property.
     *
     * @throws {ArgumentTypeError} When value lacks a numeric `length` property.
     */
    public static checkHasLength(param: Record<string, unknown>): asserts param is Record<string, HasLength>;
    public static checkHasLength(param: unknown, paramName: string): asserts param is HasLength;
    public static checkHasLength(param: Record<string, unknown> | unknown, paramName?: string): void {
        const { key: extractedParamName, value } = this.extractParameter(param, paramName);
        if (typeof value !== 'object' || value === null || typeof (value as any).length !== 'number') {
            throw new ArgumentTypeError(extractedParamName, 'object with numeric length property', typeof value);
        }
    }

    /**
     * Extracts the parameter name and value from either invocation style.
     *
     * @returns A `KeyValuePair` where `key` is the parameter name and `value` is the parameter value.
     */
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
