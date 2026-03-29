import { InvalidOperationError } from "./InvalidOperationError";

/**
 * Thrown when an element is required from a sequence that contains no elements.
 *
 * @example
 * ```ts
 * try { Tyneq.from([]).first(); }
 * catch (e) { if (e instanceof SequenceContainsNoElementsError) { ... } }
 * ```
 *
 * @see {@link InvalidOperationError}
 * @group Errors
 */
export class SequenceContainsNoElementsError extends InvalidOperationError {
    public constructor(inner?: Error) {
        super("Sequence contains no elements.", inner);
    }
}
