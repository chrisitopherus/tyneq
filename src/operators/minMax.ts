import { Enumerable, MinMaxResult } from "../types/core";
import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { SequenceContainsNoElementsError } from "../core/errors/SequenceContainsNoElementsError";

// MinMaxResult is defined in types/core.ts to avoid a circular dependency.
// Re-export it from there so consumers can import it from either location.
export type { MinMaxResult } from "../types/core";

function defaultCompare<T>(a: T, b: T): number {
    if (a < b) return -1;
    if (a > b) return 1;

    return 0;
}

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

    private readonly comparer: (a: T, b: T) => number;

    
    public constructor(source: Enumerable<T>, comparer?: (a: T, b: T) => number) {
        super(source);
        this.comparer = comparer ?? defaultCompare;
    }

    public override process(): MinMaxResult<T> {
        let min: T | undefined;
        let max: T | undefined;
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