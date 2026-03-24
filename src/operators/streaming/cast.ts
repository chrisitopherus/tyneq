import { builtinOperator } from "../../extensibility/builtinOperator";
import { TyneqSourceEnumerator } from "../../core/enumerators/TyneqSourceEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator that performs an unchecked type cast on each element of a sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Casts each element from `T` to `U` via a double type assertion. No runtime type checking is
 * performed; the cast is a compile-time-only operation. Use `OfTypeEnumerator` for runtime-safe
 * type filtering.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "cast", kind: "streaming" })
export class CastEnumerator<T, U> extends TyneqSourceEnumerator<T, U> {
    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     */
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