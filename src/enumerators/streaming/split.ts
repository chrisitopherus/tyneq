import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator implementation that splits a sequence into sub-arrays based on a delimiter predicate.
 * 
 * @remarks
 * This enumerator divides the source sequence into groups by testing each element against a predicate.
 * When an element matches the predicate (the delimiter), it marks a split point. Elements are accumulated
 * into arrays, and each array is yielded when a delimiter is encountered or the sequence ends.
 * 
 * Key behavior characteristics:
 * - Delimiter elements are excluded from the output (consumed but not included in any array)
 * - Consecutive delimiters do not produce empty arrays (they are effectively merged)
 * - A trailing delimiter at the end of the sequence does not produce a final empty array
 * - The last partial group is yielded when the source is exhausted, even if no delimiter follows it
 * 
 * The implementation accumulates elements in a temporary array until a split point is reached,
 * providing a hybrid approach between streaming and buffering. Each output array is buffered,
 * but the enumerator doesn't materialize the entire source sequence upfront.
 * 
 * **Performance Characteristics:**
 * - Time Complexity: O(n) where n is the average split group size
 * - Space Complexity: O(n) per split group - each output array requires temporary buffering
 * - Partial Streaming: Yields groups as soon as delimiters are encountered
 * 
 * @typeParam TSource - The type of elements in the source sequence
 *
 * @group Enumerators
 * @internal
 */
@operator<[splitOn: unknown]>('split', (splitOn) => {
    ArgumentUtility.checkNotOptional({ splitOn });
})
export class SplitEnumerator<TSource> extends TyneqEnumerator<TSource, TSource[]> {
    /**
     * The predicate function that identifies delimiter elements.
     * When this returns true for an element, a split occurs and the element is excluded from output.
     */
    private readonly splitOn: (item: TSource) => boolean;

    /**
     * Initializes a new instance of the SplitEnumerator class.
     * 
     * @param sourceEnumerator - The source enumerator to split into groups
     * @param splitOn - The predicate function that identifies delimiter elements
     * @throws {Error} If splitOn is null or undefined
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, splitOn: (item: TSource) => boolean) {
        super(sourceEnumerator);
        this.splitOn = splitOn;
    }

    /**
     * Advances the enumerator to the next split group.
     * 
     * This method accumulates elements into a temporary array until a delimiter is encountered.
     * When a delimiter is found:
     * - If the current group has elements, it's yielded
     * - If the current group is empty (consecutive delimiters), the delimiter is skipped
     * 
     * When the source is exhausted, any remaining accumulated elements are yielded as the final group.
     * If the source ends with no accumulated elements (e.g., ends with a delimiter), iteration completes
     * without yielding an empty array.
     * 
     * @returns An iterator result containing an array of elements for the next split group,
     *          or done if the sequence is exhausted with no remaining elements
     */
    protected handleNext(): IteratorResult<TSource[]> {
        const currentSplit: TSource[] = [];

        while (true) {
            const { value, done } = this.sourceEnumerator.next();
            if (done) {
                if (currentSplit.length > 0) {
                    return this.doneWithYield(currentSplit);
                }

                return this.done();
            }

            if (this.splitOn(value)) {
                if (currentSplit.length > 0) {
                    return this.yield(currentSplit);
                }
            } else {
                currentSplit.push(value);
            }
        }
    }
}