import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { TapIfEnumerator } from "../../enumerators/streaming/tapIf";
import { IEnumerable, IEnumerator } from "../../types/core";
import { operator } from "../../extensibility/operatorDecorators";

/**
 * Operator implementation for conditionally performing side effects on each element.
 *
 * @remarks
 * This is a streaming operator that invokes an action for each element only if a
 * predicate condition is met, yielding the original elements unchanged. Combines
 * conditional logic with side effects. Delegates enumeration logic to {@link TapIfEnumerator}.
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
 * @see {@link TapIfEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.tapIf} for the public API.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
@operator('tapIf')
export class TapIfOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** Side-effect action to invoke when predicate is true. */
    private readonly action: (item: TSource) => void;
    /** Condition to evaluate before invoking action. */
    private readonly predicate: () => boolean;

    /**
     * Creates a new tapIf operator.
     * 
     * @param source - The source sequence.
     * @param action - Function to invoke for each element when predicate is true.
     * @param predicate - Condition to test before invoking action.
     */
    public constructor(source: IEnumerable<TSource>, action: (item: TSource) => void, predicate: () => boolean) {
        super(source);
        this.action = action;
        this.predicate = predicate;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new TapIfEnumerator<TSource>(this.source[Symbol.iterator](), this.action, this.predicate);
    }
}