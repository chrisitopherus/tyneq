import { builtinTerminal } from "../plugin/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";

/**
 * Collects all elements into a Set.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.toSet}
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "toSet" })
export class ToSetOperator<TSource> extends TyneqTerminalOperator<TSource, Set<TSource>> {
    
    public constructor(source: TyneqSequence<TSource>) {
        super(source);
    }

    public process(): Set<TSource> {
        return new Set(this.source);
    }
}