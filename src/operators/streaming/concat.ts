import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { ConcatEnumerator } from "../../enumerators/streaming/concat";
import type { IEnumerable, IEnumerator, IteratorFactory, ITyneqEnumerable } from "../../types/core";
import { operator } from "../../extensibility/operatorDecorators";

/**
 * Operator implementation for concatenating two sequences.
 *
 * @remarks
 * This is a streaming operator that yields all elements from the first sequence,
 * followed by all elements from the second sequence. Delegates enumeration logic
 * to {@link ConcatEnumerator}.
 *
 * **Performance**: O(1) space (streaming). O(n + m) time when fully enumerated,
 * where n is the length of the first sequence and m is the length of the second.
 *
 * **Operator Category**: Streaming - processes elements one-at-a-time without buffering.
 *
 * **Registration method**: TC39 `@operator()` class decorator.
 *
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * @typeParam TSource - The type of elements in both sequences.
 *
 * @see {@link ConcatEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.concat} for the public API.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
@operator('concat')
export class ConcatOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** The second sequence to concatenate. */
    private readonly other: Iterable<TSource>;

    /**
     * Creates a new concat operator.
     * 
     * @param source - The first sequence.
     * @param other - The second sequence to append.
     */
    public constructor(source: IEnumerable<TSource>, other: Iterable<TSource>) {
        super(source);
        this.other = other;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new ConcatEnumerator<TSource>(this.source[Symbol.iterator](), this.other[Symbol.iterator]());
    }
}