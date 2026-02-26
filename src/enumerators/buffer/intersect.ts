import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerable, IEnumerator } from '../../types/core';

/**
 * Enumerator implementation for producing set intersection (elements in both sequences).
 * 
 * @remarks
 * This enumerator yields elements that appear in both the source and other sequences.
 * Lazily initializes a set from the other sequence on first iteration. Each value appears
 * at most once in the output.
 * 
 * **Implementation**: Buffers other sequence into a Set on first call. Tracks yielded values.
 * 
 * **Performance**: O(m) space where m is size of other sequence. O(1) per element for set
 * lookups after initialization.
 * 
 * @typeParam TSource - The type of elements in the sequences.
 * 
 * @see {@link IntersectOperatorEnumerable} for the operator that uses this enumerator.
 */
export class IntersectEnumerator<TSource> extends TyneqEnumerator<TSource> {
    /** The sequence to intersect with. */
    private readonly otherValues: Iterable<TSource>;
    /** Set of values from the other sequence (for membership testing). */
    private intersectionValues = new Set<TSource>();
    /** Set of values already yielded (for uniqueness). */
    private bufferedValues = new Set<TSource>();

    /**
     * Creates a new intersect enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     * @param otherValues - The sequence to intersect with.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, otherValues: Iterable<TSource>) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
    }

    protected override initialize(): void {
        this.intersectionValues = new Set<TSource>(this.otherValues);
    }

    /**
     * Gets the next unique element that exists in both sequences.
     * On first call, buffers other sequence into a set.
     * 
     * @returns Iterator result containing the next intersecting element, or done if exhausted.
     */
    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            if (this.intersectionValues.has(value) && !this.bufferedValues.has(value)) {
                this.bufferedValues.add(value);
                return this.yield(value);
            }
        }
    }
}