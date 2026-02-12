import { TyneqGeneratorEnumerator } from "../../core/enumerators/TyneqGeneratorEnumerator";
import { ArgumentOutOfRangeError } from "../../core/errors/argument/ArgumentOutOfRangeError";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";


export class RangeEnumerator extends TyneqGeneratorEnumerator<number> {
    private current: number;
    private end: number;

    public constructor(start: number, end: number) {
        super();
        if (start > end) {
            throw new ArgumentOutOfRangeError(nameof({ start }), `Expected ${nameof({ start })} to be less than or equal to ${nameof({ end })}.`);
        }
        
        this.current = start;
        this.end = end;
    }

    protected override handleNext(): IteratorResult<number> {
        if (this.current > this.end) {
            return this.complete();
        }

        return this.yield(this.current++);
    }
}