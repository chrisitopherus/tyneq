import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Skips a specified number of elements from the end of the source sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.skipLast}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class SkipLastEnumerator<T> extends TyneqEnumerator<T> {
    private readonly count: number;
    private readonly buffer: T[];
    private writeIndex: number = 0;
    private filledCount: number = 0;

    
    public constructor(sourceEnumerator: Enumerator<T>, count: number) {
        super(sourceEnumerator);
        this.count = count;
        this.buffer = new Array<T>(this.count);
    }

    protected override handleNext(): IteratorResult<T> {
        if (this.count === 0) {
            const current = this.sourceEnumerator.next();
            if (current.done) {
                return this.done();
            } else {
                return this.yield(current.value);
            }
        }

        while (true) {
            const current = this.sourceEnumerator.next();
            if (current.done) {
                return this.done();
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