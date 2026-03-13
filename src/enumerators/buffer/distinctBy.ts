import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that filters out elements with duplicate keys from a sequence.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Tracks seen keys in a `Set`. Yields the first element for each key, in first-seen-key order.
 *
 * @typeParam TSource - The type of elements in the sequence.
 * @typeParam TKey - The type of the comparison key.
 *
 * @group Enumerators
 * @internal
 */
@operator('distinctBy')
export class DistinctByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly seenValues = new Set<TKey>();
    private readonly keySelector: (item: TSource) => TKey;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param keySelector - Extracts the comparison key from each element.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, keySelector: (item: TSource) => TKey) {
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
