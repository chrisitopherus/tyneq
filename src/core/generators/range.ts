import { TyneqBaseEnumerator } from "../enumerators/TyneqBaseEnumerator";

export class RangeEnumerator extends TyneqBaseEnumerator<number> {
    private current: number;
    private end: number;

    public constructor(start: number, end: number) {
        super();
        this.current = start;
        this.end = end;
    }

    protected override handleNext(): IteratorResult<number> {
        if (this.current > this.end) {
            return this.done();
        }

        return this.yield(this.current++);
    }
}
