import { SequenceContainsNoElementsError } from "../../core/errors/SequenceContainsNoElementsError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from "../../extensibility/operatorDecorators";
import { TyneqComparer } from "../../core/TyneqComparer";
import { ITyneqEnumerable } from "../../types/core";
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Terminal operator that returns the element with the maximum key value.
 *
 * @remarks
 * This method uses immediate execution. The source sequence is fully enumerated when this method is called.
 *
 * Extracts a key from each element using `keySelector` and returns the element whose key is
 * greatest according to `comparer`. Throws if the sequence is empty.
 *
 * @typeParam TSource - The type of elements in the sequence.
 * @typeParam TKey - The type of the comparison key.
 *
 * @see {@link ITyneqEnumerable.maxBy} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal("maxBy")
export class MaxByOperator<TSource, TKey> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly comparer: (a: TKey, b: TKey) => number;
    private readonly keySelector: (element: TSource) => TKey;

    /**
     * @param source - The source sequence.
     * @param keySelector - Extracts the comparison key from each element.
     * @param comparer - The comparer used to order keys; defaults to the natural order comparer.
     * @throws {ArgumentError} If `keySelector` is null or undefined.
     */
    public constructor(source: ITyneqEnumerable<TSource>, keySelector: (element: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number) {
        super(source);
        ArgumentUtility.checkNotOptional({ keySelector });

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
