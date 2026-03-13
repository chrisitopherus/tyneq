import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { IEnumerable } from "../../types/core";

/**
 * Terminal operator that iterates through all elements of a sequence without collecting them.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Useful for triggering side effects (e.g., via `tap`) without materializing the results.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.consume} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('consume')
export class ConsumeOperator<T> extends TyneqTerminalOperator<T, void> {
    public constructor(source: IEnumerable<T>) {
        super(source);
    }

    public process(): void {
        for (const _ of this.source) {
            // intentionally consume all elements
        }
    }
}
