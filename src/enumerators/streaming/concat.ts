import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator implementation for concatenating two sequences.
 * 
 * @remarks
 * This enumerator yields all elements from the source sequence first, followed by
 * all elements from the other sequence. Streams elements without buffering.
 * 
 * **Implementation**: Passes through source elements until exhausted, then switches
 * to other enumerator.
 * 
 * **Performance**: O(1) space (streaming). O(n + m) time where n and m are sequence lengths.
 * 
 * @typeParam T - The type of elements in both sequences.
 * 
 *
 * @group Enumerators
 * @internal
 */
@operator('concat')
export class ConcatEnumerator<T> extends TyneqEnumerator<T> {
    /** The second enumerator to concatenate. */
    private readonly otherEnumerator: IEnumerator<T>;
    /** Whether source enumeration is complete. */
    private isSourceDone = false;

    /**
     * Creates a new concat enumerator.
     *
     * @param sourceEnumerator - The first enumerator.
     * @param other - The second sequence to concatenate.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, other: Iterable<T>) {
        super(sourceEnumerator);
        this.otherEnumerator = other[Symbol.iterator]();
    }

    /**
     * Gets the next element from either source or other sequence.
     * Automatically switches to other sequence when source is exhausted.
     * 
     * @returns Iterator result containing the next element, or done when both exhausted.
     */
    protected override handleNext(): IteratorResult<T> {
        if (!this.isSourceDone) {
            const next = this.sourceEnumerator.next();
            if (!next.done) {
                return this.yield(next.value);
            }

            this.isSourceDone = true;
        }

        const next = this.otherEnumerator.next();
        if (!next.done) {
            return this.yield(next.value);
        }

        return this.done();
    }
}