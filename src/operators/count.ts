import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { Enumerable } from "../types/core";

/**
 * Returns the total number of elements in the sequence.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.count}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class CountOperator<T> extends TyneqTerminalOperator<T, number> {
    
    public constructor(source: Enumerable<T>) {
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