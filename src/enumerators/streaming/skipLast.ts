import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { EnumeratorResult, IEnumerator } from "../../types/core";

export class SkipLastEnumerator<T> extends TyneqEnumerator<T> {
    private readonly count: number;
    private readonly buffer: T[];
    private writeIndex: number = 0;
    private filledCount: number = 0;

    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        super(sourceEnumerator);
        this.count = count < 0 ? 0 : count;
        this.buffer = new Array<T>(this.count);
    }

    protected override handleNext(): EnumeratorResult<T> {
        if (this.count === 0) {
            const current = this.sourceEnumerator.next();
            if (current.done) {
                return this.complete();
            } else {
                return this.yield(current.value);
            }
        }

        while (true) {
            const current = this.sourceEnumerator.next();
            if (current.done) {
                return this.complete();
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
            return this.yield(oldest);
        }
    }
}