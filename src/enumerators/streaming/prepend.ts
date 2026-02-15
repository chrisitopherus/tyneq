import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator implementation for prepending a single element to the beginning of a sequence.
 * 
 * @remarks
 * This enumerator yields the prepended item first, followed by all source elements.
 * Streams elements without buffering.
 * 
 * **Implementation**: Yields prepended item on first call, then passes through source elements.
 * 
 * **Performance**: O(1) space (streaming). O(n) time when fully enumerated.
 * 
 * @typeParam T - The type of elements in the sequence.
 * 
 * @see {@link PrependOperatorEnumerable} for the operator that uses this enumerator.
 */
export class PrependEnumerator<T> extends TyneqEnumerator<T> {
    /** Whether the prepended item has been yielded. */
    private prepended = false;
    /** The item to prepend to the beginning. */
    private readonly item: T;

    /**
     * Creates a new prepend enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     * @param item - The element to prepend to the beginning.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, item: T) {
        super(sourceEnumerator);
        this.item = item;
    }

    /**
     * Gets the next element (prepended item first, then source elements).
     * 
     * @returns Iterator result containing the next element, or done when source exhausted.
     */
    protected override handleNext(): IteratorResult<T> {
        if (!this.prepended) {
            this.prepended = true;
            return this.yield(this.item);
        }

        const nextItem = this.sourceEnumerator.next();
        if (!nextItem.done) {
            return this.yield(nextItem.value);
        }

        return this.done();
    }
}