import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that bypasses a specified number of elements from the beginning of a sequence.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Skips the first `count` elements lazily on the first call to `handleNext`, then passes
 * through all subsequent elements without buffering.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @group Enumerators
 * @internal
 */
@operator<[count: unknown]>('skip', (count) => {
    ArgumentUtility.checkNonNegative({ count: count as number });
})
export class SkipEnumerator<T> extends TyneqEnumerator<T> {
    private readonly count: number;
    private skipped = false;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param count - Number of elements to skip from the beginning; must be non-negative.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        super(sourceEnumerator);
        this.count = count;
    }

    protected override handleNext(): IteratorResult<T> {
        if (!this.skipped) {
            let skippedCount = 0;
            while (skippedCount < this.count) {
                const sourceNext = this.sourceEnumerator.next();
                if (sourceNext.done) {
                    return this.done();
                }

                skippedCount++;
            }

            this.skipped = true;
        }

        const sourceNext = this.sourceEnumerator.next();
        if (sourceNext.done) {
            return this.done();
        }

        return this.yield(sourceNext.value);
    }
}
