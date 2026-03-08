
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { IEnumerable } from "../../types/core";

/**
 * Terminal operator implementation for counting elements in a sequence.
 * 
 * @remarks
 * This is a terminal operator that returns the number of elements in the sequence.
 * Optimizes for arrays by using the length property. For other sequences, enumerates
 * all elements to count them.
 * 
 * **Performance**: O(1) space. O(n) time for general sequences, O(1) for arrays.
 * 
 * **Operator Category**: Terminal - forces evaluation and returns a number.
 *
 * **Registration method**: TC39 `@terminal()` class decorator.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.count} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('count')
export class CountOperator<T> extends TyneqTerminalOperator<T, number> {
    /**
     * Creates a new count operator.
     * 
     * @param source - The source sequence.
     */
    public constructor(source: IEnumerable<T>) {
        super(source);
    }

    public process(): number {
        if (Array.isArray(this.source)) {
            return (this.source as T[]).length;
        }

        let count = 0;
        for (const _ of this.source) {
            count++;
        }

        return count;
    }

}