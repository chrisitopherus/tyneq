import { ArgumentError } from '../core/errors/argument/ArgumentError';
import { ArgumentNullError } from '../core/errors/argument/ArgumentNullError';
import { ArgumentOutOfRangeError } from '../core/errors/argument/ArgumentOutOfRangeError';
import { HasLength, Nullable, Optional, Undefinedable } from "../types/utility";

export class ArgumentUtility {
    private constructor() { }

    public static checkNotNull<T>(value: Nullable<T>, paramName: string): asserts value is T {
        if (value === null) {
            throw new ArgumentNullError(paramName);
        }
    }

    public static checkNotUndefined<T>(value: Undefinedable<T>, paramName: string): asserts value is T {
        if (value === undefined) {
            throw new ArgumentError(`'${paramName}' cannot be undefined.`, paramName);
        }
    }

    public static checkNotOptional<T>(value: Optional<T>, paramName: string): asserts value is T {
        this.checkNotNull(value, paramName);
        this.checkNotUndefined(value, paramName);
    }

    public static checkNotNullOrEmpty<T extends HasLength>(value: Nullable<T>, paramName: string): asserts value is T {
        this.checkNotNull(value, paramName);

        if (value.length === 0) {
            throw new ArgumentError(`'${paramName}' cannot be empty.`, paramName);
        }
    }

    public static checkNotOptionalOrEmpty<T extends HasLength>(value: Optional<T>, paramName: string): asserts value is T {
        this.checkNotOptional(value, paramName);

        if (value.length === 0) {
            throw new ArgumentError(`'${paramName}' cannot be empty.`, paramName);
        }
    }

    public static checkNotNullOrWhiteSpace(value: Optional<string>, paramName: string): asserts value is string {
        this.checkNotOptional(value, paramName);
        if (value.trim().length === 0) {
            throw new ArgumentError(`'${paramName}' cannot be empty or whitespace.`, paramName);
        }
    }

    public static checkNonNegative(value: number, paramName: string): void {
        if (!Number.isFinite(value) || value < 0) {
            throw new ArgumentOutOfRangeError(paramName, `'${paramName}' must be a non-negative number.`);
        }
    }

    public static checkPositive(value: number, paramName: string): void {
        if (!Number.isFinite(value) || value <= 0) {
            throw new ArgumentOutOfRangeError(paramName, `'${paramName}' must be a positive number.`);
        }
    }

    public static checkInRange(value: number, min: number, max: number, paramName: string): void {
        if (!Number.isFinite(value) || value < min || value > max) {
            throw new ArgumentOutOfRangeError(paramName, `'${paramName}' must be in range [${min}, ${max}].`);
        }
    }

    public static checkInteger(value: number, paramName: string): void {
        if (!Number.isFinite(value) || !Number.isInteger(value)) {
            throw new ArgumentError(`'${paramName}' must be an integer.`, paramName);
        }
    }

    public static check<T>(
        value: T,
        paramName: string,
        predicate: (v: T) => boolean,
        message: string
    ): void {
        if (!predicate(value)) {
            throw new ArgumentError(message, paramName);
        }
    }
}