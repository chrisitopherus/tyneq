import { TyneqError } from "./TyneqError";

/**
 * Thrown when an operation cannot be performed in the current state of the sequence.
 *
 * @remarks
 * Common causes: retrieving an element from an empty sequence (`first()`, `last()`), or
 * calling `single()` when zero or more than one matching element exists.
 *
 * @example
 * ```ts
 * try {
 *   Tyneq.from([1, 2, 3]).single(x => x > 0);
 * } catch (e) {
 *   if (e instanceof InvalidOperationError) {
 *     console.log(e.message);
 *   }
 * }
 * ```
 *
 * @see {@link SequenceContainsNoElementsError} for the specialized empty-sequence case.
 *
 * @group Errors
 */
export class InvalidOperationError extends TyneqError {
    public constructor(message = "The operation is invalid in the current state.", inner?: Error) {
        super(message, { inner });
    }
}
