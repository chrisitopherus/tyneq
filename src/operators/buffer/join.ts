import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { JoinEnumerator } from "../../enumerators/buffer/join";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class JoinOperatorEnumerable<TSource, TInner, TKey, TResult> extends TyneqOperatorEnumerable<TSource, TResult> {
    private readonly inner: IEnumerable<TInner>;
    private readonly outerKeySelector: (outer: TSource) => TKey
    private readonly innerKeySelector: (inner: TInner) => TKey;
    private readonly resultSelector: (outer: TSource, inner: TInner) => TResult;

    public constructor(
        source: IEnumerable<TSource>,
        inner: IEnumerable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, inner: TInner) => TResult
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
            return new JoinEnumerator<TSource, TInner, TKey, TResult>(source[Symbol.iterator](), innerSource, outerKeySelector, innerKeySelector, resultSelector);
        }
    }

    public override getEnumerator(): IEnumerator<TResult> {
        return new JoinEnumerator<TSource, TInner, TKey, TResult>(
            this.source[Symbol.iterator](),
            this.inner,
            this.outerKeySelector,
            this.innerKeySelector,
            this.resultSelector
        );
    }
}