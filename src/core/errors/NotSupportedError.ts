import { TyneqError } from "./TyneqError";

/**
 * Thrown when a requested operation is not supported.
 *
 * @example
 * ```ts
 * try { iterator.throw?.(new Error()); }
 * catch (e) { if (e instanceof NotSupportedError) { ... } }
 * ```
 *
 * @see {@link TyneqError}
 * @group Errors
 */
export class NotSupportedError extends TyneqError {
    public constructor(message = "The requested operation is not supported.", inner?: Error) {
        super(message, { inner });
    }
}
