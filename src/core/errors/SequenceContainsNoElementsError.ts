import { InvalidOperationError } from "./InvalidOperationError";

/**
 * Thrown when an operation requires at least one element but the sequence is empty.
 *
 * @remarks
 * A specialization of {@link InvalidOperationError} for the predicate-free case. When a
 * predicate is used and no matches exist, `InvalidOperationError` is thrown instead.
 *
 * Use the `*OrDefault` variants (`firstOrDefault`, `lastOrDefault`) to avoid this error.
 *
 * @example
 * ```ts
 * try {
 *   Tyneq.from([]).first();
 * } catch (e) {
 *   if (e instanceof SequenceContainsNoElementsError) {
 *     console.log(e.message); // "Sequence contains no elements."
 *   }
 * }
 * ```
 *
 * @see {@link InvalidOperationError} for more general invalid-state errors.
 *
 * @group Errors
 */
export class SequenceContainsNoElementsError extends InvalidOperationError {
    constructor(inner?: Error) {
        super("Sequence contains no elements.", inner);
    }
}
