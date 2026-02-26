import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { PrependEnumerator } from "../../enumerators/streaming/prepend";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

/**
 * Operator implementation for prepending a single element to the beginning of a sequence.
 * 
 * @remarks
 * This is a streaming operator that yields the prepended item first, followed by all
 * source elements. Delegates enumeration logic to {@link PrependEnumerator}.
 * 
 * **Performance**: O(1) space (streaming). O(n) time when fully enumerated.
 * 
 * **Operator Category**: Streaming - processes elements one-at-a-time without buffering.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link PrependEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.prepend} for the public API.
 */
export class PrependOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** The element to prepend to the sequence. */
    private readonly item: TSource;

    /**
     * Creates a new prepend operator.
     * 
     * @param source - The source sequence.
     * @param item - The element to prepend to the beginning.
     */
    public constructor(source: IEnumerable<TSource>, item: TSource) {
        super(source);
        this.item = item;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const item = this.item;

        return () => {
            return new PrependEnumerator<TSource>(source[Symbol.iterator](), item);
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new PrependEnumerator<TSource>(this.source[Symbol.iterator](), this.item);
    }
}