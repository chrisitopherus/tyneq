import { InvalidOperationError } from "./InvalidOperationError";

/**
 * Thrown when an operation requires at least one element, but the sequence is empty.
 * 
 * @remarks
 * `SequenceContainsNoElementsError` is a specialized subclass of {@link InvalidOperationError}
 * that is thrown when attempting to retrieve an element from an empty sequence without applying
 * a filtering predicate.
 * 
 * Common operations that throw this error:
 * - {@link TyneqEnumerable.first first()} - retrieves the first element
 * - {@link TyneqEnumerable.last last()} - retrieves the last element
 * - {@link TyneqEnumerable.single single()} - retrieves a single element when no predicate is provided
 * - Other operations that require a non-empty sequence
 * 
 * If a predicate is used and no matches are found, {@link InvalidOperationError} is thrown instead
 * with a specific message about no matching elements.
 * 
 * @example
 * ```typescript
 * import { Tyneq, SequenceContainsNoElementsError } from 'tyneq';
 * 
 * const emptySequence = Tyneq.from([]);
 * 
 * // Throws SequenceContainsNoElementsError: "Sequence contains no elements."
 * try {
 *   emptySequence.first();
 * } catch (error) {
 *   if (error instanceof SequenceContainsNoElementsError) {
 *     console.log(error.message); // "Sequence contains no elements."
 *   }
 * }
 * 
 * // Throws SequenceContainsNoElementsError
 * try {
 *   emptySequence.last();
 * } catch (error) {
 *   if (error instanceof SequenceContainsNoElementsError) {
 *     console.log("Caught empty sequence error");
 *   }
 * }
 * 
 * // Can use *OrDefault variants to avoid the error
 * const first = emptySequence.firstOrDefault(null); // Returns null instead of throwing
 * const last = emptySequence.lastOrDefault(undefined); // Returns undefined instead of throwing
 * ```
 * 
 * @see {@link InvalidOperationError} for more general operation state issues.
 */
export class SequenceContainsNoElementsError extends InvalidOperationError {
  /**
   * Creates a new SequenceContainsNoElementsError.
   * 
   * @remarks
   * The message is fixed to "Sequence contains no elements." and cannot be overridden,
   * as this error has a single well-defined meaning.
   * 
   * @param inner - Optional inner error that caused this error.
   */
  constructor(inner?: Error) {
    super("Sequence contains no elements.", inner);
  }
}