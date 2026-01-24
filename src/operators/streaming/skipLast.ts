import { EnumeratorResult } from "../../core/enumeratorResult";
import { IEnumerator } from "../../types/core";


export class SkipLastEnumerator<T> implements IEnumerator<T> {
    private readonly sourceEnumerator: IEnumerator<T>;
    private readonly count: number;
    private readonly buffer: T[];
    private writeIndex: number = 0;
    private filledCount: number = 0;

    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        this.sourceEnumerator = sourceEnumerator;
        this.count = count < 0 ? 0 : count;
        this.buffer = new Array<T>(count);
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

            if (this.filledCount < this.count) {
                this.buffer[this.writeIndex] = current.value;
                this.writeIndex = (this.writeIndex + 1) % this.count;
                this.filledCount++;
                continue;
            }

            const oldest = this.buffer[this.writeIndex];
            this.buffer[this.writeIndex] = current.value;
            this.writeIndex = (this.writeIndex + 1) % this.count;
            return EnumeratorResult.yield(oldest);
        }
    }
}