import type { IEnumerable, IEnumerator } from "../../types/core";
import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { ZipEnumerator } from "../../enumerators/streaming/zip";
import { operator } from "../../extensibility/operatorDecorators";

/**
 * Operator implementation for combining two sequences element-wise using a selector.
 *
 * @remarks
 * This is a streaming operator that pairs corresponding elements from two sequences
 * and applies a selector function to produce result elements. Enumeration stops when
 * either sequence is exhausted. Delegates enumeration logic to {@link ZipEnumerator}.
 *
 * **Performance**: O(1) space (streaming). O(min(n, m)) time when fully enumerated,
 * where n and m are the lengths of the two sequences.
 *
 * **Operator Category**: Streaming - processes paired elements one-at-a-time without buffering.
 *
 * **Registration method**: TC39 `@operator()` class decorator.
 *
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * @typeParam TSource - The type of elements in the first sequence.
 * @typeParam TOther - The type of elements in the second sequence.
 * @typeParam TResult - The type of elements in the result sequence.
 *
 * @see {@link ZipEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.zip} for the public API.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
@operator('zip')
export class ZipOperatorEnumerable<TSource, TOther, TResult> extends TyneqOperatorEnumerable<TSource, TResult> {
    /** The second sequence to combine with the source. */
    private readonly other: Iterable<TOther>;
    /** Function to combine paired elements from both sequences. */
    private readonly selector: (first: TSource, second: TOther) => TResult;

    /**
     * Creates a new zip operator.
     * 
     * @param source - The first sequence.
     * @param other - The second sequence to combine with.
     * @param selector - Function to combine corresponding elements from both sequences.
     */
    public constructor(source: IEnumerable<TSource>, other: Iterable<TOther>, selector: (first: TSource, second: TOther) => TResult) {
        super(source);
        this.other = other;
        this.selector = selector;
    }

    public override getEnumerator(): IEnumerator<TResult> {
        return new ZipEnumerator<TSource, TOther, TResult>(this.source[Symbol.iterator](), this.other[Symbol.iterator](), this.selector);
    }
}