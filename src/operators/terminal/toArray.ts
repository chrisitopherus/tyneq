import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from '../../extensibility/operatorDecorators';
import { ITyneqEnumerable } from "../../types/core";

/**
 * Terminal operator implementation for converting a sequence to an array.
 * 
 * @remarks
 * This is a terminal operator that materializes the entire sequence into a JavaScript
 * array. Uses Array.from for efficient conversion. Useful for scenarios requiring
 * indexed access or multiple iterations.
 * 
 * **Performance**: O(n) space (creates array). O(n) time (must enumerate all elements).
 * 
 * **Operator Category**: Terminal - forces full evaluation and returns an array.
 * 
 * **Registration method**: TC39 `@terminal()` class decorator.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.toArray} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('toArray')
export class ToArrayOperator<TSource> extends TyneqTerminalOperator<TSource, TSource[]> {
    /**
     * Creates a new toArray operator.
     * 
     * @param source - The source sequence.
     */
    public constructor(source: ITyneqEnumerable<TSource>) {
        super(source);
    }

    public process(): TSource[] {
        return Array.from(this.source);
    }
}