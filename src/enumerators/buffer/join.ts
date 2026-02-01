import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { EnumeratorResult, IEnumerator, IEnumerable } from '../../types/core';
import { ArgumentUtility } from "../../utility/argumentUtility";
import { TyneqMap } from "../../utility/map";
import { nameof } from "../../utility/nameof";

export class JoinEnumerator<TOuter, TInner, TKey, TResult> extends TyneqEnumerator<TOuter, TResult> {
    private readonly innerSource: IEnumerable<TInner>;
    private readonly outerKeySelector: (outer: TOuter) => TKey;
    private readonly innerKeySelector: (inner: TInner) => TKey;
    private readonly resultSelector: (outer: TOuter, inner: TInner) => TResult;

    private isInitialized = false;
    private innerLookup = new TyneqMap<TKey, TInner[]>();

    public constructor(
        sourceEnumerator: IEnumerator<TOuter>,
        innerSource: IEnumerable<TInner>,
        outerKeySelector: (outer: TOuter) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TOuter, inner: TInner) => TResult
    ) {
        super(sourceEnumerator);
        ArgumentUtility.checkNotOptional(innerSource, nameof({ innerSource }));
        ArgumentUtility.checkNotOptional(outerKeySelector, nameof({ outerKeySelector }));
        ArgumentUtility.checkNotOptional(innerKeySelector, nameof({ innerKeySelector }));
        ArgumentUtility.checkNotOptional(resultSelector, nameof({ resultSelector }));

        this.innerSource = innerSource;
        this.outerKeySelector = outerKeySelector;
        this.innerKeySelector = innerKeySelector;
        this.resultSelector = resultSelector;
    }

    protected handleNext(): EnumeratorResult<TResult> {
        if (!this.isInitialized) {
            for (const innerItem of this.innerSource) {
                const key = this.innerKeySelector(innerItem);
                const bucket = this.innerLookup.getOrInit(key, () => []);
                bucket.push(innerItem);
            }

            this.isInitialized = true;
        }

        while (true) {
            const { done, value: outerItem } = this.sourceEnumerator.next();
            if (done) {
                return this.complete();
            }

            const outerKey = this.outerKeySelector(outerItem);
            const innerItems = this.innerLookup.get(outerKey);
            if (innerItems === undefined) continue;

            for (const innerItem of innerItems) {
                const resultItem = this.resultSelector(outerItem, innerItem);
                return this.yield(resultItem);
            }
        }
    }
}