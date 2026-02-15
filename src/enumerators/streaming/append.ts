import { AppendOperatorEnumerable } from '../../operators/streaming/append';
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator implementation for appending a single element to the end of a sequence.
 * 
 * @remarks
 * This enumerator yields all source elements first, followed by the appended item.
 * Streams elements without buffering.
 * 
 * **Implementation**: Passes through source elements, then yields appended item once, then completes.
 * 
 * **Performance**: O(1) space (streaming). O(n) time when fully enumerated.
 * 
 * @typeParam T - The type of elements in the sequence.
 * 
 * @see {@link AppendOperatorEnumerable} for the operator that uses this enumerator.
 */
export class AppendEnumerator<T> extends TyneqEnumerator<T> {
    /** Whether source enumeration is complete. */
    private isSourceDone = false;
    /** Whether the appended item has been yielded. */
    private appended = false;
    /** The item to append to the end. */
    private readonly item: T;

    /**
     * Creates a new append enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     * @param item - The element to append to the end.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, item: T) {
        super(sourceEnumerator);
        this.item = item;
    }

    /**
     * Gets the next element (source elements first, then appended item).
     * 
     * @returns Iterator result containing the next element, or done after appended item.
     */
    protected override handleNext(): IteratorResult<T> {
        if (!this.isSourceDone) {
            const sourceNext = this.sourceEnumerator.next();
            if (!sourceNext.done) {
                return this.yield(sourceNext.value);
            }

            this.isSourceDone = true;
        }

        if (!this.appended) {
            this.appended = true;
            return this.yield(this.item);
        }

        return this.done();
    }
}