/**
 * Abstract base for multi-key stable sorters used by the ordering infrastructure.
 *
 * @remarks
 * `computeKeys()` pre-computes sort keys for each element; `compareKeys()` compares by index.
 * Sorters chain together via the `next` field on {@link TyneqEnumerableSorter} to implement
 * multi-key (thenBy) sorting.
 *
 * @internal
 */
export abstract class BaseEnumerableSorter<TSource> {
    /** Pre-computes the sort key for each element in `source[0..count-1]`. */
    public abstract computeKeys(source: TSource[], count: number): void;

    /** Compares the sort keys at indices `i` and `j`. Returns negative, zero, or positive. */
    public abstract compareKeys(i: number, j: number): number;

    /**
     * Returns a stable sorted index map for `source[0..count-1]`.
     *
     * @remarks
     * `source` is only read, never mutated, by any `computeKeys()` implementation in this
     * codebase - no defensive copy is made here.
     *
     * @returns An array of indices sorted by the key order defined by this sorter chain.
     */
    public sort(source: TSource[], count: number): number[] {
        this.computeKeys(source, count);
        const indexMap: number[] = Array.from({ length: count }, (_, i) => i);

        indexMap.sort((a, b) => this.compareKeys(a, b));
        return indexMap;
    }
}
