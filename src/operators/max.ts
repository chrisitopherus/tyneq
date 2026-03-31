import { SequenceContainsNoElementsError } from "../core/errors/SequenceContainsNoElementsError";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { TyneqComparer } from "../core/TyneqComparer";
import { TyneqSequence } from "../types/core";
import { Nullable } from "../types/utility";

/**
 * Returns the maximum element in the sequence using a comparer.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.max}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class MaxOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly comparer: (a: TSource, b: TSource) => number;

    
    public constructor(source: TyneqSequence<TSource>, comparer?: (a: TSource, b: TSource) => number) {
        super(source);

        this.comparer = comparer ?? TyneqComparer.defaultComparer;
    }

    public process(): TSource {
        let maxElement: Nullable<TSource> = null;
        let hasAtLeastOneElement = false;

        for (const element of this.source) {
            if (!hasAtLeastOneElement || this.comparer(element, maxElement!) > 0) {
                maxElement = element;
                hasAtLeastOneElement = true;
            }
        }

        if (!hasAtLeastOneElement) {
            throw new SequenceContainsNoElementsError();
        }

        return maxElement as TSource;
    }
}