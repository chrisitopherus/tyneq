/**
 * Provides default comparison and equality comparison functions.
 *
 * @remarks
 * `TyneqComparer` is a static utility class offering standardized comparators used throughout
 * the library. Many operators accept optional `comparer` or `equalityComparer` parameters;
 * these defaults apply when none is provided.
 *
 * This class cannot be instantiated; all members are static.
 *
 * @see {@link ITyneqEnumerable.orderBy} for sorting operations.
 * @see {@link ITyneqEnumerable.distinct} for deduplication operations.
 *
 * @group Utilities
 */
export class TyneqComparer {
    /**
     * Default relational comparer for sorting operations.
     *
     * @remarks
     * Uses JavaScript's `<` and `>` operators. Returns `1` if `a > b`, `-1` if `a < b`,
     * and `0` otherwise. Works for numbers, strings, and dates; custom types may require
     * a dedicated comparer.
     *
     * @typeParam T - The type of values being compared.
     *
     * @param a - The first value.
     * @param b - The second value.
     *
     * @returns `1` if `a > b`, `-1` if `a < b`, `0` if equal.
     *
     * @see {@link defaultEqualityComparer} for equality comparisons.
     */
    public static defaultComparer<T>(a: T, b: T): number {
        return a > b ? 1 : a < b ? -1 : 0;
    }

    /**
     * Default equality comparer for deduplication and membership operations.
     *
     * @remarks
     * Uses JavaScript's strict equality operator (`===`). Compares primitives by value and
     * objects by reference. For deep object equality, provide a custom comparer.
     *
     * @typeParam T - The type of values being compared.
     *
     * @param a - The first value.
     * @param b - The second value.
     *
     * @returns `true` if `a === b`, otherwise `false`.
     *
     * @see {@link defaultComparer} for relational comparisons.
     */
    public static defaultEqualityComparer<T>(a: T, b: T): boolean {
        return a === b;
    }
}
