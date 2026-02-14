import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { GroupByEnumerator } from "../../enumerators/buffer/groupBy";
import { IEnumerable, IEnumerator, IteratorFactory, ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class GroupByOperatorEnumerable<TSource, TKey, TValue, TResult> extends TyneqOperatorEnumerable<TSource, TResult> {
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
        ArgumentUtility.checkNotOptional(keySelector, nameof({ keySelector }));
        ArgumentUtility.checkNotOptional(valueSelector, nameof({ valueSelector }));
        ArgumentUtility.checkNotOptional(resultSelector, nameof({ resultSelector }));

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

    public override getEnumerator(): IEnumerator<TResult> {
        return new GroupByEnumerator<TSource, TKey, TValue, TResult>(
            this.source[Symbol.iterator](),
            this.keySelector,
            this.valueSelector,
            this.resultSelector
        );
    }
}