import { TyneqError } from "./TyneqError";

/**
 * Thrown when an operation cannot be performed in the current state of the sequence or enumerable.
 * 
 * @remarks
 * `InvalidOperationError` is used when a query operation detects that the sequence or enumerable
 * is in a state where the requested operation is not valid. Common scenarios include:
 * - Attempting to retrieve elements from an empty sequence (e.g., `first()`, `last()`, `single()`)
 * - Attempting to find a single element when multiple matches exist (e.g., `single()` with a predicate)
 * - Attempting to find a single element when no matches exist
 * 
 * This error extends {@link TyneqError} and supports error chaining via the `inner` property.
 * 
 * @example
 * ```typescript
 * import { Tyneq, InvalidOperationError } from 'tyneq';
 * 
 * // Throws InvalidOperationError: "Sequence contains no elements"
 * try {
 *   Tyneq.from([]).first();
 * } catch (error) {
 *   if (error instanceof InvalidOperationError) {
 *     console.log(error.message); // "Sequence contains no elements"
 *   }
 * }
 * 
 * // Throws InvalidOperationError: "Sequence contains more than one matching element"
 * try {
 *   Tyneq.from([1, 2, 3]).single(x => x > 0);
 * } catch (error) {
 *   if (error instanceof InvalidOperationError) {
 *     console.log(error.message);
 *   }
 * }
 * ```
 * 
 * @see {@link SequenceContainsNoElementsError} for the specialized case of empty sequences
 * without a predicate.
 *
 * @group Errors
 */
export class InvalidOperationError extends TyneqError {
  /**
   * Creates a new InvalidOperationError.
   * 
   * @param message - The error message describing why the operation is invalid.
   *                  Defaults to "The operation is invalid in the current state."
   * @param inner - Optional inner error that caused this error.
   */
  constructor(message = "The operation is invalid in the current state.", inner?: Error) {
    super(message, { inner });
  }
}