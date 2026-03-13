import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { IEnumerable } from "../../types/core";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";

/**
 * Terminal operator that returns `true` if the sequence is null or contains no elements.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Reads at most one element to determine whether the sequence is empty, then disposes the
 * iterator.
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
