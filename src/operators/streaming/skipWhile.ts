import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { SkipWhileEnumerator } from "../../enumerators/streaming/skipWhile";
import { IEnumerable, IEnumerator } from "../../types/core";
import { operator } from "../../extensibility/operatorDecorators";

/**
 * Operator implementation for skipping elements while a predicate is true.
 *
 * @remarks
 * This is a streaming operator that bypasses elements from the start of the sequence
 * as long as a predicate returns true, then yields all remaining elements including
 * the first element that failed the predicate. Delegates enumeration logic to
 * {@link SkipWhileEnumerator}.
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
 * @see {@link SkipWhileEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.skipWhile} for the public API.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
@operator('skipWhile')
export class SkipWhileOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** Predicate function to test elements for skipping. */
    private readonly predicate: (item: TSource) => boolean;

    /**
     * Creates a new skipWhile operator.
     * 
     * @param source - The source sequence.
     * @param predicate - Function to test each element (stops skipping when false).
     */
    public constructor(source: IEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        this.predicate = predicate;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new SkipWhileEnumerator<TSource>(this.source[Symbol.iterator](), this.predicate);
    }
}