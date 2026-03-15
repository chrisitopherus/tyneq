import { ArgumentError } from '../../core/errors/argument/ArgumentError';
import { ArgumentTypeError } from '../../core/errors/argument/ArgumentTypeError';
import type { IEnumerable, IEnumerator } from '../../types/core';
import type { HasLength } from '../../types/utility';
import { TypeGuardUtility } from '../typeGuardUtility';

/**
 * Asserts that `value` is a function.
 * @throws {ArgumentTypeError}
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function checkFunction(value: unknown, paramName: string): asserts value is Function {
    if (typeof value !== 'function') {
        throw new ArgumentTypeError(paramName, 'function', typeof value);
    }
}

/**
 * Asserts that `value` is iterable (has a callable `[Symbol.iterator]`).
 * @throws {ArgumentTypeError}
 * @internal
 */
export function checkIterable<T = unknown>(value: unknown, paramName: string): asserts value is Iterable<T> {
    if (!TypeGuardUtility.isIterable<T>(value)) {
        const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
        throw new ArgumentTypeError(paramName, 'iterable', actualType);
    }
}

/**
 * Asserts that `value` is an iterator (has a callable `next()`).
 * @throws {ArgumentTypeError}
 * @internal
 */
export function checkIterator<T = unknown>(value: unknown, paramName: string): asserts value is Iterator<T> {
    if (!TypeGuardUtility.isIterator<T>(value)) {
        const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
        throw new ArgumentTypeError(paramName, 'iterator', actualType);
    }
}

/**
 * Asserts that `value` is an {@link IEnumerable}.
 * @throws {ArgumentTypeError}
 * @internal
 */
export function checkEnumerable<T = unknown>(value: unknown, paramName: string): asserts value is IEnumerable<T> {
    if (!TypeGuardUtility.isEnumerable<T>(value)) {
        const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
        throw new ArgumentTypeError(paramName, 'IEnumerable', actualType);
    }
}

/**
 * Asserts that `value` is an {@link IEnumerator}.
 * @throws {ArgumentTypeError}
 * @internal
 */
export function checkEnumerator<T = unknown>(value: unknown, paramName: string): asserts value is IEnumerator<T> {
    if (!TypeGuardUtility.isEnumerator<T>(value)) {
        const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
        throw new ArgumentTypeError(paramName, 'IEnumerator', actualType);
    }
}

/**
 * Asserts that `value` is an instance of `constructor`.
 * @throws {ArgumentTypeError}
 * @internal
 */
export function checkInstanceOf<T>(
    value: unknown,
    constructor: new (...args: any[]) => T,
    paramName: string
): asserts value is T {
    if (!(value instanceof constructor)) {
        const constructorName = constructor.name || 'unknown';
        const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
        throw new ArgumentTypeError(paramName, constructorName, actualType);
    }
}

/**
 * Asserts that `value` has a numeric `length` property.
 * @throws {ArgumentTypeError}
 * @internal
 */
export function checkHasLength(value: unknown, paramName: string): asserts value is HasLength {
    if (typeof value !== 'object' || value === null || typeof (value as any).length !== 'number') {
        throw new ArgumentTypeError(paramName, 'object with numeric length property', typeof value);
    }
}

/**
 * Asserts that `value` satisfies a custom predicate.
 * @param predicate - Returns `true` if the value is valid.
 * @param message - Error message when the predicate returns `false`.
 * @throws {ArgumentError}
 * @internal
 */
export function check<T>(value: T, paramName: string, predicate: (v: T) => boolean, message: string): void {
    if (!predicate(value)) {
        throw new ArgumentError(message, paramName);
    }
}
