import { TyneqError } from "../TyneqError";

/**
 * Thrown when a method argument fails validation.
 *
 * @remarks
 * Base class for all argument-related errors. The optional `paramName` property identifies
 * which parameter caused the failure.
 *
 * @example
 * ```ts
 * try {
 *   Tyneq.from(null);
 * } catch (e) {
 *   if (e instanceof ArgumentError) {
 *     console.log(`'${e.paramName}' failed: ${e.message}`);
 *   }
 * }
 * ```
 *
 * @see {@link ArgumentNullError} for null argument errors.
 * @see {@link ArgumentOutOfRangeError} for out-of-range argument errors.
 * @see {@link ArgumentTypeError} for type mismatch errors.
 *
 * @group Errors
 */
export class ArgumentError extends TyneqError {
    /**
     * The name of the parameter that failed validation, if provided.
     */
    public readonly paramName?: string;

    constructor(message: string, paramName?: string, inner?: Error) {
        super(message, { inner });
        this.paramName = paramName;
    }
}
