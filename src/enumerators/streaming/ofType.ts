import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Filters elements to only those matching a type guard.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.ofType}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class OfTypeEnumerator<T, U extends T> extends TyneqEnumerator<T, U> {
    private readonly guard: (value: T) => value is U;

    
    public constructor(sourceEnumerator: Enumerator<T>, guard: (value: T) => value is U) {
        super(sourceEnumerator);
        this.guard = guard;
    }

    protected override handleNext(): IteratorResult<U> {
        while (true) {
            const { value, done } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            if (this.guard(value)) {
                return this.yield(value);
            }
        }
    }
}