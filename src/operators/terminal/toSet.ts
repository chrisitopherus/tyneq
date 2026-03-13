import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { ITyneqEnumerable } from "../../types/core";

/**
 * Terminal operator that materializes a sequence into a JavaScript `Set`.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Duplicate values are removed automatically by the `Set` constructor.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.toSet} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('toSet')
export class ToSetOperator<TSource> extends TyneqTerminalOperator<TSource, Set<TSource>> {
    /**
     * @param source - The source sequence.
     */
    public constructor(source: ITyneqEnumerable<TSource>) {
        super(source);
    }

    public process(): Set<TSource> {
        return new Set(this.source);
    }
}
