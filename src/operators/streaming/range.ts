import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { RangeEnumerator } from "../../enumerators/streaming/range";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

export class RangeOperator extends TyneqOperator<number> {
    private readonly start: number;
    private readonly max: number;

    public constructor(start: number, max: number) {
        super();

        this.start = start;
        this.max = max;
    }

    public getFactory(): IteratorFactory<number> {
        
        return () => {
            return new RangeEnumerator(this.start, this.max);
        }
    }

    public override getEnumerator(): IEnumerator<number> {
        return new RangeEnumerator(this.start, this.max);
    }
}