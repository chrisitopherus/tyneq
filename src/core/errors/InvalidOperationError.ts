import { TyneqError } from "./TyneqError";

/**
 * Thrown when a method call is invalid for the current state of the object.
 *
 * @example
 * ```ts
 * try { Tyneq.from([1, 2]).single(); }
 * catch (e) { if (e instanceof InvalidOperationError) { ... } }
 * ```
 *
 * @see {@link TyneqError}
 * @group Errors
 */
export class InvalidOperationError extends TyneqError {
    public constructor(message = "The operation is invalid in the current state.", inner?: Error) {
        super(message, { inner });
    }
}
