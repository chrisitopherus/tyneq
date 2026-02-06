import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

export class TakeEnumerator<T> extends TyneqEnumerator<T> {
    private readonly count: number;

    private takenCount = 0;

    public constructor(sourceEnumerator: IEnumerator<T>, count: number) {
        super(sourceEnumerator);
        this.count = count < 0 ? 0 : count;
    }

    protected override handleNext(): IteratorResult<T> {
        if (this.takenCount >= this.count) {
            return this.complete();
        }

        const result = this.sourceEnumerator.next();
        if (result.done) {
            return this.complete();
        }

        this.takenCount++;
        return this.yield(result.value);
    }
}