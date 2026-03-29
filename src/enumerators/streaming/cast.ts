import { builtinOperator } from "../../plugin/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Casts each element to the target type.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.cast}
 * @group Operators
 * @category Streaming
 * @internal
 */
@builtinOperator({ name: "cast", kind: "streaming" })
export class CastEnumerator<T, U> extends TyneqEnumerator<T, U> {
    
    public constructor(sourceEnumerator: Enumerator<T>) {
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