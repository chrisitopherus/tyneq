import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that filters elements using a type guard, yielding only elements of the target type.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Tests each source element against the provided type guard predicate and yields only elements
 * for which it returns `true`. Unlike `CastEnumerator`, the type narrowing is validated at runtime.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "ofType", kind: "streaming" })
export class OfTypeEnumerator<T, U extends T> extends TyneqEnumerator<T, U> {
    private readonly guard: (value: T) => value is U;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param guard - The type guard that determines whether an element is of type `U`.
     */
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