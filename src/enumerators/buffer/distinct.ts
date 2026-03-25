import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Enumerator that filters out duplicate values from a sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Tracks seen values in a `Set`. Yields each value at most once, in first-seen order.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "distinct", kind: "buffer" })
export class DistinctEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly seenValues = new Set<TSource>();

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     */
    public constructor(sourceEnumerator: Enumerator<TSource>) {
        super(sourceEnumerator);
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            if (!this.seenValues.has(value)) {
                this.seenValues.add(value);
                return this.yield(value);
            }
        }
    }
}