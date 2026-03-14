import { TyneqError } from "./TyneqError";

/**
 * Thrown when a key is not found in a dictionary or key-value collection.
 *
 * @example
 * ```ts
 * try {
 *   // some lookup that fails
 * } catch (e) {
 *   if (e instanceof KeyNotFoundError) {
 *     console.log(e.message);
 *   }
 * }
 * ```
 *
 * @group Errors
 */
export class KeyNotFoundError extends TyneqError {
    constructor(message = "The given key was not present in the dictionary.", inner?: Error) {
        super(message, { inner });
    }
}
