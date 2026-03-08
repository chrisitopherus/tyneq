import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator implementation for filtering out elements with duplicate keys from a sequence.
 * 
 * @remarks
 * This enumerator maintains a Set to track keys that have already been yielded,
 * ensuring each unique key appears only once. The first element with each key is yielded.
 * 
 * **Implementation**: Buffers seen keys in a Set. Yields elements in first-seen-key order.
 * 
 * **Performance**: O(n) space for the seen keys set. O(1) per element for set lookups.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * @typeParam TKey - The type of the comparison key.
 * 
 *
 * @group Enumerators
 * @internal
 */
@operator('distinctBy')
export class DistinctByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    /** Set tracking keys that have already been yielded. */
    private readonly seenValues = new Set<TKey>();
    /** Function to extract comparison key from each element. */
    private readonly keySelector: (item: TSource) => TKey;

    /**
     * Creates a new distinctBy enumerator.
     * 
     * @param sourceEnumerator - The source enumerator to filter.
     * @param keySelector - Function to extract comparison key from each element.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.keySelector = keySelector;
    }

    /**
     * Gets the next element with a unique key from the source sequence.
     * 
     * @returns Iterator result containing the next element with unique key, or done if exhausted.
     */
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