import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class SkipEnumerator<T> extends TyneqEnumerator<T> {
    private readonly count: number;
    private skipped = false;

    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        super(sourceEnumerator);
        ArgumentUtility.checkNonNegative(count, nameof({ count }));

        this.count = count;
    }

    protected override handleNext(): IteratorResult<T> {
        if (!this.skipped) {
            let skippedCount = 0;
            while (skippedCount < this.count) {
                const sourceNext = this.sourceEnumerator.next();
                if (sourceNext.done) {
                    return this.complete();
                }

                skippedCount++;
            }

            this.skipped = true;
        }

        const sourceNext = this.sourceEnumerator.next();
        if (sourceNext.done) {
            return this.complete();
        }

        return this.yield(sourceNext.value);
    }
}