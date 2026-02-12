import { TyneqEnumerator } from '../../core/enumerators/TyneqEnumerator';
import { IEnumerator } from '../../types/core';

export class WhereEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: (item: T) => boolean;

    public constructor(sourceEnumerator: IEnumerator<T>, predicate: (item: T) => boolean) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<T> {
        while (true) {
            const { value, done } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            if (this.predicate(value)) {
                return this.yield(value);
            }
        }
    }
}