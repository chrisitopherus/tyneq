import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { AppendEnumerator } from "../../enumerators/streaming/append";
import { IEnumerable, IEnumerator } from "../../types/core";
import { operator } from "../../extensibility/operatorDecorators";

/**
 * Operator implementation for appending a single element to the end of a sequence.
 *
 * @remarks
 * This is a streaming operator that yields all source elements followed by the
 * appended item. Delegates enumeration logic to {@link AppendEnumerator}.
 *
 * **Performance**: O(1) space (streaming). O(n) time when fully enumerated.
 *
 * **Operator Category**: Streaming - processes elements one-at-a-time without buffering.
 *
 * **Registration method**: TC39 `@operator()` class decorator.
 *
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link AppendEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.append} for the public API.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
@operator('append')
export class AppendOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** The element to append to the sequence. */
    private readonly item: TSource;

    /**
     * Creates a new append operator.
     * 
     * @param source - The source sequence.
     * @param item - The element to append to the end.
     */
    public constructor(source: IEnumerable<TSource>, item: TSource) {
        super(source);
        this.item = item;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new AppendEnumerator<TSource>(this.source[Symbol.iterator](), this.item);
    }
}