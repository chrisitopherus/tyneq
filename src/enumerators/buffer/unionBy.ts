import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { IEnumerable, IEnumerator } from '../../types/core';

export class UnionByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly otherValues: IEnumerable<TSource>;
    private readonly bufferedKeys = new Set<TKey>();
    private readonly keySelector: (item: TSource) => TKey;
    
    private currentEnumerator: IEnumerator<TSource>;
    private isSourceDone = false;
    
    public constructor(sourceEnumerator: IEnumerator<TSource>, otherValues: IEnumerable<TSource>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
        this.currentEnumerator = this.sourceEnumerator;
        this.keySelector = keySelector;
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.currentEnumerator.next();
            if (done) {
                if (this.isSourceDone) {
                    return this.complete();
                }

                this.isSourceDone = true;
                this.currentEnumerator = this.otherValues[Symbol.iterator]();
                continue;
            }

            const key = this.keySelector(value);
            if (!this.bufferedKeys.has(key)) {
                this.bufferedKeys.add(key);
                return this.yield(value);
            }
        }
    }
}