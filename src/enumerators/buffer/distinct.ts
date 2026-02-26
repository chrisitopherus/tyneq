import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";

/**
 * Enumerator implementation for filtering out duplicate values from a sequence.
 * 
 * @remarks
 * This enumerator maintains a Set to track values that have already been yielded,
 * ensuring each unique value appears only once. Uses value equality for comparison.
 * 
 * **Implementation**: Buffers seen values in a Set. Yields elements in first-seen order.
 * 
 * **Performance**: O(n) space for the seen values set. O(1) per element for set lookups.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link DistinctOperatorEnumerable} for the operator that uses this enumerator.
 */
export class DistinctEnumerator<TSource> extends TyneqEnumerator<TSource> {
    /** Set tracking values that have already been yielded. */
    private readonly seenValues = new Set<TSource>();

    /**
     * Creates a new distinct enumerator.
     * 
     * @param sourceEnumerator - The source enumerator to filter.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>) {
        super(sourceEnumerator);
    }

    /**
     * Gets the next unique element from the source sequence.
     * 
     * @returns Iterator result containing the next unique element, or done if exhausted.
     */
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