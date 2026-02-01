import { SequenceContainsNoElementsError } from "../../core/errors/SequenceContainsNoElementsError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { TyneqComparer } from "../../core/TyneqComparer";
import { ITyneqEnumerable } from "../../types/core";
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class MinOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly comparer: (a: TSource, b: TSource) => number;

    public constructor(source: ITyneqEnumerable<TSource>, comparer?: (a: TSource, b: TSource) => number) {
        super(source);
        ArgumentUtility.checkNotNull(comparer, nameof({ comparer }));

        this.comparer = comparer ?? TyneqComparer.defaultComparer;
    }

    public process(): TSource {
        let minElement: Nullable<TSource> = null;
        let hasAtLeastOneElement = false;

        for (const element of this.source) {
            if (!hasAtLeastOneElement || this.comparer(element, minElement!) < 0) {
                minElement = element;
                hasAtLeastOneElement = true;
            }
        }

        if (!hasAtLeastOneElement) {
            throw new SequenceContainsNoElementsError();
        }

        return minElement as TSource;
    }
}