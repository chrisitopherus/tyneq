import { EnumeratorResult } from "../../core/enumeratorResult";
import { IEnumerator } from "../../types/core";

export class TakeWhileEnumerator<T> implements IEnumerator<T> {
    private readonly sourceEnumerator: IEnumerator<T>;
    private readonly predicate: (value: T) => boolean;

    public constructor(sourceEnumerator: IEnumerator<T>, predicate: (value: T) => boolean) {
        this.sourceEnumerator = sourceEnumerator;
        this.predicate = predicate;
    }

    public next(): IteratorResult<T> {
        const result = this.sourceEnumerator.next();
        if (result.done) {
            return EnumeratorResult.done();
        }

        if (this.predicate(result.value)) {
            return EnumeratorResult.yield(result.value);
        }

        return EnumeratorResult.done();
    }
}