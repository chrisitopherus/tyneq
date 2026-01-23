import { EnumeratorResult } from "../../core/enumeratorResult";
import { IEnumerator } from "../../types/core";

/**
 * Casts the elements of a sequence to the specified type.
 * 
 * Note: This operator performs an unchecked type assertion (like LINQ's Cast in C#).
 * It is the caller's responsibility to ensure the source elements are compatible
 * with the target type. No runtime type checking is performed.
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
