import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Returns distinct elements by eliminating duplicates.
 *
 * @remarks
 * Deferred. Streams the source incrementally, holding a seen-value `Set` that grows to at most
 * the number of distinct elements yielded so far - it never reads the full source eagerly.
 *
 * @see {@link TyneqSequence.distinct}
 * @group Operators
 * @category Streaming
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