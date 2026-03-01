import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";
import { BaseEnumerableSorter } from "./BaseEnumerableSorter";

/**
 * Concrete sorter implementation for a single sort criterion.
 * 
 * @remarks
 * `TyneqEnumerableSorter<TSource, TKey>` is the standard implementation of {@link BaseEnumerableSorter}
 * that applies a single sort criterion to a sequence. It extracts keys using a key selector function,
 * caches them for efficient comparison, and compares elements using a comparator function.
 * 
 * This sorter supports both ascending and descending ordering via the `descending` parameter.
 * For multi-level sorting (created by chaining `thenBy().thenBy()`...), multiple instances
 * are linked together, each handling one sort criterion.
 * 
 * ## Key Extraction and Caching
 * 
 * The {@link computeKeys} method extracts keys once for all elements, storing them in the
 * `keys` array. This two-phase approach (extract → cache → compare) is efficient when
 * key extraction is expensive (e.g., complex computations) and keys are compared multiple times
 * during sorting.
 * 
 * ## Comparison Chain
 * 
 * When `thenBy()` or `thenByDescending()` is called, a new sorter is created with the previous
 * sorter passed as the `next` parameter. During comparison ({@link compareKeys}):
 * 1. Compare elements using the current criterion
 * 2. If equal (result === 0), delegate to the next sorter
 * 3. If no next sorter exists, use {@link stabilityCompare} to preserve original order
 * 
 * This composition enables arbitrarily complex multi-level sorts while maintaining code clarity.
 * 
 * ## Stability
 * 
 * A sort is **stable** if it preserves the original order of equal elements. This implementation
 * achieves stability through {@link stabilityCompare}, which returns `i - j` when all sort
 * criteria are exhausted. This ensures elements with identical keys maintain their original positions.
 * 
 * @typeParam TSource - The type of elements being sorted.
 * @typeParam TKey - The type of the sort key extracted by {@link keySelector}.
 * 
 * @example
 * ```typescript
 * // Used internally by orderBy/thenBy operators
 * // Example: Sort numbers ascending
 * const sorter = new TyneqEnumerableSorter(
 *     (n) => n,                          // key selector
 *     (a, b) => a - b,                   // ascending comparator
 *     false,                              // not descending
 *     undefined                           // no next sorter
 * );
 * 
 * // To sort with thenBy: pass previous sorter as next
 * const thenSorter = new TyneqEnumerableSorter(
 *     (obj) => obj.name,                 // secondary key
 *     (a, b) => a.localeCompare(b),      // string comparator
 *     false,
 *     sorter                             // chain to first sorter
 * );
 * ```
 * 
 * @see {@link BaseEnumerableSorter} for the abstract contract.
 * @see {@link TyneqOrderedEnumerable} which creates instances of this sorter.
 */
export class TyneqEnumerableSorter<TSource, TKey> extends BaseEnumerableSorter<TSource> {
    /**
     * Cached sort keys for all elements, populated by {@link computeKeys}.
     * 
     * @remarks
     * This array is allocated once during sorting and stores the extracted key
     * for each element. Used by {@link compareKeys} for efficient comparisons.
     */
    private keys: TKey[] = [];

    /**
     * Function to extract the sort key from a source element.
     * 
     * @remarks
     * Called once per element during {@link computeKeys} to produce the key value.
     * The key is then used for comparisons via the {@link comparer} function.
     */
    private readonly keySelector: (item: TSource) => TKey;

    /**
     * Function to compare two sort keys.
     * 
     * @remarks
     * Should return:
     * - Negative if `a < b`
     * - Zero if `a == b`
     * - Positive if `a > b`
     * 
     * This follows the standard JavaScript comparator convention.
     * The result is multiplied by {@link descending} to handle descending sorts.
     */
    private readonly comparer: (a: TKey, b: TKey) => number;

    /**
     * Direction multiplier: 1 for ascending, -1 for descending.
     * 
     * @remarks
     * The comparator result is multiplied by this value to invert comparisons
     * when sorting in descending order.
     */
    private readonly descending: number;

    /**
     * The next sorter in the chain for multi-level sorts, or null if this is the last.
     * 
     * @remarks
     * When comparing elements with equal keys at the current level,
     * {{@link compareKeys} delegates to this sorter. This enables chained
     * `thenBy()` operations.
     */
    private next: Nullable<BaseEnumerableSorter<TSource>> = null;

