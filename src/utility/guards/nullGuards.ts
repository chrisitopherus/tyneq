import { ArgumentError } from '../../core/errors/argument/ArgumentError';
import { ArgumentNullError } from '../../core/errors/argument/ArgumentNullError';
import type { HasLength, Nullable, Optional, Undefinedable } from '../../types/utility';

/**
 * Asserts that `value` is not `null`.
 * @throws {ArgumentNullError}
 * @internal
 */
export function checkNotNull<T>(value: Nullable<T>, paramName: string): asserts value is T {
    if (value === null) {
        throw new ArgumentNullError(paramName);
    }
}

/**
 * Asserts that `value` is not `undefined`.
 * @throws {ArgumentError}
 * @internal
 */
export function checkNotUndefined<T>(value: Undefinedable<T>, paramName: string): asserts value is T {
    if (value === undefined) {
        throw new ArgumentError(`'${paramName}' cannot be undefined.`, paramName);
    }
}

/**
 * Asserts that `value` is neither `null` nor `undefined`.
 * @throws {ArgumentNullError} When `null`.
 * @throws {ArgumentError} When `undefined`.
 * @internal
 */
export function checkNotOptional<T>(value: Optional<T>, paramName: string): asserts value is T {
    checkNotNull(value, paramName);
    checkNotUndefined(value, paramName);
}

/**
 * Asserts that `value` is not `null` and not empty (`length > 0`).
 * @throws {ArgumentNullError} When `null`.
 * @throws {ArgumentError} When `length === 0`.
 * @internal
 */
export function checkNotNullOrEmpty<T extends HasLength>(value: Nullable<T>, paramName: string): asserts value is T {
    checkNotNull(value, paramName);
    if (value.length === 0) {
        throw new ArgumentError(`'${paramName}' cannot be empty.`, paramName);
    }
}

/**
 * Asserts that `value` is not `null`, not `undefined`, and not empty (`length > 0`).
 * @throws {ArgumentNullError} When `null`.
 * @throws {ArgumentError} When `undefined` or `length === 0`.
 * @internal
 */
export function checkNotOptionalOrEmpty<T extends HasLength>(value: Optional<T>, paramName: string): asserts value is T {
    checkNotOptional(value, paramName);
    if (value.length === 0) {
        throw new ArgumentError(`'${paramName}' cannot be empty.`, paramName);
    }
}
