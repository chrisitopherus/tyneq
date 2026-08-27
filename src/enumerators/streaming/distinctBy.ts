import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Returns distinct elements by eliminating duplicates based on a key selector.
 *
 * @remarks
 * Deferred. Streams the source incrementally, holding a seen-key `Set` that grows to at most
 * the number of distinct keys yielded so far - it never reads the full source eagerly.
 *
 * @see {@link TyneqSequence.distinctBy}
 * @group Operators
 * @category Streaming
 * @internal
 */
export class DistinctByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly seenValues = new Set<TKey>();
    private readonly keySelector: (item: TSource) => TKey;

    
    public constructor(sourceEnumerator: Enumerator<TSource>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.keySelector = keySelector;
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            const key = this.keySelector(value);

            if (!this.seenValues.has(key)) {
                this.seenValues.add(key);
                return this.yield(value);
            }
        }
    }
}