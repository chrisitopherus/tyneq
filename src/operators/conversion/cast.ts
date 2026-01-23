import { EnumeratorResult } from "../../core/enumeratorResult";
import { IEnumerator } from "../../types/core";

/**
 * Casts the elements of a sequence to the specified type.
 * 
 * (WIP)
 * 
 * Note: No runtime type checking is performed.
 */
export class CastEnumerator<T, U> implements IEnumerator<U> {
    private readonly sourceEnumerator: IEnumerator<T>;

    public constructor(sourceEnumerator: IEnumerator<T>) {
        this.sourceEnumerator = sourceEnumerator;
    }

    public next(): IteratorResult<U> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return EnumeratorResult.done();
        }

        const value = next.value as unknown as U;
        return EnumeratorResult.yield(value);
    }
}