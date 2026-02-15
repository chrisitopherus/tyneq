import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator implementation that yields a specified number of elements from the beginning of a sequence.
 * 
 * @remarks
 * This enumerator operates in a streaming manner, yielding elements one at a time until the specified
 * count is reached. Once the limit is reached, the enumerator signals early completion without consuming
 * the remaining source elements.
 * 
 * The implementation uses `earlyComplete()` instead of `done()` when the count limit is reached,
 * which allows the source enumerator to stop processing early. This optimization is particularly
 * beneficial when combined with expensive upstream operations or infinite sequences.
 * 
 * Edge cases:
 * - Negative count values are normalized to 0, resulting in an empty sequence
 * - If the source has fewer than `count` elements, all available elements are yielded
 * 
 * **Performance Characteristics:**
 * - Time Complexity: O(1) per element
 * - Space Complexity: O(1) - no buffering required
 * - Streaming: Elements are processed one at a time without materializing the sequence
 * - Early Termination: Source enumeration stops as soon as count is reached
 * 
 * @typeParam T - The type of elements in the sequence
 */
export class TakeEnumerator<T> extends TyneqEnumerator<T> {
    /**
     * The maximum number of elements to yield from the source sequence.
     * Negative values are normalized to 0 in the constructor.
     */
    private readonly count: number;

    /**
     * The number of elements yielded so far.
     * Incremented after each successful yield to track progress toward the count limit.
     */
    private takenCount = 0;

    /**
     * Initializes a new instance of the TakeEnumerator class.
     * 
     * @param sourceEnumerator - The source enumerator to take elements from
     * @param count - The number of elements to take (negative values treated as 0)
     */
    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        super(sourceEnumerator);
        this.count = count < 0 ? 0 : count;
    }

    /**
     * Advances the enumerator to the next element, respecting the count limit.
     * 
     * This method checks if the count limit has been reached before attempting to consume from the source.
     * If the limit is reached, `earlyComplete()` is called to signal completion without further source consumption.
     * Otherwise, it fetches the next element from the source and increments the taken counter.
     * 
     * @returns An iterator result containing the next element if available and under the count limit,
     *          or done if the count is reached or the source is exhausted
     */
    protected override handleNext(): IteratorResult<T> {
        if (this.takenCount >= this.count) {
            return this.earlyComplete();
        }

        const result = this.sourceEnumerator.next();
        if (result.done) {
            return this.done();
        }

        this.takenCount++;
        return this.yield(result.value);
    }
}