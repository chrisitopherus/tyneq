import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator implementation that bypasses a specified number of elements from the end of a sequence.
 * 
 * @remarks
 * This enumerator uses a circular buffer to maintain the last N elements from the source sequence.
 * It operates in a streaming manner by buffering exactly `count` elements before yielding any results.
 * Once the buffer is full, each new element from the source causes the oldest buffered element to be
 * yielded, maintaining a sliding window of the last N elements.
 * 
 * The implementation handles edge cases gracefully:
 * - When count is 0, behaves as a pass-through with no buffering
 * - When count is negative, treats it as 0
 * - When the source has fewer than `count` elements, yields nothing
 * 
 * The circular buffer approach ensures O(1) space overhead relative to the count parameter,
 * regardless of the source sequence length.
 * 
 * **Performance Characteristics:**
 * - Time Complexity: O(1) per element after buffer initialization
 * - Space Complexity: O(k) where k is the count parameter
 * - Streaming: Processes elements one at a time with minimal buffering
 * 
 * @typeParam T - The type of elements in the sequence
 *
 * @group Enumerators
 * @internal
 */
export class SkipLastEnumerator<T> extends TyneqEnumerator<T> {
    /**
     * The number of elements to skip from the end of the source sequence.
     * Negative values are normalized to 0.
     */
    private readonly count: number;
    
    /**
     * Circular buffer holding the last N elements from the source sequence.
     * Elements are written in a round-robin fashion using `writeIndex`.
     */
    private readonly buffer: T[];
    
    /**
     * The current position in the circular buffer where the next element will be written.
     * Wraps around to 0 when reaching `count`.
     */
    private writeIndex: number = 0;
    
    /**
     * The number of elements currently in the buffer during the initial fill phase.
     * Once this reaches `count`, the buffer is full and yielding begins.
     */
    private filledCount: number = 0;

    /**
     * Initializes a new instance of the SkipLastEnumerator class.
     * 
     * @param sourceEnumerator - The source enumerator to skip last elements from
     * @param count - The number of elements to skip from the end (negative values treated as 0)
     */
    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        super(sourceEnumerator);
        this.count = count < 0 ? 0 : count;
        this.buffer = new Array<T>(this.count);
    }

    /**
     * Advances the enumerator to the next element using a circular buffer strategy.
     * 
     * This method implements a sliding window algorithm:
     * 1. During the initial fill phase (`filledCount < count`), elements are buffered without yielding
     * 2. Once the buffer is full, each new element causes the oldest buffered element to be yielded
     * 3. When the source is exhausted, the remaining buffered elements are skipped (never yielded)
     * 
     * The circular buffer uses modulo arithmetic to wrap the write index, avoiding array shifts
     * and maintaining O(1) performance per element.
     * 
     * @returns An iterator result containing the oldest buffered element when the buffer is full,
     *          or done if the source is exhausted
     */
    protected override handleNext(): IteratorResult<T> {
        if (this.count === 0) {
            const current = this.sourceEnumerator.next();
            if (current.done) {
                return this.done();
            } else {
                return this.yield(current.value);
            }
        }

        while (true) {
            const current = this.sourceEnumerator.next();
            if (current.done) {
                return this.done();
            }

            if (this.filledCount < this.count) {
                this.buffer[this.writeIndex] = current.value;
                this.writeIndex = (this.writeIndex + 1) % this.count;
                this.filledCount++;
                continue;
            }

            const oldest = this.buffer[this.writeIndex];
            this.buffer[this.writeIndex] = current.value;
            this.writeIndex = (this.writeIndex + 1) % this.count;
            return this.yield(oldest);
        }
    }
}