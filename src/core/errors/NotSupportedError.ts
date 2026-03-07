import { TyneqError } from "./TyneqError";

/**
 * Thrown when an operation is explicitly not supported.
 * 
 * @remarks
 * `NotSupportedError` is used when a method or operation is called that is intentionally
 * not supported by the library or a specific implementation. Unlike {@link InvalidOperationError},
 * which indicates an operation fails due to current state, `NotSupportedError` means the
 * operation is never supported.
 * 
 * This error extends {@link TyneqError} and supports error chaining via the `inner` property.
 * 
 * @example
 * ```typescript
 * import { Tyneq, NotSupportedError } from 'tyneq';
 * 
 * try {
 *   // Attempt to use an unsupported feature
 *   // (example use case - feature not implemented)
 *   throw new NotSupportedError("Custom comparators are not yet supported");
 * } catch (error) {
 *   if (error instanceof NotSupportedError) {
 *     console.log(error.message);
 *   }
 * }
 * ```
 *
 * @group Errors
 */
export class NotSupportedError extends TyneqError {
  /**
   * Creates a new NotSupportedError.
   * 
   * @param message - The error message describing which operation or feature is not supported.
   *                  Defaults to "The requested operation is not supported."
   * @param inner - Optional inner error that caused this error.
   */
  constructor(message = "The requested operation is not supported.", inner?: Error) {
    super(message, { inner });
  }
}