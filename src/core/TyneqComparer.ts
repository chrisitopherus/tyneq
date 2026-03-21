/**
 * Provides default comparison and equality comparison functions.
 *
 * @remarks
 * Static utility class; cannot be instantiated. The defaults apply whenever an operator's
 * optional `comparer` or `equalityComparer` parameter is omitted.
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
     * Uses JavaScript's `<` and `>` operators. Works for numbers, strings, and dates;
     * custom types may require a dedicated comparer.
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
     * Uses strict equality (`===`): primitives by value, objects by reference.
     * For deep object equality, provide a custom comparer.
     *
     * @see {@link defaultComparer} for relational comparisons.
     */
    public static defaultEqualityComparer<T>(a: T, b: T): boolean {
        return a === b;
    }
}
