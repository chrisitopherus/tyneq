import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { TakeEnumerator } from "../../enumerators/streaming/take";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

/**
 * Operator implementation for taking the first N elements from a sequence.
 * 
 * @remarks
 * This is a streaming operator that yields up to the specified number of elements
 * from the beginning of the source sequence, then stops. Delegates enumeration logic
 * to {@link TakeEnumerator}.
 * 
 * **Performance**: O(1) space (streaming). O(count) time when fully enumerated.
 * 
 * **Operator Category**: Streaming - processes elements one-at-a-time without buffering.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link TakeEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.take} for the public API.
 */
export class TakeOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** The maximum number of elements to yield. */
    private readonly count: number;

    /**
     * Creates a new take operator.
     * 
     * @param source - The source sequence.
     * @param count - The maximum number of elements to return.
     */
    public constructor(source: IEnumerable<TSource>, count: number) {
        super(source);
        this.count = count;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new TakeEnumerator<TSource>(this.source[Symbol.iterator](), this.count);
    }
}