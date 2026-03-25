import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Enumerator that bypasses a specified number of elements from the end of a sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Uses a circular buffer of size `count` to hold a sliding window of the most-recent elements.
 * Once the buffer is full, each incoming element displaces the oldest, which is then yielded.
 * When the source is exhausted the buffered elements are discarded, achieving the skip-last effect.
 *
 * Negative values of `count` are treated as 0 (pass-through).
 * If the source has fewer than `count` elements, the output is empty.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "skipLast", kind: "streaming" })
export class SkipLastEnumerator<T> extends TyneqEnumerator<T> {
    private readonly count: number;
    private readonly buffer: T[];
    private writeIndex: number = 0;
    private filledCount: number = 0;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param count - Number of elements to omit from the end; negative values treated as 0.
     */
    public constructor(sourceEnumerator: Enumerator<T>, count: number) {
        super(sourceEnumerator);
        this.count = count < 0 ? 0 : count;
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