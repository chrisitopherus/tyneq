import { TyneqSourceEnumerator } from "../../core/enumerators/TyneqSourceEnumerator";
import { IEnumerator } from "../../types/core";
import { operator } from "../../extensibility/operator";

/**
 * Enumerator that yields a specified number of elements from the beginning of a sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Signals early completion once `count` elements have been yielded, stopping source enumeration
 * immediately rather than consuming the remainder of the sequence.
 * Negative values of `count` are treated as 0, resulting in an empty sequence.
 *
 * @group Enumerators
 * @internal
 */
@operator("take")
export class TakeEnumerator<T> extends TyneqSourceEnumerator<T> {
    private readonly count: number;
    private takenCount = 0;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param count - Maximum number of elements to yield; negative values treated as 0.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        super(sourceEnumerator);
        this.count = count < 0 ? 0 : count;
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
