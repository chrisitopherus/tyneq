import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator implementation that bypasses elements while a predicate condition is true,
 * then yields all remaining elements.
 * 
 * @remarks
 * This enumerator operates in a streaming manner, testing each element against the predicate
 * until the predicate returns false. Once an element fails the predicate test, all subsequent
 * elements are yielded without further predicate evaluation.
 * 
 * The skipping behavior is cumulative and irreversible:
 * - Initially, all elements are tested against the predicate
 * - The first element that fails the test is yielded and sets `isSkipping` to false
 * - All subsequent elements are yielded without testing, even if they would satisfy the predicate
 * 
 * This differs from a filter operation, which would test every element. SkipWhile only tests
 * elements at the beginning of the sequence until the predicate fails once.
 * 
 * **Performance Characteristics:**
 * - Time Complexity: O(1) per element after predicate first returns false
 * - Space Complexity: O(1) - no buffering required
 * - Streaming: Elements are processed one at a time without materializing the sequence
 * 
 * @typeParam T - The type of elements in the sequence
 *
 * @group Enumerators
 * @internal
 */
@operator('skipWhile')
export class SkipWhileEnumerator<T> extends TyneqEnumerator<T> {
    /**
     * The predicate function used to determine whether to skip each element.
     * Only evaluated while `isSkipping` is true.
     */
    private readonly predicate: (item: T) => boolean;

    /**
     * Flag indicating whether the enumerator is still in the skipping phase.
     * Set to false once the predicate returns false for any element.
     */
    private isSkipping = true;

    /**
     * Initializes a new instance of the SkipWhileEnumerator class.
     * 
     * @param sourceEnumerator - The source enumerator to conditionally skip elements from
     * @param predicate - The function to test each element; elements are skipped while this returns true
     */
    public constructor(sourceEnumerator: IEnumerator<T>, predicate: (item: T) => boolean) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    /**
     * Advances the enumerator to the next element, skipping elements while the predicate returns true.
     * 
     * This method loops through the source elements, evaluating the predicate for each element while
     * in the skipping phase. Once an element fails the predicate test (returns false), that element
     * is yielded and the enumerator transitions out of the skipping phase permanently. All subsequent
     * elements are yielded without predicate evaluation.
     * 
     * @returns An iterator result containing the first element where the predicate returns false,
     *          or the next element if already past the skipping phase, or done if the sequence is exhausted
     */
    protected override handleNext(): IteratorResult<T> {
        while (true) {
            const next = this.sourceEnumerator.next();
            if (next.done) {
                return this.done();
            }

            this.isSkipping = this.isSkipping && this.predicate(next.value);
            if (!this.isSkipping) {
                return this.yield(next.value);
            }
        }
    }
}