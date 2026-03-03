
/**
 * Abstract base class for sorting strategies in ordered sequences.
 * 
 * @remarks
 * `BaseEnumerableSorter<TSource>` defines the contract for implementing multi-level, stable sorting
 * in Tyneq's ordering system. It uses a two-phase sorting approach:
 * 1. **Key computation** ({@link computeKeys}): Extract and cache sort keys for efficient comparison
 * 2. **Index-based sorting** ({@link compareKeys}): Sort indices based on cached keys, supporting chained comparisons for multi-level sorts
 * 
 * This design enables efficient multi-level sorting (via `thenBy()` and `thenByDescending()`) where
 * each subsequent sort criterion only refines the ordering established by previous criteria.
 * 
 * The sorter returns an index map - an array mapping original element positions to their sorted
 * positions. This allows the actual elements to be reordered without unnecessary copying.
 * 
 * **Stability**: The implementation preserves stable sorting. When two elements have equal keys
 * at all sort levels, their original order is preserved by the concrete sorter implementation.
 * 
 * ## Subclasses and Composition
 * 
 * Typically, a single concrete sorter instance handles one sort criterion.
 * For multi-level sorts, instances are linked via the `next` parameter, forming a chain.
 * The {@link sort} method coordinates this chain by calling `computeKeys()` at each level
 * and delegating comparisons through {@link compareKeys}.
 * 
 * @typeParam TSource - The type of elements being sorted.
 * 
 * @example
 * ```typescript
 * // Direct use is internal; typically accessed via orderBy/thenBy operators
 * // See TyneqEnumerableSorter for concrete implementation
 * 
 * // Abstract methods must be implemented by subclasses
 * // - computeKeys: Extract sort keys from source elements
 * // - compareKeys: Compare elements by their cached keys
 * ```
 */
export abstract class BaseEnumerableSorter<TSource> {
    /**
     * Computes and caches sort keys for all elements in the source array.
     * 
     * @remarks
     * This method is called once during the sort process to prepare all keys needed
     * for comparisons. Implementations extract sort keys from each element and store
     * them for efficient access during sorting.
     * 
     * For chained sorters (multi-level sorts), this method may recursively call
     * {@link computeKeys} on the next sorter via composition.
     * 
     * @param source - A copy of the source elements. Implementations may read from
     *                 this array but should not modify it.
     * @param count - The number of elements to process. Typically equals `source.length`.
     * 
     * @example
     * ```typescript
     * // Implementation in TyneqEnumerableSorter:
     * // Extract a single key for each element
     * protected computeKeys(source: TSource[], count: number): void {
     *     this.keys = new Array<TKey>(count);
     *     for (let i = 0; i < count; i++) {
     *         this.keys[i] = this.keySelector(source[i]);
     *     }
     *     // Chain to next sorter if present
     *     this.next?.computeKeys(source, count);
     * }
     * ```
     */
    public abstract computeKeys(source: TSource[], count: number): void;

    /**
     * Compares two elements by their cached sort keys.
     * 
     * @remarks
     * This method is called during the sort process to determine the relative order
     * of two elements. It receives the original indices of the elements and should
     * compare them using previously computed keys.
     * 
     * For chained sorters (multi-level sorts), this method should:
     * - Compare using the current criterion
     * - If elements are equal (result === 0), delegate to the next sorter via composition
     * - If the next sorter is null, apply stability comparison (preserve original order)
     * 
     * @param i - The original index of the first element.
     * @param j - The original index of the second element.
     * @returns A negative number if element `i` should come before `j`,
     *          zero if they are equal, or positive if `i` should come after `j`.
     * 
    * The return value follows JavaScript's sort comparator convention, where:
     * - Negative indicates `i < j`
     * - Zero indicates `i == j`
     * - Positive indicates `i > j`
     * 
     * @example
     * ```typescript
     * // Implementation in TyneqEnumerableSorter:
     * protected compareKeys(i: number, j: number): number {
     *     let result = this.comparer(this.keys[i], this.keys[j]) * this.descending;
     *     if (result !== 0) return result; // Current criterion decided order
     *     
     *     if (this.next === null) {
     *         return this.stabilityCompare(i, j); // No more criteria, preserve order
     *     }
     *     
     *     return this.next.compareKeys(i, j); // Delegate to next criterion
     * }
     * ```
     */
    public abstract compareKeys(i: number, j: number): number;

    /**
     * Sorts the source elements and returns an index map.
     * 
     * @remarks
     * This is the main orchestration method that:
     * 1. Calls {@link computeKeys} to prepare sort keys across all sorters in the chain
     * 2. Creates an index array (0, 1, 2, ..., count-1)
     * 3. Sorts the index array using {@link compareKeys} for comparisons
     * 4. Returns the sorted index array
     * 
     * The returned index map allows callers to reorder elements without copying them.
     * For example, `sorted[i] = source[indexMap[i]]` reconstructs the sorted sequence.
     * 
     * **Time complexity**: O(count log count) for the sort operation
     * **Space complexity**: O(count) for the index map plus space used by key caching
     * 
     * @param source - The source elements to sort. This array is not modified.
     * @param count - The number of elements to sort. Typically equals `source.length`.
     * @returns An array of indices where `result[i]` is the original index of the
     *          element that should appear at position `i` in the sorted sequence.
     * 
     * @example
     * ```typescript
     * const animals = ['zebra', 'apple', 'mango'];
     * const sorter = new TyneqEnumerableSorter(
     *     (item) => item,  // key selector
     *     (a, b) => a.localeCompare(b), // comparer
     *     false  // ascending
     * );
     * 
     * const indexMap = sorter.sort(animals, 3);
     * // indexMap might be [1, 2, 0] (indices of 'apple', 'mango', 'zebra')
     * 
     * // To reorder: animals.map((_, i) => animals[indexMap[i]])
     * // Result: ['apple', 'mango', 'zebra']
     * ```
     * 
    * @see {@link BaseEnumerableSorter} for the sorter contract used by ordered sequences.
     */
    public sort(source: TSource[], count: number): number[] {
        this.computeKeys([...source], count);
        const indexMap: number[] = Array.from({ length: count }, (_, i) => i);

        indexMap.sort((a, b) => this.compareKeys(a, b));
        return indexMap;
    }
}