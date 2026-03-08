import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { IEnumerable } from "../../types/core";

/**
 * Terminal operator implementation for checking if a sequence contains a specific value.
 * 
 * @remarks
 * This is a terminal operator that determines whether the sequence contains the specified
 * value using strict equality (===). Short-circuits on the first match.
 * 
 * **Performance**: O(1) space. O(n) worst-case time, O(1) best-case (early termination).
 * 
 * **Operator Category**: Terminal - forces evaluation and returns a boolean.
 *
 * **Registration method**: TC39 `@terminal()` class decorator.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
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
    /** The value to search for in the sequence. */
    private readonly value: TSource;

    /**
     * Creates a new contains operator.
     * 
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