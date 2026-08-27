import { ArgumentError } from "../../core/errors/argument/ArgumentError";
import { ArgumentNullError } from "../../core/errors/argument/ArgumentNullError";
import type { HasLength, Nullable, Optional, Maybe } from "../../types/utility";

/**
 * Null and undefined guard implementations. Called by `ArgumentUtility`.
 *
 * @internal
 */
export class NullGuards {
    private constructor() { }

    public static checkNotNull<T>(value: Nullable<T>, paramName: string): asserts value is T {
        if (value === null) {
            throw new ArgumentNullError(paramName);
        }
    }

    public static checkNotUndefined<T>(value: Maybe<T>, paramName: string): asserts value is T {
        if (value === undefined) {
            throw new ArgumentError(`'${paramName}' cannot be undefined.`, paramName);
        }
    }

    public static checkNotOptional<T>(value: Optional<T>, paramName: string): asserts value is T {
        NullGuards.checkNotNull(value, paramName);
        NullGuards.checkNotUndefined(value, paramName);
    }

    public static checkNotNullOrEmpty<T extends HasLength>(value: Nullable<T>, paramName: string): asserts value is T {
        NullGuards.checkNotNull(value, paramName);
        if (value.length === 0) {
            throw new ArgumentError(`'${paramName}' cannot be empty.`, paramName);
        }
    }

    public static checkNotOptionalOrEmpty<T extends HasLength>(value: Optional<T>, paramName: string): asserts value is T {
        NullGuards.checkNotOptional(value, paramName);
        if (value.length === 0) {
            throw new ArgumentError(`'${paramName}' cannot be empty.`, paramName);
        }
    }
}
