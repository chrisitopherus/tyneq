import { ArgumentError } from '../../core/errors/argument/ArgumentError';
import { ArgumentOutOfRangeError } from '../../core/errors/argument/ArgumentOutOfRangeError';

/**
 * Asserts that `value` is a finite number ≥ 0.
 * @throws {ArgumentOutOfRangeError}
 * @internal
 */
export function checkNonNegative(value: number, paramName: string): void {
    if (!Number.isFinite(value) || value < 0) {
        throw new ArgumentOutOfRangeError(paramName, `'${paramName}' must be a non-negative number.`);
    }
}

/**
 * Asserts that `value` is a finite number > 0.
 * @throws {ArgumentOutOfRangeError}
 * @internal
 */
export function checkPositive(value: number, paramName: string): void {
    if (!Number.isFinite(value) || value <= 0) {
        throw new ArgumentOutOfRangeError(paramName, `'${paramName}' must be a positive number.`);
    }
}

/**
 * Asserts that `value` is a finite number < 0.
 * @throws {ArgumentOutOfRangeError}
 * @internal
 */
export function checkNegative(value: number, paramName: string): void {
    if (!Number.isFinite(value) || value >= 0) {
        throw new ArgumentOutOfRangeError(paramName, `'${paramName}' must be a negative number.`, value);
    }
}

/**
 * Asserts that `value` is a finite number ≤ 0.
 * @throws {ArgumentOutOfRangeError}
 * @internal
 */
export function checkNonPositive(value: number, paramName: string): void {
    if (!Number.isFinite(value) || value > 0) {
        throw new ArgumentOutOfRangeError(paramName, `'${paramName}' must be a non-positive number.`, value);
    }
}

/**
 * Asserts that `value` is a finite number in the inclusive range `[min, max]`.
 * @throws {ArgumentOutOfRangeError}
 * @internal
 */
export function checkInRange(value: number, min: number, max: number, paramName: string): void {
    if (!Number.isFinite(value) || value < min || value > max) {
        throw new ArgumentOutOfRangeError(paramName, `'${paramName}' must be in range [${min}, ${max}].`);
    }
}

/**
 * Asserts that `value` is a finite integer.
 * @throws {ArgumentError}
 * @internal
 */
export function checkInteger(value: number, paramName: string): void {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
        throw new ArgumentError(`'${paramName}' must be an integer.`, paramName);
    }
}

/**
 * Asserts that `value` is a finite number (not `Infinity`, `-Infinity`, or `NaN`).
 * @throws {ArgumentError}
 * @internal
 */
export function checkFinite(value: number, paramName: string): void {
    if (!Number.isFinite(value)) {
        throw new ArgumentError(`'${paramName}' must be a finite number.`, paramName);
    }
}

/**
 * Asserts that `value` is not `NaN`. Allows `Infinity` and `-Infinity`.
 * @throws {ArgumentError}
 * @internal
 */
export function checkNotNaN(value: number, paramName: string): void {
    if (Number.isNaN(value)) {
        throw new ArgumentError(`'${paramName}' cannot be NaN.`, paramName);
    }
}

/**
 * Asserts that `value` is a safe integer (within `[-(2^53 − 1), 2^53 − 1]`).
 * @throws {ArgumentError}
 * @internal
 */
export function checkSafeInteger(value: number, paramName: string): void {
    if (!Number.isSafeInteger(value)) {
        throw new ArgumentError(`'${paramName}' must be a safe integer.`, paramName);
    }
}

/**
 * Asserts that `value` is a valid zero-based index for an array of length `arrayLength`.
 * @param arrayLength - Exclusive upper bound. If omitted, only checks for non-negative safe integer.
 * @throws {ArgumentError} When not a safe integer.
 * @throws {ArgumentOutOfRangeError} When `< 0` or `>= arrayLength`.
 * @internal
 */
export function checkArrayIndex(value: number, paramName: string, arrayLength?: number): void {
    checkSafeInteger(value, paramName);
    const maxLength = arrayLength ?? Number.MAX_SAFE_INTEGER;
    if (value < 0 || value >= maxLength) {
        throw new ArgumentOutOfRangeError(
            paramName,
            `'${paramName}' must be in range [0, ${maxLength}).`,
            value
        );
    }
}
