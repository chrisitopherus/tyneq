import { ArgumentError } from "./ArgumentError";

/**
 * Thrown when an argument is outside the valid range.
 *
 * @example
 * ```ts
 * try { Tyneq.from([1, 2]).take(-1); }
 * catch (e) { if (e instanceof ArgumentOutOfRangeError) { console.log(e.actualValue); } }
 * ```
 *
 * @see {@link ArgumentError}
 * @group Errors
 */
export class ArgumentOutOfRangeError extends ArgumentError {
    /** The actual value that was out of range. */
    public readonly actualValue?: unknown;

    public constructor(paramName: string, message?: string, actualValue?: unknown, inner?: Error) {
        super(message ?? `${paramName} was out of range.`, paramName, inner);
        this.actualValue = actualValue;
    }
}
