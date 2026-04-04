import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Returns distinct elements by eliminating duplicates.
 *
 * @remarks
 * Deferred. Source is fully buffered on the first iteration of the returned sequence.
 *
 * @see {@link TyneqSequence.distinct}
 * @group Operators
 * @category Buffering
 * @internal
 */
export class DistinctEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly seenValues = new Set<TSource>();

    
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