import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerable, IEnumerator } from '../../types/core';

/**
 * Enumerator implementation for producing set union (unique elements from both sequences).
 * 
 * @remarks
 * This enumerator yields unique elements from both the source and other sequences.
 * Enumerates source first, then other sequence. Each value appears at most once in the output.
 * 
 * **Implementation**: Tracks yielded values in a Set. Switches to other sequence when source
 * is exhausted.
 * 
 * **Performance**: O(n + m) space where n and m are sizes of both sequences (for tracking
 * yielded values). O(1) per element for set lookups.
 * 
 * @typeParam TSource - The type of elements in the sequences.
 * 
 * @see {@link UnionOperatorEnumerable} for the operator that uses this enumerator.
 */
export class UnionEnumerator<TSource> extends TyneqEnumerator<TSource> {
    /** The second sequence to union with. */
    private readonly otherValues: Iterable<TSource>;
    /** Set of values already yielded (for uniqueness). */
    private bufferedValues = new Set<TSource>();
    /** Current enumerator (starts with source, switches to other). */
    private currentEnumerator: IEnumerator<TSource>;
    /** Whether source sequence has been exhausted. */
    private isSourceDone = false;
    
    /**
     * Creates a new union enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     * @param otherValues - The second sequence to union with.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, otherValues: Iterable<TSource>) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
        this.currentEnumerator = this.sourceEnumerator;
    }

    /**
     * Gets the next unique element from either source or other sequence.
     * Automatically switches to other sequence when source is exhausted.
     * 
     * @returns Iterator result containing the next unique element, or done if both exhausted.
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

            if (!this.bufferedValues.has(value)) {
                this.bufferedValues.add(value);
                return this.yield(value);
            }
        }
    }
}