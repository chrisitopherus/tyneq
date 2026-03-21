
/**
 * Abstract base class for sorting strategies in ordered sequences.
 *
 * @remarks
 * Defines a two-phase sort contract: {@link computeKeys} extracts and caches sort keys for
 * all elements; {@link compareKeys} uses those cached keys to compare any two elements by
 * index. {@link sort} orchestrates both phases and returns an index map so elements can be
 * reordered without copying.
 *
 * For multi-level sorts, sorter instances are linked into a chain via the `next` parameter.
 * When {@link compareKeys} finds two elements equal at the current criterion, it delegates
 * to the next sorter. The last sorter in the chain applies a stability comparison.
 *
 * @typeParam TSource - The type of elements being sorted.
 *
 * @group Classes
 * @internal
 */
export abstract class BaseEnumerableSorter<TSource> {
    /**
     * Computes and caches sort keys for all elements in the source array.
     *
     * @param source - A copy of the source elements. Must not be modified.
     * @param count - The number of elements to process.
     */
    public abstract computeKeys(source: TSource[], count: number): void;

    /**
     * Compares two elements by their cached sort keys.
     *
     * @param i - The original index of the first element.
     * @param j - The original index of the second element.
     * @returns Negative if `i` should precede `j`, positive if `j` should precede `i`, zero if equal.
     */
    public abstract compareKeys(i: number, j: number): number;

    /**
     * Sorts the source elements and returns an index map.
     *
     * @remarks
     * Calls {@link computeKeys} to prepare all sort keys, then sorts an identity index array
     * using {@link compareKeys}. The returned array maps output positions to original indices:
     * `result[i]` is the original index of the element at sorted position `i`.
     *
     * @param source - The source elements to sort. Not modified.
     * @param count - The number of elements to sort.
     * @returns An index map for reordering elements into sorted order.
     */
    public sort(source: TSource[], count: number): number[] {
        this.computeKeys([...source], count);
        const indexMap: number[] = Array.from({ length: count }, (_, i) => i);

        indexMap.sort((a, b) => this.compareKeys(a, b));
        return indexMap;
    }
}
