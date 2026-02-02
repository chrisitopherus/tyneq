import { SequenceContainsNoElementsError } from "../../core/errors/SequenceContainsNoElementsError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { TyneqComparer } from "../../core/TyneqComparer";
import { ITyneqEnumerable } from "../../types/core";
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class MaxByOperator<TSource, TKey> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly comparer: (a: TKey, b: TKey) => number;
    private readonly keySelector: (element: TSource) => TKey;

    public constructor(source: ITyneqEnumerable<TSource>, keySelector: (element: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number) {
        super(source);
        ArgumentUtility.checkNotOptional(keySelector, nameof({ keySelector }));

        this.comparer = comparer ?? TyneqComparer.defaultComparer;
        this.keySelector = keySelector;
    }

    public process(): TSource {
        let maxElement: Nullable<TSource> = null;
        let maxElementKey: Nullable<TKey> = null;
        let hasAtLeastOneElement = false;

        for (const element of this.source) {
            const key = this.keySelector(element);
            if (!hasAtLeastOneElement || this.comparer(key, maxElementKey!) > 0) {
                maxElement = element;
                maxElementKey = key;
                hasAtLeastOneElement = true;
            }
        }
        
        if (!hasAtLeastOneElement) {
            throw new SequenceContainsNoElementsError();
        }

        return maxElement as TSource;
    }
}