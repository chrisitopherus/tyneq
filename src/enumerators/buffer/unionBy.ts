import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from '../../types/core';

/**
 * Enumerator implementation for producing set union based on key comparison.
 * 
 * @remarks
 * This enumerator yields elements from both sequences whose keys are unique.
 * Enumerates source first, then other sequence. Each unique key appears at most once
 * in the output.
 * 
 * **Implementation**: Tracks yielded keys in a Set. Switches to other sequence when source
 * is exhausted.
 * 
 * **Performance**: O(n + m) space where n and m are sizes of both sequences (for tracking
 * yielded keys). O(1) per element for set lookups.
 * 
 * @typeParam TSource - The type of elements in the sequences.
 * @typeParam TKey - The type of the comparison key.
 * 
 * @see {@link UnionByOperatorEnumerable} for the operator that uses this enumerator.
 *
 * @group Enumerators
 * @internal
 */
export class UnionByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    /** The second sequence to union with. */
    private readonly otherValues: Iterable<TSource>;
    /** Set of keys already yielded (for uniqueness). */
    private readonly bufferedKeys = new Set<TKey>();
    /** Function to extract comparison key from each element. */
    private readonly keySelector: (item: TSource) => TKey;
    /** Current enumerator (starts with source, switches to other). */
    private currentEnumerator: IEnumerator<TSource>;
    /** Whether source sequence has been exhausted. */
    private isSourceDone = false;
    
    /**
     * Creates a new unionBy enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     * @param otherValues - The second sequence to union with.
     * @param keySelector - Function to extract comparison key from each element.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, otherValues: Iterable<TSource>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
        this.currentEnumerator = this.sourceEnumerator;
        this.keySelector = keySelector;
    }

    /**
     * Gets the next element with unique key from either source or other sequence.
     * Automatically switches to other sequence when source is exhausted.
     * 
     * @returns Iterator result containing the next element with unique key, or done if both exhausted.
     */
    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.currentEnumerator.next();
            if (done) {
                if (this.isSourceDone) {
                    return this.done();
                }

                this.isSourceDone = true;
                this.currentEnumerator = this.otherValues[Symbol.iterator]();
                continue;
            }

            const key = this.keySelector(value);
            if (!this.bufferedKeys.has(key)) {
                this.bufferedKeys.add(key);
                return this.yield(value);
            }
        }
    }
}