import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { GroupByEnumerator } from "../../enumerators/buffer/groupBy";
import { IEnumerable, IteratorFactory, ITyneqEnumerable } from "../../types/core";

export class GroupByOperator<TSource, TKey, TValue, TResult> extends TyneqOperator<TSource, TResult> {
    private readonly keySelector: (item: TSource) => TKey;
    private readonly valueSelector: (item: TSource) => TValue;
    private readonly resultSelector: (key: TKey, values: ITyneqEnumerable<TValue>) => TResult;

    public constructor(
        source: IEnumerable<TSource>,
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: ITyneqEnumerable<TValue>) => TResult
    ) {
        super(source);
        this.keySelector = keySelector;
        this.valueSelector = valueSelector;
        this.resultSelector = resultSelector;
    }

    public getFactory(): IteratorFactory<TResult> {
        const source = this.source;
        const keySelector = this.keySelector;
        const valueSelector = this.valueSelector;
        const resultSelector = this.resultSelector;

        return () => {
            return new GroupByEnumerator<TSource, TKey, TValue, TResult>(
                source[Symbol.iterator](),
                keySelector,
                valueSelector,
                resultSelector
            );
        }
    }
}