import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator implementation for reversing the order of sequence elements.
 * 
 * @remarks
 * This enumerator consumes the entire source sequence on first iteration to buffer all
 * elements, then yields them in reverse order.
 * 
 * **Implementation**: Buffers all source elements into an array on first call, then
 * yields from the end backwards.
 * 
 * **Performance**: O(n) space for buffering. O(n) time for initial buffering.
 * 
 * @typeParam T - The type of elements in the sequence.
 * 
 *
 * @group Enumerators
 * @internal
 */
@operator('reverse')
export class ReverseEnumerator<T> extends TyneqEnumerator<T> {
    /** Array containing all source elements. */
    private buffer: T[] = [];
    /** Current index (counts down from end). */
    private index: number = -1;

    /**
     * Creates a new reverse enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     */
    public constructor(sourceEnumerator: IEnumerator<T>) {
        super(sourceEnumerator);
    }

    protected override initialize(): void {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                this.index = this.buffer.length - 1;
                break;
            }

            this.buffer.push(value);
        }
    }

    /**
     * Gets the next element in reverse order.
     * On first call, consumes entire source into buffer.
     * 
     * @returns Iterator result containing the next element from the end, or done if exhausted.
     */
    protected override handleNext(): IteratorResult<T> {
        if (this.index < 0) {
            return this.done();
        }

        return this.yield(this.buffer[this.index--]);
    }
}