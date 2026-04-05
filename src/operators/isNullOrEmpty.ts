import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { Enumerable } from "../types/core";
import { EnumeratorUtility } from "../utility/EnumeratorUtility";

/**
 * Returns true if the sequence is null or contains no elements.
 *
 * @remarks
 * Immediate. Reads at most one element from the source (O(1) enumeration) and then disposes the iterator.
 *
 * @see {@link TyneqSequence.isNullOrEmpty}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class IsNullOrEmptyOperator<T> extends TyneqTerminalOperator<T, boolean> {
    public constructor(source: Enumerable<T>) {
        super(source);
    }

    public process(): boolean {
        const iterator = this.source[Symbol.iterator]();
        const first = iterator.next();

        EnumeratorUtility.tryDispose(iterator);
        return first.done === true;
    }
}