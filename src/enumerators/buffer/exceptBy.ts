import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerable, IEnumerator } from '../../types/core';

/**
 * Enumerator implementation for producing set difference based on key comparison.
 * 
 * @remarks
 * This enumerator yields elements from the source whose keys are not present in the excluded
 * keys sequence. Lazily initializes an exclusion set on first iteration. Each unique key
 * appears at most once in the output.
 * 
 * **Implementation**: Buffers excluded keys in a Set on first call. Also tracks yielded keys.
 * 
 * **Performance**: O(m) space where m is size of excluded keys plus unique source keys.
 * O(1) per element for set lookups after initialization.
 * 
 * @typeParam TSource - The type of elements in the source sequence.
 * @typeParam TKey - The type of the comparison key.
 * 
 * @see {@link ExceptByOperatorEnumerable} for the operator that uses this enumerator.
 */
export class ExceptByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    /** The sequence of keys to exclude. */
    private readonly excludedKeys: Iterable<TKey>;
    /** Set of keys to exclude (includes both excluded keys and already-yielded keys). */
    private excludeSet = new Set<TKey>();
    /** Function to extract comparison key from each element. */
    private readonly keySelector: (item: TSource) => TKey;

    /**
     * Creates a new exceptBy enumerator.
     * 
     * @param sourceEnumerator - The source enumerator.
     * @param excludedKeys - The sequence of keys to exclude from the result.
     * @param keySelector - Function to extract comparison key from each element.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, excludedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.excludedKeys = excludedKeys;
        this.keySelector = keySelector;
    }

    protected override initialize(): void {
        this.excludeSet = new Set<TKey>(this.excludedKeys);
    }

    /**
     * Gets the next element whose key is not in the excluded set.
     * 
     * @returns Iterator result containing the next element with non-excluded key, or done if exhausted.
     */
    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            const key = this.keySelector(value);
            if (!this.excludeSet.has(key)) {
                this.excludeSet.add(key);
                return this.yield(value);
            }
        }
    }
}