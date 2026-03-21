import { TyneqError } from "./TyneqError";

/**
 * Thrown when an operation is intentionally not supported.
 *
 * @remarks
 * Unlike {@link InvalidOperationError}, which signals a state-dependent failure,
 * `NotSupportedError` means the operation is unconditionally unsupported.
 *
 * @example
 * ```ts
 * try {
 *   // some unsupported feature
 * } catch (e) {
 *   if (e instanceof NotSupportedError) {
 *     console.log(e.message);
 *   }
 * }
 * ```
 *
 * @group Errors
 */
export class NotSupportedError extends TyneqError {
    public constructor(message = "The requested operation is not supported.", inner?: Error) {
        super(message, { inner });
    }
}
