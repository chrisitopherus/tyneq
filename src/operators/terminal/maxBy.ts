import { SequenceContainsNoElementsError } from "../../core/errors/SequenceContainsNoElementsError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { TyneqComparer } from "../../core/TyneqComparer";
import { ITyneqEnumerable } from "../../types/core";
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator implementation for finding the element with the maximum key value.
 * 
 * @remarks
 * This is a terminal operator that returns the element whose key (extracted by a selector)
 * is maximum according to a comparer function. Throws an error if the sequence is empty.
 * Must enumerate all elements.
 * 
 * **Performance**: O(1) space. O(n) time (must enumerate all elements).
 * 
 * **Operator Category**: Terminal - forces full evaluation and returns an element.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * @typeParam TKey - The type of the key used for comparison.
 * 
 * @see {@link ITyneqEnumerable.maxBy} for the public API.
 */
export class MaxByOperator<TSource, TKey> extends TyneqTerminalOperator<TSource, TSource> {
    /** Comparison function to determine key ordering. */
    private readonly comparer: (a: TKey, b: TKey) => number;
    /** Function to extract comparison key from each element. */
    private readonly keySelector: (element: TSource) => TKey;

    /**
     * Creates a new maxBy operator.
     * 
     * @param source - The source sequence.
     * @param keySelector - Function to extract comparison key from each element.
     * @param comparer - Optional comparison function for keys (returns <0, 0, or >0).
     * @throws {ArgumentError} If keySelector is null or undefined.
     */
    public constructor(source: ITyneqEnumerable<TSource>, keySelector: (element: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number) {
        super(source);
        ArgumentUtility.checkNotOptional({ keySelector });

        this.comparer = comparer ?? TyneqComparer.defaultComparer;
        this.keySelector = keySelector;
    }

    public process(): TSource {
        let maxElement: Nullable<TSource> = null;
        let maxElementKey: Nullable<TKey> = null;
        let hasAtLeastOneElement = false;

        for (const element of this.source) {
            const key = this.keySelector(element);
            if (!hasAtLeastOneElement || this.comparer(key, maxElementKey!) > 0) {
                maxElement = element;
                maxElementKey = key;
                hasAtLeastOneElement = true;
            }
        }

        if (!hasAtLeastOneElement) {
            throw new SequenceContainsNoElementsError();
        }

        return maxElement as TSource;
    }
}