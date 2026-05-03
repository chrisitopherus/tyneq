import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { TyneqComparer } from "../core/TyneqComparer";
import { Enumerable, EqualityComparer } from "../types/core";
import { ArgumentUtility } from "../utility/ArgumentUtility";

/**
 * Returns `true` if the source sequence contains `value`.
 *
 * @remarks
 * Immediate. Enumerates the source until a match is found or the sequence is exhausted.
 * Uses `equalityComparer` for element comparison, or `===` when omitted.
 * Returns `false` for an empty sequence.
 *
 * @see {@link TyneqSequence.contains}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class ContainsOperator<TSource> extends TyneqTerminalOperator<TSource, boolean> {
    private readonly value: TSource;
    private readonly equalityComparer: EqualityComparer<TSource>;

    public constructor(source: Enumerable<TSource>, value: TSource, equalityComparer?: EqualityComparer<TSource>) {
        super(source);
        ArgumentUtility.checkNotNull({ equalityComparer });

        this.value = value;
        this.equalityComparer = equalityComparer ?? TyneqComparer.defaultEqualityComparer;
    }

    public process(): boolean {
        for (const item of this.source) {
            if (this.equalityComparer(item, this.value)) {
                return true;
            }
        }

        return false;
    }
}
