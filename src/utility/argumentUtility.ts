import { ArgumentError } from '../core/errors/argument/ArgumentError';
import { ArgumentNullError } from '../core/errors/argument/ArgumentNullError';
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
        if (value === null) {
            throw new ArgumentNullError(paramName);
        }

        if (value === undefined) {
            throw new ArgumentError(`'${paramName}' cannot be undefined.`, paramName);
        }
    }

    public static checkNotNullOrEmpty<T extends HasLength>(value: Nullable<T>, paramName: string): asserts value is T {
        if (value === null) {
            throw new ArgumentNullError(paramName);
        }

        if (value.length === 0) {
            throw new ArgumentError(`'${paramName}' cannot be empty.`, paramName);
        }
    }

    public static checkNotOptionalOrEmpty<T extends HasLength>(value: Optional<T>, paramName: string): asserts value is T {
        if (value === null) {
            throw new ArgumentNullError(paramName);
        }

        if (value === undefined) {
            throw new ArgumentError(`'${paramName}' cannot be undefined.`, paramName);
        }

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
}