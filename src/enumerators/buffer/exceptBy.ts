import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { EnumeratorResult, IEnumerable, IEnumerator } from '../../types/core';

export class ExceptByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly excludedValues: IEnumerable<TKey>;
    private excludeSet = new Set<TKey>();
    private initialized = false;
    private readonly keySelector: (item: TSource) => TKey;

    public constructor(sourceEnumerator: IEnumerator<TSource>, excludedValues: IEnumerable<TKey>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.excludedValues = excludedValues;
        this.keySelector = keySelector;
    }

    protected override handleNext(): EnumeratorResult<TSource> {
        if (!this.initialized) {
            this.excludeSet = new Set<TKey>(this.excludedValues);
            this.initialized = true;
        }

        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.complete();
            }

            const key = this.keySelector(value);
            if (!this.excludeSet.has(key)) {
                this.excludeSet.add(key);
                return this.yield(value);
            }
        }
    }
}