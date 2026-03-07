import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { ReverseEnumerator } from "../../enumerators/buffer/reverse";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

/**
 * Operator implementation for reversing element order.
 * 
 * @remarks
 * This is a buffering operator that inverts the order of elements in a sequence.
 * Delegates the actual enumeration logic to {@link ReverseEnumerator}.
 * 
 * **Performance**: O(n) time, O(n) space. Must buffer all elements to reverse order.
 * 
 * **Operator Category**: Buffering - materializes entire sequence into an array before yielding
 * elements in reverse order.
 *
 * This method uses deferred execution. The source sequence is fully buffered on first iteration of the returned sequence.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ReverseEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.reverse} for the public API.
 *
 * @group Operators
 * @category Buffering
 * @internal
 */
export class ReverseOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /**
     * Creates a new reverse operator for the given source sequence.
     * 
     * @param source - The source sequence to reverse.
     */
    public constructor(source: IEnumerable<TSource>) {
        super(source);
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new ReverseEnumerator<TSource>(this.source[Symbol.iterator]());
    }
}