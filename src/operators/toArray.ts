import { builtinTerminal } from "../plugin/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";

/**
 * Collects all elements into an array.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.toArray}
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "toArray" })
export class ToArrayOperator<TSource> extends TyneqTerminalOperator<TSource, TSource[]> {
    
    public constructor(source: TyneqSequence<TSource>) {
        super(source);
    }

    public process(): TSource[] {
        return Array.from(this.source);
    }
}