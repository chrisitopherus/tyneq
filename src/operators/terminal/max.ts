import { SequenceContainsNoElementsError } from "../../core/errors/SequenceContainsNoElementsError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { TyneqComparer } from "../../core/TyneqComparer";
import { ITyneqEnumerable } from "../../types/core";
import { Nullable } from "../../types/utility";

/**
 * Terminal operator implementation for finding the maximum element in a sequence.
 * 
 * @remarks
 * This is a terminal operator that returns the maximum element according to a comparer
 * function. Throws an error if the sequence is empty. Must enumerate all elements.
 * 
 * **Performance**: O(1) space. O(n) time (must enumerate all elements).
 * 
 * **Operator Category**: Terminal - forces full evaluation and returns an element.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link ITyneqEnumerable.max} for the public API.
 */
export class MaxOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    /** Comparison function to determine element ordering. */
    private readonly comparer: (a: TSource, b: TSource) => number;

    /**
     * Creates a new max operator.
     * 
     * @param source - The source sequence.
     * @param comparer - Optional comparison function (returns <0, 0, or >0).
     */
    public constructor(source: ITyneqEnumerable<TSource>, comparer?: (a: TSource, b: TSource) => number) {
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