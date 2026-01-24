import { EnumeratorResult } from "../../core/enumeratorResult";
import { IEnumerator } from "../../types/core";

export class TakeEnumerator<T> implements IEnumerator<T> {
    private readonly sourceEnumerator: IEnumerator<T>;
    private readonly count: number;

    private takenCount = 0;

    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        this.sourceEnumerator = sourceEnumerator;
        this.count = count < 0 ? 0 : count;
    }

    public next(): IteratorResult<T> {
        if (this.takenCount === this.count) {
            return EnumeratorResult.done();
        }

        const result = this.sourceEnumerator.next();
        if (result.done) {
            return EnumeratorResult.done();
        }

        this.takenCount++;
        return EnumeratorResult.yield(result.value);
    }
}