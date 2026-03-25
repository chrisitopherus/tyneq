import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Enumerator that replaces every source element with a constant value.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Preserves the cardinality of the source sequence; yields `value` once per source element.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "populate", kind: "streaming" })
export class PopulateEnumerator<TSource, TValue> extends TyneqEnumerator<TSource, TValue> {
    private readonly value: TValue;

    /**
     * @param sourceEnumerator - The upstream enumerator (drives cardinality only).
     * @param value - The value to yield for each source element.
     */
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