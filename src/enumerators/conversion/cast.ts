import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Casts the elements of a sequence to the specified type.
 * 
 * (WIP)
 * 
 * Note: No runtime type checking is performed.
 */
export class CastEnumerator<T, U> extends TyneqEnumerator<T, U> {
    public constructor(sourceEnumerator: IEnumerator<T>) {
        super(sourceEnumerator);
    }

    protected override handleNext(): IteratorResult<U> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        const castValue = next.value as unknown as U;
        return this.yield(castValue);
    }
}