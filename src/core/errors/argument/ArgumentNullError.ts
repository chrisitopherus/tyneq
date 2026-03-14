import { ArgumentError } from "./ArgumentError";

/**
 * Thrown when a required argument is `null`.
 *
 * @remarks
 * Distinct from `undefined`; use {@link ArgumentError} with a custom message for undefined
 * checks, or {@link ArgumentOutOfRangeError} for range violations.
 *
 * The message is automatically formatted as `"${paramName} cannot be null."`.
 *
 * @example
 * ```ts
 * throw new ArgumentNullError("predicate");
 * // Message: "predicate cannot be null."
 * ```
 *
 * @see {@link ArgumentError} for general argument validation errors.
 *
 * @group Errors
 */
export class ArgumentNullError extends ArgumentError {
    constructor(paramName: string, inner?: Error) {
        super(`${paramName} cannot be null.`, paramName, inner);
    }
}
