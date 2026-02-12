import { TyneqEnumerator } from '../../core/enumerators/TyneqEnumerator';
import { IEnumerator } from '../../types/core';

export class PopulateEnumerator<TSource, TValue> extends TyneqEnumerator<TSource, TValue> {
    private readonly value: TValue;

    public constructor(sourceEnumerator: IEnumerator<TSource>, value: TValue) {
        super(sourceEnumerator);
        this.value = value;
    }

    protected override handleNext(): IteratorResult<TValue> {
        while (true) {
            const { done } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            return this.yield(this.value);
        }
    }
}