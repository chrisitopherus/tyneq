import { ArgumentError } from '../../core/errors/argument/ArgumentError';
import { ArgumentTypeError } from '../../core/errors/argument/ArgumentTypeError';
import type { IEnumerable, IEnumerator } from '../../types/core';
import type { HasLength } from '../../types/utility';
import { TypeGuardUtility } from '../typeGuardUtility';

/**
 * Static assertion class for function, iterable, iterator, enumerable, and custom predicate checks.
 *
 * @group Utilities
 * @internal
 */
export class TypeGuards {
    private constructor() { }

    /**
     * Asserts that `value` is a function.
     * @throws {ArgumentTypeError}
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    static checkFunction(value: unknown, paramName: string): asserts value is Function {
        if (typeof value !== 'function') {
            throw new ArgumentTypeError(paramName, 'function', typeof value);
        }
    }

    /**
     * Asserts that `value` is iterable (has a callable `[Symbol.iterator]`).
     * @throws {ArgumentTypeError}
     */
    static checkIterable<T = unknown>(value: unknown, paramName: string): asserts value is Iterable<T> {
        if (!TypeGuardUtility.isIterable<T>(value)) {
            const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
            throw new ArgumentTypeError(paramName, 'iterable', actualType);
        }
    }

    /**
     * Asserts that `value` is an iterator (has a callable `next()`).
     * @throws {ArgumentTypeError}
     */
    static checkIterator<T = unknown>(value: unknown, paramName: string): asserts value is Iterator<T> {
        if (!TypeGuardUtility.isIterator<T>(value)) {
            const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
            throw new ArgumentTypeError(paramName, 'iterator', actualType);
        }
    }

    /**
     * Asserts that `value` is an {@link IEnumerable}.
     * @throws {ArgumentTypeError}
     */
    static checkEnumerable<T = unknown>(value: unknown, paramName: string): asserts value is IEnumerable<T> {
        if (!TypeGuardUtility.isEnumerable<T>(value)) {
            const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
            throw new ArgumentTypeError(paramName, 'IEnumerable', actualType);
        }
    }

    /**
     * Asserts that `value` is an {@link IEnumerator}.
     * @throws {ArgumentTypeError}
     */
    static checkEnumerator<T = unknown>(value: unknown, paramName: string): asserts value is IEnumerator<T> {
        if (!TypeGuardUtility.isEnumerator<T>(value)) {
            const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
            throw new ArgumentTypeError(paramName, 'IEnumerator', actualType);
        }
    }

    /**
     * Asserts that `value` is an instance of `constructor`.
     * @throws {ArgumentTypeError}
     */
    static checkInstanceOf<T>(
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
     */
    static checkHasLength(value: unknown, paramName: string): asserts value is HasLength {
        if (typeof value !== 'object' || value === null || typeof (value as any).length !== 'number') {
            throw new ArgumentTypeError(paramName, 'object with numeric length property', typeof value);
        }
    }

    /**
     * Asserts that `value` satisfies a custom predicate.
     * @throws {ArgumentError}
     */
    static check<T>(value: T, paramName: string, predicate: (v: T) => boolean, message: string): void {
        if (!predicate(value)) {
            throw new ArgumentError(message, paramName);
        }
    }
}
