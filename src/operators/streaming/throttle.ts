import type { IEnumerable, IEnumerator } from "../../types/core";
import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { ThrottleEnumerator } from "../../enumerators/streaming/throttle";
import { operator } from "../../extensibility/operatorDecorators";

/**
 * Operator implementation for yielding every Nth element from a sequence.
 *
 * @remarks
 * This is a streaming operator that samples the source by emitting one element
 * for every `count` elements seen, effectively down-sampling the sequence.
 * Delegates enumeration logic to {@link ThrottleEnumerator}.
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
 * @see {@link ThrottleEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.throttle} for the public API.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
@operator('throttle')
export class ThrottleOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** The sampling interval — one element is emitted per this many source elements. */
    private readonly count: number;

    /**
     * Creates a new throttle operator.
     *
     * @param source - The source sequence.
     * @param count - The sampling interval (emit 1 element every `count` elements).
     */
    public constructor(source: IEnumerable<TSource>, count: number) {
        super(source);
        this.count = count;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new ThrottleEnumerator<TSource>(this.source[Symbol.iterator](), this.count);
    }
}