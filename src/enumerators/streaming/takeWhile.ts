import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator implementation that yields elements while a predicate condition is true.
 * 
 * @remarks
 * This enumerator operates in a streaming manner, testing each element against the predicate.
 * Elements are yielded as long as the predicate returns true. The first element that fails
 * the predicate test causes the enumerator to signal early completion.
 * 
 * The implementation uses `earlyComplete()` when the predicate returns false, which stops
 * source enumeration immediately without consuming the remaining elements. This provides
 * an optimization for scenarios where downstream processing can be avoided.
 * 
 * Unlike `SkipWhile`, this operator continuously evaluates the predicate for each element.
 * The sequence terminates at the first predicate failure, even if subsequent elements would
 * satisfy the predicate. This makes it suitable for taking a prefix of a sequence based on
 * dynamic conditions.
 * 
 * **Performance Characteristics:**
 * - Time Complexity: O(1) per element (plus predicate evaluation cost)
 * - Space Complexity: O(1) - no buffering required
 * - Streaming: Elements are processed one at a time without materializing the sequence
 * - Early Termination: Source enumeration stops as soon as predicate returns false
 * 
 * @typeParam T - The type of elements in the sequence
 *
 * @group Enumerators
 * @internal
 */
export class TakeWhileEnumerator<T> extends TyneqEnumerator<T> {
    /**
     * The predicate function used to determine whether to continue yielding elements.
     * Evaluated for each source element until it returns false.
     */
    private readonly predicate: (value: T) => boolean;

    /**
     * Initializes a new instance of the TakeWhileEnumerator class.
     * 
     * @param sourceEnumerator - The source enumerator to take elements from
     * @param predicate - The function to test each element; elements are yielded while this returns true
     */
    public constructor(sourceEnumerator: IEnumerator<T>, predicate: (value: T) => boolean) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    /**
     * Advances the enumerator to the next element while the predicate returns true.
     * 
     * This method fetches the next element from the source and evaluates the predicate.
     * If the predicate returns true, the element is yielded. If the predicate returns false,
     * `earlyComplete()` is called to terminate enumeration without consuming further source elements.
     * 
     * @returns An iterator result containing the next element if the predicate returns true,
     *          or done if the predicate returns false or the source is exhausted
     */
    protected override handleNext(): IteratorResult<T> {
        const result = this.sourceEnumerator.next();
        if (result.done) {
            return this.done();
        }

        if (this.predicate(result.value)) {
            return this.yield(result.value);
        }

        return this.earlyComplete();
    }
}