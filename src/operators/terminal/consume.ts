import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { IEnumerable } from "../../types/core";

/**
 * Terminal operator implementation for consuming all elements in a sequence without collecting them.
 *
 * @remarks
 * This is a terminal operator that iterates through the entire sequence, discarding each
 * element. Useful for triggering side effects (e.g., via `tap`) without materializing results.
 *
 * **Performance**: O(1) space. O(n) time (must enumerate all elements).
 *
 * **Operator Category**: Terminal - forces full evaluation, returns void.
 *
 * **Registration method**: TC39 `@terminal()` class decorator.
 *
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
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
