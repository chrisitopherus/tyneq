import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { Enumerable } from "../types/core";

/**
 * Iterates the source sequence and discards all elements.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.consume}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class ConsumeOperator<T> extends TyneqTerminalOperator<T, void> {
    public constructor(source: Enumerable<T>) {
        super(source);
    }

    public process(): void {
        for (const _ of this.source) {
            // intentionally consume all elements
        }
    }
}