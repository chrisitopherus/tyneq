import { InvalidOperationError } from "./InvalidOperationError";
import type { Maybe } from "../../types/utility";

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
    public readonly operatorName: Maybe<string>;

    public constructor(operatorName?: string, inner?: Error) {
        const message = operatorName
            ? `Sequence contains no elements (in "${operatorName}").`
            : "Sequence contains no elements.";
        super(message, inner);
        this.operatorName = operatorName;
    }
}
