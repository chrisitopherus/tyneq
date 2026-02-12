import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerable, IEnumerator } from '../../types/core';

export class IntersectByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly otherValues: IEnumerable<TKey>;
    private readonly keySelector: (item: TSource) => TKey;
    private intersectionKeys = new Set<TKey>();
    private bufferedKeys = new Set<TKey>();
    private initialized = false;

    public constructor(sourceEnumerator: IEnumerator<TSource>, otherValues: IEnumerable<TKey>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
        this.keySelector = keySelector;
    }

    protected override handleNext(): IteratorResult<TSource> {
        if (!this.initialized) {
            this.intersectionKeys = new Set<TKey>(this.otherValues);
            this.initialized = true;
        }

        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            const key = this.keySelector(value);

            if (this.intersectionKeys.has(key) && !this.bufferedKeys.has(key)) {
                this.bufferedKeys.add(key);
                return this.yield(value);
            }
        }
    }
}