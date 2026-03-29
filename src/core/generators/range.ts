import { TyneqBaseEnumerator } from "../enumerators/TyneqBaseEnumerator";
import { ArgumentOutOfRangeError } from "../errors/argument/ArgumentOutOfRangeError";
import { nameof } from "../../utility/nameof";

export class RangeEnumerator extends TyneqBaseEnumerator<number> {
    private current: number;
    private end: number;

    
    public constructor(start: number, end: number) {
        super();
        const [startName] = nameof({ start });
        const [endName] = nameof({ end });
        if (start > end) {
            throw new ArgumentOutOfRangeError(startName, `Expected ${startName} to be less than or equal to ${endName}.`);
        }

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
