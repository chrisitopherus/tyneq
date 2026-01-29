import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { EnumeratorResult, IEnumerator } from "../../types/core";

export class SkipEnumerator<T> extends TyneqEnumerator<T> {
    private readonly count: number;
    private skipped = false;

    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        super(sourceEnumerator);
        
        // instead prob better to throw/validate here
        this.count = count < 0 ? 0 : count;
    }

    protected override handleNext(): EnumeratorResult<T> {
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