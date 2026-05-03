import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Yields elements between a start index (inclusive) and an end index (exclusive).
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.slice}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class SliceEnumerator<T> extends TyneqEnumerator<T> {
    private readonly start: number;
    private readonly end: number;
    private index = 0;
    private started = false;

    public constructor(sourceEnumerator: Enumerator<T>, start: number, end: number) {
        super(sourceEnumerator);
        this.start = start;
        this.end = end;
    }

    protected override handleNext(): IteratorResult<T> {
        if (!this.started) {
            this.started = true;
            while (this.index < this.start) {
                if (this.sourceEnumerator.next().done) {
                    return this.done();
                }

                this.index++;
            }
        }

        if (this.index >= this.end) {
            return this.earlyComplete();
        }

        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        this.index++;
        return this.yield(next.value);
    }
}
