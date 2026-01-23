import { EnumeratorResult } from "../../core/enumeratorResult";
import { IEnumerator } from "../../types/core";

export class SkipEnumerator<T> implements IEnumerator<T> {
    private readonly sourceEnumerator: IEnumerator<T>;
    private readonly count: number;
    private skipped = false;

    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        this.sourceEnumerator = sourceEnumerator;
        this.count = count < 0 ? 0 : count;
    }

    public next(): IteratorResult<T> {
        if (!this.skipped) {
            let skippedCount = 0;
            while (skippedCount < this.count) {
                const sourceNext = this.sourceEnumerator.next();
                if (sourceNext.done) {
                    return EnumeratorResult.done<T>();
                }

                skippedCount++;
            }

            this.skipped = true;
        }

        const sourceNext = this.sourceEnumerator.next();
        if (sourceNext.done) {
            return EnumeratorResult.done<T>();
        }

        return EnumeratorResult.yield(sourceNext.value);
    }
}