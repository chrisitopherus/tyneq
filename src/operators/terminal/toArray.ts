import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from '../../extensibility/operatorDecorators';
import { ITyneqEnumerable } from "../../types/core";

/**
 * Terminal operator that materializes a sequence into a JavaScript array.
 *
 * @remarks
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
     * @param source - The source sequence.
     */
    public constructor(source: ITyneqEnumerable<TSource>) {
        super(source);
    }

    public process(): TSource[] {
        return Array.from(this.source);
    }
}
