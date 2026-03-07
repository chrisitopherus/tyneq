import { TyneqError } from "./TyneqError";

/**
 * Thrown when a key is not found in a dictionary or key-value collection.
 * 
 * @remarks
 * `KeyNotFoundError` is used when a lookup operation (such as finding a key in a grouped
 * or joined sequence) fails because the requested key does not exist in the collection.
 * 
 * This error extends {@link TyneqError} and supports error chaining via the `inner` property.
 * 
 * @example
 * ```typescript
 * import { Tyneq, KeyNotFoundError } from 'tyneq';
 * 
 * // Example: Looking up a specific key in a grouped result
 * try {
 *   const groups = Tyneq.from([1, 2, 3, 4])
 *     .groupBy(x => x % 2);
 *   
 *   // Attempting to access a key that doesn't exist might throw
 *   const group = groups.where(g => g.key === 5).first();
 * } catch (error) {
 *   if (error instanceof KeyNotFoundError) {
 *     console.log(error.message);
 *   }
 * }
 * ```
 *
 * @group Errors
 */
export class KeyNotFoundError extends TyneqError {
  /**
   * Creates a new KeyNotFoundError.
   * 
   * @param message - The error message describing which key was not found.
   *                  Defaults to "The given key was not present in the dictionary."
   * @param inner - Optional inner error that caused this error.
   */
  constructor(message = "The given key was not present in the dictionary.", inner?: Error) {
    super(message, { inner });
  }
}