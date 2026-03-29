import { builtinTerminal } from "../plugin/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { Enumerable } from "../types/core";

/**
 * Returns true if the sequence contains a specified value.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.contains}
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "contains" })
export class ContainsOperator<TSource> extends TyneqTerminalOperator<TSource, boolean> {
    private readonly value: TSource;

    
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