import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Returns distinct elements by eliminating duplicates based on a key selector.
 *
 * @remarks
 * Deferred. Source is fully buffered on the first iteration of the returned sequence.
 *
 * @see {@link TyneqSequence.distinctBy}
 * @group Operators
 * @category Buffering
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