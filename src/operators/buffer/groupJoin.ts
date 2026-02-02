import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { GroupJoinEnumerator } from "../../enumerators/buffer/groupJoin";
import { IEnumerable, IteratorFactory, ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class GroupJoinOperator<TSource, TInner, TKey, TResult> extends TyneqOperator<TSource, TResult> {
    private readonly inner: IEnumerable<TInner>;
    private readonly outerKeySelector: (outer: TSource) => TKey
    private readonly innerKeySelector: (inner: TInner) => TKey;
    private readonly resultSelector: (outer: TSource, group: ITyneqEnumerable<TInner>) => TResult;

    public constructor(
        source: IEnumerable<TSource>,
        inner: IEnumerable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, group: ITyneqEnumerable<TInner>) => TResult
    ) {
        super(source);
        ArgumentUtility.checkNotOptional(inner, nameof({ inner }));
        ArgumentUtility.checkNotOptional(outerKeySelector, nameof({ outerKeySelector }));
        ArgumentUtility.checkNotOptional(innerKeySelector, nameof({ innerKeySelector }));
        ArgumentUtility.checkNotOptional(resultSelector, nameof({ resultSelector }));

        this.inner = inner;
        this.outerKeySelector = outerKeySelector;
        this.innerKeySelector = innerKeySelector;
        this.resultSelector = resultSelector;
    }

    public getFactory(): IteratorFactory<TResult> {
        const source = this.source;
        const innerSource = this.inner;
        const outerKeySelector = this.outerKeySelector;
        const innerKeySelector = this.innerKeySelector;
        const resultSelector = this.resultSelector;
        return () => {
            return new GroupJoinEnumerator<TSource, TInner, TKey, TResult>(source[Symbol.iterator](), innerSource, outerKeySelector, innerKeySelector, resultSelector);
        }
    }
}