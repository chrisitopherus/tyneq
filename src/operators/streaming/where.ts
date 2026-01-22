import { EnumeratorResult } from '../../core/enumeratorResult';
import { IEnumerator } from '../../types/core';

export class WhereEnumerator<T> implements IEnumerator<T> {
    private readonly sourceEnumerator: IEnumerator<T>;
    private readonly predicate: (item: T) => boolean;

    public constructor(sourceEnumerator: IEnumerator<T>, predicate: (item: T) => boolean) {
        this.sourceEnumerator = sourceEnumerator;
        this.predicate = predicate;
    }

    public next(): IteratorResult<T> {
        while (true) {
            const next = this.sourceEnumerator.next();
            if (next.done) {
                return EnumeratorResult.done();
            }

            const value = next.value;
            if (this.predicate(value)) {
                return EnumeratorResult.yield(value);
            }
        }
    }
}