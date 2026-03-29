import { builtinOperator } from "../../plugin/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Replaces every element in the source with a fixed value.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link TyneqSequence.populate}
 * @group Operators
 * @category Streaming
 * @internal
 */
@builtinOperator({ name: "populate", kind: "streaming" })
export class PopulateEnumerator<TSource, TValue> extends TyneqEnumerator<TSource, TValue> {
    private readonly value: TValue;

    
    public constructor(sourceEnumerator: Enumerator<TSource>, value: TValue) {
        super(sourceEnumerator);
        this.value = value;
    }

    protected override handleNext(): IteratorResult<TValue> {
        while (true) {
            const { done } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            return this.yield(this.value);
        }
    }
}