    /**
     * Creates a new TyneqEnumerableSorter.
     * 
     * @param keySelector - Function to extract the sort key from each element.
     *                      Must not be null or undefined.
     * @param comparer - Function to compare two keys. Must return a comparator value
     *                   following JavaScript conventions. Must not be null or undefined.
     * @param descending - Whether to sort in descending order (true) or ascending (false).
     * @param next - Optional next sorter for multi-level sorting chaining.
     *               When comparing equal elements, delegated to this sorter.
     * 
     * @throws {@link ArgumentError} when `keySelector` or `comparer` is undefined.
     * 
     * @example
     * ```typescript
     * // Ascending numeric sort
     * const numSorter = new TyneqEnumerableSorter(
     *     (x) => x,
     *     (a, b) => a - b,
     *     false
     * );
     * 
     * // Descending string sort
     * const strSorter = new TyneqEnumerableSorter(
     *     (obj) => obj.name,
     *     (a, b) => a.localeCompare(b),
     *     true  // descending
     * );
     * 
     * // With chaining
     * const chainedSorter = new TyneqEnumerableSorter(
     *     (obj) => obj.age,
     *     (a, b) => a - b,
     *     false,
     *     numSorter  // primary criterion first
     * );
     * ```
     */
    public constructor(keySelector: (item: TSource) => TKey, comparer: (a: TKey, b: TKey) => number, descending: boolean, next?: BaseEnumerableSorter<TSource>) {
        super();
        ArgumentUtility.checkNotOptional({ keySelector });
        ArgumentUtility.checkNotOptional({ comparer });

        this.keySelector = keySelector;
        this.comparer = comparer;
        this.descending = descending ? -1 : 1;
        this.next = next ?? null;
    }

    /**
     * Computes and caches sort keys for all elements.
     * 
     * @remarks
     * Extracts the key for each element using {@link keySelector} and stores it
     * in the {@link keys} array for efficient access during comparisons.
     * 
     * Also chains to the next sorter's `computeKeys()` if present, ensuring all
     * sorters in the chain compute their keys.
     * 
     * @param source - Array of source elements (a copy; not modified).
     * @param count - Number of elements to process.
     */
    public override computeKeys(source: TSource[], count: number): void {
        this.keys = new Array<TKey>(count);
        for (let i = 0; i < count; i++) {
            this.keys[i] = this.keySelector(source[i]);
        }

        this.next?.computeKeys(source, count);
    }

    /**
     * Compares two elements by their cached keys.
     * 
     * @remarks
     * 1. Applies the comparator to the cached keys at indices `i` and `j`
     * 2. Multiplies the result by {@link descending} for ascending/descending order
     * 3. If result is non-zero, the elements' order is determined and returned
     * 4. If result is zero (equal keys):
     *    - If a next sorter exists, delegates the comparison to it
     *    - Otherwise, applies {@link stabilityCompare} to preserve original order
     * 
     * @param i - Original index of the first element.
     * @param j - Original index of the second element.
     * @returns Comparator value following JavaScript conventions.
     * 
     * @example
     * ```typescript
     * // If this sorter handles the primary sort (ascending age)
     * // and the next handles the secondary sort (ascending name):
     * const result = compareKeys(0, 1);
     * // 1. Compare ages: if different, return that result
     * // 2. If ages equal, delegate to next.compareKeys(0, 1)
     * // 3. If names also equal, stabilityCompare(0, 1) returns 0-1 = -1,
     * //    preserving the original order.
     * ```
     */
    public override compareKeys(i: number, j: number): number {
        let result = this.comparer(this.keys[i], this.keys[j]) * this.descending;
        if (result !== 0) {
            return result;
        }

        if (this.next === null) {
            return this.stabilityCompare(i, j);
        }

        return this.next.compareKeys(i, j);
    }

    /**
     * Preserves the original order of elements with equal keys across all sort levels.
     * 
     * @remarks
     * Called when two elements have equal keys at all sort criteria levels.
     * Returns `i - j` to maintain stable sorting: if `i < j` originally, it stays that way.
     * 
     * This ensures the sort is stable—equal elements maintain their original relative order.
     * 
     * @param i - Original index of the first element.
     * @param j - Original index of the second element.
     * @returns `i - j`, which is negative if `i < j`, zero if equal, positive otherwise.
     * 
     * @example
     * ```typescript
     * // Elements [{ id: 1, val: 5 }, { id: 2, val: 5 }]
     * // sorted by val will produce same order because:
     * // stabilityCompare(0, 1) = 0 - 1 = -1 (i < j, so i stays before j)
     * ```
     */
    protected stabilityCompare(i: number, j: number): number {
        return i - j;
    }
}