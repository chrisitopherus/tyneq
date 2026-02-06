import { TyneqEnumerator } from "../../core/TyneqEnumerator";
import { IEnumerator } from "../../types/core";


export class RangeEnumerator extends TyneqEnumerator<number> {
    private current: number;

    public constructor(sourceEnumerator: IEnumerator<number>, start: number) {
        super(sourceEnumerator);
        this.current = start;
    }

    protected override handleNext(): IteratorResult<number> {
        const { done } = this.sourceEnumerator.next();
        if (done) {
            return this.complete();
        }

        return this.yield(this.current++);
    }
}