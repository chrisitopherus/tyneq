import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { TapEnumerator } from "../../enumerators/streaming/tap";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

/**
 * Operator implementation for performing side effects on each element without modifying the sequence.
 * 
 * @remarks
 * This is a streaming operator that invokes an action for each element as it passes
 * through, yielding the original elements unchanged. Useful for debugging, logging,
 * or other side effects. Delegates enumeration logic to {@link TapEnumerator}.
 * 
 * **Performance**: O(1) space (streaming). O(n) time when fully enumerated.
 * 
 * **Operator Category**: Streaming - processes elements one-at-a-time without buffering.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link TapEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.tap} for the public API.
 */
export class TapOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** Side-effect action to invoke for each element. */
    private readonly action: (item: TSource) => void;

    /**
     * Creates a new tap operator.
     * 
     * @param source - The source sequence.
     * @param action - Function to invoke for each element (for side effects only).
     */
    public constructor(source: IEnumerable<TSource>, action: (item: TSource) => void) {
        super(source);
        this.action = action;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new TapEnumerator<TSource>(this.source[Symbol.iterator](), this.action);
    }
}