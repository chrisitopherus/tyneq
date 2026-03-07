import { TyneqEnumerator } from '../../core/enumerators/TyneqEnumerator';
import { IEnumerator } from '../../types/core';

/**
 * Enumerator implementation that filters elements based on a predicate condition.
 * 
 * @remarks
 * This enumerator operates in a streaming manner, testing each element against the predicate and
 * yielding only those elements for which the predicate returns true. Elements that fail the predicate
 * test are skipped without being yielded.
 * 
 * The implementation loops through the source sequence, continuously evaluating the predicate until
 * an element satisfies the condition or the sequence is exhausted. This makes it efficient for sparse
 * filtering where most elements may be rejected.
 * 
 * Unlike `TakeWhile` or `SkipWhile`, the where operation evaluates every element in the sequence,
 * making it a true filter that can yield elements from anywhere in the source based on the predicate.
 * 
 * **Performance Characteristics:**
 * - Time Complexity: O(n) in worst case where n is number of non-matching elements before a match
 * - Space Complexity: O(1) - no buffering required
 * - Streaming: Elements are processed one at a time without materializing the sequence
 * - Predicate Evaluation: Called for every source element until a match is found
 * 
 * @typeParam T - The type of elements in the sequence
 *
 * @group Enumerators
 * @internal
 */
export class WhereEnumerator<T> extends TyneqEnumerator<T> {
    /**
     * The predicate function used to determine which elements to yield.
     * Evaluated for each source element; elements are yielded only when this returns true.
     */
    private readonly predicate: (item: T) => boolean;

    /**
     * Initializes a new instance of the WhereEnumerator class.
     * 
     * @param sourceEnumerator - The source enumerator to filter elements from
     * @param predicate - The function to test each element; only elements where this returns true are yielded
     */
    public constructor(sourceEnumerator: IEnumerator<T>, predicate: (item: T) => boolean) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    /**
     * Advances the enumerator to the next element that satisfies the predicate.
     * 
     * This method loops through the source elements, evaluating the predicate for each until
     * an element is found that returns true. That element is yielded. If all remaining elements
     * fail the predicate test, the loop continues until the source is exhausted.
     * 
     * @returns An iterator result containing the next element where the predicate returns true,
     *          or done if the source is exhausted without finding a matching element
     */
    protected override handleNext(): IteratorResult<T> {
        while (true) {
            const { value, done } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            if (this.predicate(value)) {
                return this.yield(value);
            }
        }
    }
}