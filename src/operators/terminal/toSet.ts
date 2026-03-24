import { builtinTerminal } from "../../extensibility/builtinTerminal";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";

/**
 * Terminal operator that materializes a sequence into a JavaScript `Set`.
 *
 * @remarks
 * Immediate. Source is enumerated on call.
 *
 * Duplicate values are removed automatically by the `Set` constructor.
 *
 * @see {@link ITyneqEnumerable.toSet} for the public API.
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
    public constructor(source: ITyneqEnumerable<TSource>) {
        super(source);
    }

    public process(): Set<TSource> {
        return new Set(this.source);
    }
}