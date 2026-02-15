import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerable, IEnumerator } from '../../types/core';

/**
 * Enumerator implementation for producing set difference (elements in first but not in second).
 * 
 * @remarks
 * This enumerator yields elements from the source that are not present in the excluded values
 * sequence. Lazily initializes an exclusion set on first iteration. Each source value appears
 * at most once in the output.
 * 
 * **Implementation**: Buffers excluded values in a Set on first call. Also tracks yielded values.
 * 
 * **Performance**: O(m) space where m is size of excluded sequence plus unique source elements.
 * O(1) per element for set lookups after initialization.
 * 
 * @typeParam TSource - The type of elements in the sequences.
 * 
 * @see {@link ExceptOperatorEnumerable} for the operator that uses this enumerator.
 */
export class ExceptEnumerator<TSource> extends TyneqEnumerator<TSource> {
    /** The sequence of values to exclude. */
    private readonly excludedValues: IEnumerable<TSource>;
    /** Set of values to exclude (includes both excluded values and already-yielded values). */
    private excludeSet = new Set<TSource>();
    /** Whether the exclude set has been initialized. */
    private initialized = false;

    /**
     * Creates a new except enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     * @param excludedValues - The sequence of values to exclude from the result.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, excludedValues: IEnumerable<TSource>) {
        super(sourceEnumerator);
        this.excludedValues = excludedValues;
    }

    /**
     * Gets the next unique element that is not in the excluded set.
     * 
     * @returns Iterator result containing the next unique non-excluded element, or done if exhausted.
     */
    protected override handleNext(): IteratorResult<TSource> {
        if (!this.initialized) {
            this.excludeSet = new Set<TSource>(this.excludedValues);
            this.initialized = true;
        }

        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            if (!this.excludeSet.has(value)) {
                this.excludeSet.add(value);
                return this.yield(value);
            }
        }
    }
}