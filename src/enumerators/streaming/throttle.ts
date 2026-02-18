import { TyneqEnumerator } from '../../core/enumerators/TyneqEnumerator';
import { IEnumerator } from '../../types/core';

export class ThrottleEnumerator<T> extends TyneqEnumerator<T> {
    private readonly count: number;
    private index: number = -1;
    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        super(sourceEnumerator);
        this.count = count;
    }


    protected override handleNext(): IteratorResult<T> {
        while (true) {
            const { value, done } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            this.index++;
            if (this.index % this.count === 0) {
                return this.yield(value);
            }
        }
    }
}