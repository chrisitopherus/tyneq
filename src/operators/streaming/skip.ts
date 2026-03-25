import { builtinOperator } from "../../extensibility/builtinOperator";
import { TyneqSourceEnumerator } from "../../core/enumerators/TyneqSourceEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that bypasses a specified number of elements from the beginning of a sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Skips the first `count` elements lazily on the first call to `handleNext`, then passes
 * through all subsequent elements without buffering.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "skip", kind: "streaming" })
export class SkipEnumerator<T> extends TyneqSourceEnumerator<T> {
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