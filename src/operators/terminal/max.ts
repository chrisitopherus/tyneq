import { SequenceContainsNoElementsError } from "../../core/errors/SequenceContainsNoElementsError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { TyneqComparer } from "../../core/TyneqComparer";
import { ITyneqEnumerable } from "../../types/core";
import { Nullable } from "../../types/utility";

/**
 * Terminal operator that returns the maximum element in a sequence.
 *
 * @remarks
 * Immediate. Source is enumerated on call.
 *
 * Compares elements using `comparer`, defaulting to the natural order comparer. Throws if the
 * sequence is empty.
 *
 * @see {@link ITyneqEnumerable.max} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal("max")
export class MaxOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly comparer: (a: TSource, b: TSource) => number;

    /**
     * @param source - The source sequence.
     * @param comparer - The comparer used to order elements; defaults to the natural order comparer.
     */
    public constructor(source: ITyneqEnumerable<TSource>, comparer?: (a: TSource, b: TSource) => number) {
        super(source);

        this.comparer = comparer ?? TyneqComparer.defaultComparer;
    }

    public process(): TSource {
        let maxElement: Nullable<TSource> = null;
        let hasAtLeastOneElement = false;

        for (const element of this.source) {
            if (!hasAtLeastOneElement || this.comparer(element, maxElement!) > 0) {
                maxElement = element;
                hasAtLeastOneElement = true;
            }
        }

        if (!hasAtLeastOneElement) {
            throw new SequenceContainsNoElementsError();
        }

        return maxElement as TSource;
    }
}
