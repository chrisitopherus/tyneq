
/**
 * Default comparers used by ordering and equality operators.
 *
 * @group Utilities
 * @internal
 */
export class TyneqComparer {
    /**
     * Natural-order comparer using `<` and `>`.
     *
     * @returns Negative if `a < b`, positive if `a > b`, `0` if equal.
     */
    public static defaultComparer<T>(a: T, b: T): number {
        return a > b ? 1 : a < b ? -1 : 0;
    }

    /** Strict equality comparer using `===`. */
    public static defaultEqualityComparer<T>(a: T, b: T): boolean {
        return a === b;
    }
}
