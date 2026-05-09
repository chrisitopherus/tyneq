import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Yields overlapping or tumbling windows (fixed-size sub-arrays) over the source sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 * Windows with fewer elements than `size` are not yielded.
 * Each yielded array is a snapshot - mutating it does not affect subsequent windows.
 *
 * @see {@link TyneqSequence.window}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class WindowEnumerator<T> extends TyneqEnumerator<T, T[]> {
    private readonly size: number;
    private readonly step: number;
    private buffer: T[] = [];
    private started = false;

    public constructor(sourceEnumerator: Enumerator<T>, size: number, step: number) {
        super(sourceEnumerator);
        this.size = size;
        this.step = step;
    }

    protected override handleNext(): IteratorResult<T[]> {
        // Fill the initial buffer on first call
        if (!this.started) {
            this.started = true;
            while (this.buffer.length < this.size) {
                const next = this.sourceEnumerator.next();
                if (next.done) {
                    return this.done();
                }

                this.buffer.push(next.value);
            }

            return this.yield(this.buffer.slice());
        }

        // Advance by step:
        // - When step <= size: keep the tail of the buffer and fill the rest from source.
        // - When step > size: the buffer is fully replaced; skip (step - size) source elements first.
        if (this.step <= this.size) {
            this.buffer = this.buffer.slice(this.step);
        } else {
            this.buffer = [];
            const toSkip = this.step - this.size;
            for (let i = 0; i < toSkip; i++) {
                if (this.sourceEnumerator.next().done) {
                    return this.done();
                }
            }
        }

        while (this.buffer.length < this.size) {
            const next = this.sourceEnumerator.next();
            if (next.done) {
                return this.done();
            }

            this.buffer.push(next.value);
        }

        return this.yield(this.buffer.slice());
    }
}
