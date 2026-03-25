import { builtinTerminal } from "../extensions/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";

/**
 * Terminal operator that materializes a sequence into a JavaScript array.
 *
 * @remarks
 * Immediate. Source is enumerated on call.
 *
 * @see {@link TyneqSequence.toArray} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "toArray" })
export class ToArrayOperator<TSource> extends TyneqTerminalOperator<TSource, TSource[]> {
    /**
     * @param source - The source sequence.
     */
    public constructor(source: TyneqSequence<TSource>) {
        super(source);
    }

    public process(): TSource[] {
        return Array.from(this.source);
    }
}