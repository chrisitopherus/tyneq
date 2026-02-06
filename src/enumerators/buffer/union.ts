import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { IEnumerable, IEnumerator } from '../../types/core';

export class UnionEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly otherValues: IEnumerable<TSource>;
    private bufferedValues = new Set<TSource>();
    private currentEnumerator: IEnumerator<TSource>;
    private isSourceDone = false;
    
    public constructor(sourceEnumerator: IEnumerator<TSource>, otherValues: IEnumerable<TSource>) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
        this.currentEnumerator = this.sourceEnumerator;
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

            if (!this.bufferedValues.has(value)) {
                this.bufferedValues.add(value);
                return this.yield(value);
            }
        }
    }
}