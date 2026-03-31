import { SequenceContainsNoElementsError } from "../core/errors/SequenceContainsNoElementsError";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { TyneqComparer } from "../core/TyneqComparer";
import { TyneqSequence } from "../types/core";
import { Nullable } from "../types/utility";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";

/**
 * Returns the element with the minimum key as determined by a key selector.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.minBy}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class MinByOperator<TSource, TKey> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly comparer: (a: TKey, b: TKey) => number;
    private readonly keySelector: (element: TSource) => TKey;

    
    public constructor(source: TyneqSequence<TSource>, keySelector: (element: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number) {
        super(source);
        ArgumentUtility.checkNotOptional({ keySelector });

        this.comparer = comparer ?? TyneqComparer.defaultComparer;
        this.keySelector = keySelector;
    }

    public process(): TSource {
        let minElement: Nullable<TSource> = null;
        let minElementKey: Nullable<TKey> = null;
        let hasAtLeastOneElement = false;

        for (const element of this.source) {
            const key = this.keySelector(element);
            if (!hasAtLeastOneElement || this.comparer(key, minElementKey!) < 0) {
                minElement = element;
                minElementKey = key;
                hasAtLeastOneElement = true;
            }
        }

        if (!hasAtLeastOneElement) {
            throw new SequenceContainsNoElementsError();
        }

        return minElement as TSource;
    }
}