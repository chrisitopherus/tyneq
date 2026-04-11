import { Enumerable, MinMaxResult, Comparer } from "../types/core";
import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { SequenceContainsNoElementsError } from "../core/errors/SequenceContainsNoElementsError";
import { TyneqComparer } from "../core/TyneqComparer";
import { Maybe } from "../types/utility";

// MinMaxResult is defined in types/core.ts to avoid a circular dependency.
// Re-export it from there so consumers can import it from either location.
export type { MinMaxResult } from "../types/core";

/**
 * Returns both the minimum and maximum elements of the sequence in a single pass.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.minMax}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class MinMaxOperator<T> extends TyneqTerminalOperator<T, MinMaxResult<T>> {

    private readonly comparer: Comparer<T>;


    public constructor(source: Enumerable<T>, comparer?: Comparer<T>) {
        super(source);
        this.comparer = comparer ?? TyneqComparer.defaultComparer;
    }

    public override process(): MinMaxResult<T> {
        let min: Maybe<T>;
        let max: Maybe<T>;
        let hasElements = false;

        for (const item of this.source) {
            if (!hasElements) {
                min = item;
                max = item;
                hasElements = true;
            } else {
                if (this.comparer(item, min as T) < 0) min = item;
                if (this.comparer(item, max as T) > 0) max = item;
            }
        }

        if (!hasElements) {
            throw new SequenceContainsNoElementsError();
        }

        return { min: min as T, max: max as T };
    }
}