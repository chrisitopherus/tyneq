import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { IEnumerable } from "../../types/core";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";

/**
 * Terminal operator implementation for checking if a sequence is null or empty.
 *
 * @remarks
 * This is a terminal operator that returns true if the source is null or contains no
 * elements. Checks at most one element, so it short-circuits immediately for non-empty
 * sequences.
 *
 * **Performance**: O(1) space. O(1) time (reads at most one element).
 *
 * **Operator Category**: Terminal - forces evaluation and returns a boolean.
 *
 * **Registration method**: TC39 `@terminal()` class decorator.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.isNullOrEmpty} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('isNullOrEmpty')
export class IsNullOrEmptyOperator<T> extends TyneqTerminalOperator<T, boolean> {
    public constructor(source: IEnumerable<T>) {
        super(source);
    }

    public process(): boolean {
        if (this.source === null || this.source[Symbol.iterator] === null) {
            return true;
        }

        const iterator = this.source[Symbol.iterator]();
        const first = iterator.next();
        
        EnumeratorUtility.tryDispose(iterator);
        return first.done === true;
    }
}
