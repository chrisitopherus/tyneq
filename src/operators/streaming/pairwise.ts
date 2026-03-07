import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { PairwiseEnumerator } from "../../enumerators/streaming/pairwise";
import { IEnumerable, IEnumerator } from "../../types/core";
import { operator } from "../../extensibility/operatorDecorators";

/**
 * Operator implementation for producing consecutive overlapping pairs from a sequence.
 *
 * @remarks
 * This is a streaming operator that yields each adjacent pair `[a, b]` of consecutive
 * elements. For a source of length N it produces N-1 pairs. An empty or single-element
 * source yields no pairs. Delegates enumeration logic to {@link PairwiseEnumerator}.
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
 * @see {@link PairwiseEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.pairwise} for the public API.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
@operator('pairwise')
export class PairwiseOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource, [TSource, TSource]> {
    public constructor(source: IEnumerable<TSource>) {
        super(source);
    }

    public override getEnumerator(): IEnumerator<[TSource, TSource]> {
        return new PairwiseEnumerator<TSource>(this.source[Symbol.iterator]());
    }
}
