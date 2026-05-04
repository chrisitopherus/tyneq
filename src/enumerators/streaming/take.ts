import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Returns a specified number of elements from the beginning of the source sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.take}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class TakeEnumerator<T> extends TyneqEnumerator<T> {
    private readonly count: number;
    private takenCount = 0;

    
    public constructor(sourceEnumerator: Enumerator<T>, count: number) {
        super(sourceEnumerator);
        this.count = count;
    }

    protected override handleNext(): IteratorResult<T> {
        if (this.takenCount >= this.count) {
            return this.earlyComplete();
        }

        const result = this.sourceEnumerator.next();
        if (result.done) {
            return this.done();
        }

        this.takenCount++;
        return this.yield(result.value);
    }
}