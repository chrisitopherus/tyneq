import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { operator } from "../../extensibility/operatorDecorators";

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
@operator("distinct", "buffer")
export class DistinctEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly seenValues = new Set<TSource>();

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>) {
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
