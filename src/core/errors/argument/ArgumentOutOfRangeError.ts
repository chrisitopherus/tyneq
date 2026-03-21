import { ArgumentError } from "./ArgumentError";

/**
 * Thrown when an argument value is outside the acceptable range or constraints.
 *
 * @remarks
 * The `actualValue` property captures the rejected value for debugging.
 *
 * @example
 * ```ts
 * try {
 *   Tyneq.range(0, -5);
 * } catch (e) {
 *   if (e instanceof ArgumentOutOfRangeError) {
 *     console.log(`'${e.paramName}' was ${e.actualValue}`);
 *   }
 * }
 * ```
 *
 * @see {@link ArgumentError} for general argument validation errors.
 *
 * @group Errors
 */
export class ArgumentOutOfRangeError extends ArgumentError {
    /**
     * The out-of-range value that was passed, if captured.
     */
    public readonly actualValue?: unknown;

    public constructor(paramName: string, message?: string, actualValue?: unknown, inner?: Error) {
        super(message ?? `${paramName} was out of range.`, paramName, inner);
        this.actualValue = actualValue;
    }
}
