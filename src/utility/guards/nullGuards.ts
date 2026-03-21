import { ArgumentError } from "../../core/errors/argument/ArgumentError";
import { ArgumentNullError } from "../../core/errors/argument/ArgumentNullError";
import type { HasLength, Nullable, Optional, Undefinedable } from "../../types/utility";

/**
 * Static assertion class for null/undefined/empty checks.
 *
 * @group Utilities
 * @internal
 */
export class NullGuards {
    private constructor() { }

    /**
     * Asserts that `value` is not `null`.
     * @throws {ArgumentNullError}
     */
    public static checkNotNull<T>(value: Nullable<T>, paramName: string): asserts value is T {
        if (value === null) {
            throw new ArgumentNullError(paramName);
        }
    }

    /**
     * Asserts that `value` is not `undefined`.
     * @throws {ArgumentError}
     */
    public static checkNotUndefined<T>(value: Undefinedable<T>, paramName: string): asserts value is T {
        if (value === undefined) {
            throw new ArgumentError(`'${paramName}' cannot be undefined.`, paramName);
        }
    }

    /**
     * Asserts that `value` is neither `null` nor `undefined`.
     * @throws {ArgumentNullError} When `null`.
     * @throws {ArgumentError} When `undefined`.
     */
    public static checkNotOptional<T>(value: Optional<T>, paramName: string): asserts value is T {
        NullGuards.checkNotNull(value, paramName);
        NullGuards.checkNotUndefined(value, paramName);
    }

    /**
     * Asserts that `value` is not `null` and not empty (`length > 0`).
     * @throws {ArgumentNullError} When `null`.
     * @throws {ArgumentError} When `length === 0`.
     */
    public static checkNotNullOrEmpty<T extends HasLength>(value: Nullable<T>, paramName: string): asserts value is T {
        NullGuards.checkNotNull(value, paramName);
        if (value.length === 0) {
            throw new ArgumentError(`'${paramName}' cannot be empty.`, paramName);
        }
    }

    /**
     * Asserts that `value` is not `null`, not `undefined`, and not empty (`length > 0`).
     * @throws {ArgumentNullError} When `null`.
     * @throws {ArgumentError} When `undefined` or `length === 0`.
     */
    public static checkNotOptionalOrEmpty<T extends HasLength>(value: Optional<T>, paramName: string): asserts value is T {
        NullGuards.checkNotOptional(value, paramName);
        if (value.length === 0) {
            throw new ArgumentError(`'${paramName}' cannot be empty.`, paramName);
        }
    }
}
