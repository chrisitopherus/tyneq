import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from '../../types/core';
import { operator } from '../../extensibility/operatorDecorators';
import { ArgumentUtility } from '../../utility/argumentUtility';

/**
 * Enumerator implementation for producing set intersection based on key comparison.
 * 
 * @remarks
 * This enumerator yields elements whose keys appear in both the source and other key sequences.
 * Lazily initializes a set from the other keys on first iteration. Each unique key appears
 * at most once in the output.
 * 
 * **Implementation**: Buffers other keys into a Set on first call. Tracks yielded keys.
 * 
 * **Performance**: O(m) space where m is size of other keys. O(1) per element for set
 * lookups after initialization.
 * 
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TKey - The type of the comparison key.
 * 
 *
 * @group Enumerators
 * @internal
 */
@operator('intersectBy', (otherValues: any, keySelector: any) => {
    ArgumentUtility.checkNotOptional({ otherValues });
    ArgumentUtility.checkNotOptional({ keySelector });
})
export class IntersectByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    /** The sequence of keys to intersect with. */
    private readonly otherValues: Iterable<TKey>;
    /** Function to extract comparison key from each element. */
    private readonly keySelector: (item: TSource) => TKey;
    /** Set of keys from the other sequence (for membership testing). */
    private intersectionKeys = new Set<TKey>();
    /** Set of keys already yielded (for uniqueness). */
    private bufferedKeys = new Set<TKey>();

    /**
     * Creates a new intersectBy enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     * @param otherValues - The sequence of keys to intersect with.
     * @param keySelector - Function to extract comparison key from each element.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, otherValues: Iterable<TKey>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
        this.keySelector = keySelector;
    }

    protected override initialize(): void {
        this.intersectionKeys = new Set<TKey>(this.otherValues);
    }

    /**
     * Gets the next element whose key exists in the other key sequence.
     * On first call, buffers other keys into a set.
     * 
     * @returns Iterator result containing the next intersecting element, or done if exhausted.
     */
    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            const key = this.keySelector(value);

            if (this.intersectionKeys.has(key) && !this.bufferedKeys.has(key)) {
                this.bufferedKeys.add(key);
                return this.yield(value);
            }
        }
    }
}