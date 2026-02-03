import { TyneqEnumerator } from '../../core/TyneqEnumerator';
import { EnumeratorResult, IEnumerator } from '../../types/core';

export class PopulateEnumerator<TSource, TValue> extends TyneqEnumerator<TSource, TValue> {
    private readonly generator: (item: TSource) => TValue;

    public constructor(sourceEnumerator: IEnumerator<TSource>, generator: (item: TSource) => TValue) {
        super(sourceEnumerator);
        this.generator = generator;
    }

    protected override handleNext(): EnumeratorResult<TValue> {
        while (true) {
            const { value, done } = this.sourceEnumerator.next();
            if (done) {
                return this.complete();
            }

            return this.yield(this.generator(value));
        }
    }
}