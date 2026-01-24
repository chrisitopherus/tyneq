import { TyneqEnumerator } from '../../core/enumerator';
import { EnumeratorResult, IEnumerator } from '../../types/core';

export class WhereEnumerator<T> extends TyneqEnumerator<T> {
    private readonly predicate: (item: T) => boolean;

    public constructor(sourceEnumerator: IEnumerator<T>, predicate: (item: T) => boolean) {
        super(sourceEnumerator);
        this.predicate = predicate;
    }

    protected override handleNext(): EnumeratorResult<T> {
        while (true) {
            const next = this.sourceEnumerator.next();
            if (next.done) {
                return this.complete();
            }

            const value = next.value;
            if (this.predicate(value)) {
                return this.yield(value);
            }
        }
    }
}