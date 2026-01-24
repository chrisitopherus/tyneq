import { EnumeratorResult } from "../../core/enumeratorResult";
import { IEnumerator } from "../../types/core";

export class SkipWhileEnumerator<T> implements IEnumerator<T> {
    private readonly sourceEnumerator: IEnumerator<T>;
    private readonly predicate: (item: T) => boolean;

    private isSkipping = true;

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

            this.isSkipping = this.isSkipping && this.predicate(next.value);
            if (!this.isSkipping) {
                return EnumeratorResult.yield(next.value);
            }
        }
    }
}