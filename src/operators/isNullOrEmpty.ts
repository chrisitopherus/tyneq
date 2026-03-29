import { builtinTerminal } from "../plugin/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { Enumerable } from "../types/core";
import { EnumeratorUtility } from "../utility/EnumeratorUtility";

/**
 * Returns true if the sequence is null or contains no elements.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.isNullOrEmpty}
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "isNullOrEmpty" })
export class IsNullOrEmptyOperator<T> extends TyneqTerminalOperator<T, boolean> {
    public constructor(source: Enumerable<T>) {
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