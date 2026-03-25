import { builtinTerminal } from "../extensions/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { Enumerable } from "../types/core";

/**
 * Terminal operator that returns `true` if the sequence contains a specific value.
 *
 * @remarks
 * Immediate. Source is enumerated on call.
 *
 * Compares elements using strict equality (`===`). Short-circuits on the first match.
 *
 * @see {@link TyneqSequence.contains} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "contains" })
export class ContainsOperator<TSource> extends TyneqTerminalOperator<TSource, boolean> {
    private readonly value: TSource;

    /**
     * @param source - The source sequence.
     * @param value - The value to search for.
     */
    public constructor(source: Enumerable<TSource>, value: TSource) {
        super(source);
        this.value = value;
    }

    public process(): boolean {
        for (const item of this.source) {
            if (item === this.value) {
                return true;
            }
        }

        return false;
    }

}