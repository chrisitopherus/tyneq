import { EnumeratorResult } from "../../core/enumeratorResult";
import { IEnumerator } from "../../types/core";

export class ConcatEnumerator<T> implements IEnumerator<T> {
    private readonly sourceEnumerator: IEnumerator<T>;
    private readonly otherEnumerator: IEnumerator<T>;

    private isSourceDone = false;

    public constructor(sourceEnumerator: IEnumerator<T>, otherEnumerator: IEnumerator<T>) {
        this.sourceEnumerator = sourceEnumerator;
        this.otherEnumerator = otherEnumerator;
    }

    public next(): IteratorResult<T> {
        if (!this.isSourceDone) {
            const next = this.sourceEnumerator.next();
            if (!next.done) {
                return EnumeratorResult.yield(next.value);
            }

            this.isSourceDone = true;
        }

        const next = this.otherEnumerator.next();
        if (!next.done) {
            return EnumeratorResult.yield(next.value);
        }

        return EnumeratorResult.done();
    }
}