import { builtinTerminal } from "../extensions/builtinTerminal";

import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { Enumerable } from "../types/core";

/**
 * Terminal operator that returns the number of elements in a sequence.
 *
 * @remarks
 * Immediate. Source is enumerated on call.
 *
 * Optimizes for arrays by reading the `length` property directly. For all other sequences,
 * enumerates each element to count them.
 *
 * @see {@link TyneqSequence.count} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "count" })
export class CountOperator<T> extends TyneqTerminalOperator<T, number> {
    /**
     * @param source - The source sequence.
     */
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