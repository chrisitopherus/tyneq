import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator that filters elements using a type guard, yielding only elements of the target type.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Tests each source element against the provided type guard predicate and yields only elements
 * for which it returns `true`. Unlike `CastEnumerator`, the type narrowing is validated at runtime.
 *
 * @typeParam T - The source element type.
 * @typeParam U - The target subtype to filter for (must extend `T`).
 *
 * @group Enumerators
 * @internal
 */
export class OfTypeEnumerator<T, U extends T> extends TyneqEnumerator<T, U> {
    private readonly guard: (value: T) => value is U;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param guard - The type guard that determines whether an element is of type `U`.
     */
    public constructor(sourceEnumerator: IEnumerator<T>, guard: (value: T) => value is U) {
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
