import { EnumeratorResult } from "../../core/enumeratorResult";
import { IEnumerator } from "../../types/core";


export class SkipLastEnumerator<T> implements IEnumerator<T> {
    private readonly sourceEnumerator: IEnumerator<T>;
    private readonly count: number;
    private readonly queue: T[] = [];

    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        this.sourceEnumerator = sourceEnumerator;
        this.count = count ? count : 0;
    }

    public next(): IteratorResult<T> {
        if (this.count === 0) {
            return this.sourceEnumerator.next();
        }

        while (true) {
            const current = this.sourceEnumerator.next();
            if (current.done) {
                return EnumeratorResult.done();
            }

            this.queue.push(current.value);

            if (this.queue.length > this.count) {
                const value = this.queue.shift() as T;
                return EnumeratorResult.yield(value);
            }
        }
    }
}