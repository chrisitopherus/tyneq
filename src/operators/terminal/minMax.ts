import { IEnumerable, MinMaxResult } from '../../types/core';
import { terminal } from '../../extensibility/operatorDecorators';
import { TyneqTerminalOperator } from '../../core/operator/TyneqTerminalOperator';
import { SequenceContainsNoElementsError } from '../../core/errors/SequenceContainsNoElementsError';

// MinMaxResult is defined in types/core.ts to avoid a circular dependency.
// Re-export it from there so consumers can import it from either location.
export type { MinMaxResult } from '../../types/core';

/** Default comparer: uses JS relational operators (works for numbers and strings). */
function defaultCompare<T>(a: T, b: T): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/**
 * Terminal operator that returns both the minimum and maximum elements in a single pass.
 *
 * @remarks
 * Immediate. Source is enumerated on call.
 *
 * Fuses `min()` and `max()` into a single enumeration, which avoids iterating the source
 * twice. Throws if the sequence is empty.
 *
 * @see {@link MinMaxResult} for the return type.
 * @see {@link ITyneqEnumerable.minMax} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('minMax')
export class MinMaxOperator<T> extends TyneqTerminalOperator<T, MinMaxResult<T>> {

    private readonly comparer: (a: T, b: T) => number;

    /**
     * @param source - The source sequence.
     * @param comparer - The comparer used to order elements; defaults to the natural order comparer.
     */
    public constructor(source: IEnumerable<T>, comparer?: (a: T, b: T) => number) {
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
