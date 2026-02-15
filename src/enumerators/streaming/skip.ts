import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Enumerator implementation that bypasses a specified number of elements from the beginning of a sequence.
 * 
 * @remarks
 * This enumerator operates in a streaming manner, skipping the first N elements on the first call to
 * `handleNext()` and then yielding all subsequent elements without buffering. The skipping phase occurs
 * lazily during iteration rather than upfront.
 * 
 * The implementation uses a flag to ensure elements are skipped only once during the enumeration lifecycle.
 * After the skip phase completes, the enumerator becomes a simple pass-through wrapper around the source.
 * 
 * **Performance Characteristics:**
 * - Time Complexity: O(1) per element after initial skip phase
 * - Space Complexity: O(1) - no buffering required
 * - Streaming: Elements are processed one at a time without materializing the sequence
 * 
 * @typeParam T - The type of elements in the sequence
 */
export class SkipEnumerator<T> extends TyneqEnumerator<T> {
    /**
     * The number of elements to skip from the beginning of the source sequence.
     */
    private readonly count: number;
    
    /**
     * Flag indicating whether the skip phase has been completed.
     * Ensures elements are skipped only once during enumeration.
     */
    private skipped = false;

    /**
     * Initializes a new instance of the SkipEnumerator class.
     * 
     * @param sourceEnumerator - The source enumerator to skip elements from
     * @param count - The number of elements to skip from the beginning
     * @throws {Error} If count is negative
     */
    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        super(sourceEnumerator);
        ArgumentUtility.checkNonNegative(count, nameof({ count }));

        this.count = count;
    }

    /**
     * Advances the enumerator to the next element, skipping the first N elements on first call.
     * 
     * On the first invocation, this method consumes and discards the first `count` elements from the
     * source enumerator. If the source is exhausted during the skip phase, the enumerator completes.
     * After skipping, all subsequent calls simply pass through elements from the source without modification.
     * 
     * @returns An iterator result containing the next element after the skip phase, or done if the sequence is exhausted
     */
    protected override handleNext(): IteratorResult<T> {
        if (!this.skipped) {
            let skippedCount = 0;
            while (skippedCount < this.count) {
                const sourceNext = this.sourceEnumerator.next();
                if (sourceNext.done) {
                    return this.done();
                }

                skippedCount++;
            }

            this.skipped = true;
        }

        const sourceNext = this.sourceEnumerator.next();
        if (sourceNext.done) {
            return this.done();
        }

        return this.yield(sourceNext.value);
    }
}