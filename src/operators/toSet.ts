import { builtinTerminal } from "../extensions/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";

/**
 * Terminal operator that materializes a sequence into a JavaScript `Set`.
 *
 * @remarks
 * Immediate. Source is enumerated on call.
 *
 * Duplicate values are removed automatically by the `Set` constructor.
 *
 * @see {@link TyneqSequence.toSet} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "toSet" })
export class ToSetOperator<TSource> extends TyneqTerminalOperator<TSource, Set<TSource>> {
    /**
     * @param source - The source sequence.
     */
    public constructor(source: TyneqSequence<TSource>) {
        super(source);
    }

    public process(): Set<TSource> {
        return new Set(this.source);
    }
}