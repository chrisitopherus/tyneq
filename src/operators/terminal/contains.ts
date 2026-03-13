import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { IEnumerable } from "../../types/core";

/**
 * Terminal operator that returns `true` if the sequence contains a specific value.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Compares elements using strict equality (`===`). Short-circuits on the first match.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.contains} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('contains')
export class ContainsOperator<TSource> extends TyneqTerminalOperator<TSource, boolean> {
    private readonly value: TSource;

    /**
     * @param source - The source sequence.
     * @param value - The value to search for.
     */
    public constructor(source: IEnumerable<TSource>, value: TSource) {
        super(source);
        this.value = value;
    }

    public process(): boolean {
        for (const item of this.source) {
            if (item === this.value) {
                return true;
            }
        }

        return false;
    }

}
