/**
 * Provides default comparison and equality comparison implementations.
 * 
 * @remarks
 * `TyneqComparer` is a static utility class offering standardized comparator functions
 * used throughout the library for sorting and equality operations.
 * 
 * This class provides two core functions:
 * - {@link defaultComparer}: Relational comparison for sorting (returns -1, 0, or 1)
 * - {@link defaultEqualityComparer}: Equality comparison (returns boolean)
 * 
 * These functions follow JavaScript's built-in comparison semantics using the
 * `<`, `>`, and `===` operators. They work with any type that supports these operators
 * (primitives, objects with custom comparison behavior, etc.).
 * 
 * Many Tyneq operators accept optional `comparer` or `equalityComparer` parameters.
 * When omitted, these defaults are used internally.
 * 
 * This class cannot be instantiated; all members are static.
 * 
 * @example
 * ```typescript
 * // Sorting with default comparer
 * const numbers = [3, 1, 4, 1, 5, 9, 2, 6];
 * const sorted = Tyneq.from(numbers)
 *     .orderBy(n => n) // Uses TyneqComparer.defaultComparer internally
 *     .toArray();
 * // Result: [1, 1, 2, 3, 4, 5, 6, 9]
 * 
 * // Equality with default equality comparer
 * const hasDuplicate = Tyneq.from(numbers)
 *     .distinct() // Uses TyneqComparer.defaultEqualityComparer internally
 *     .count() < numbers.length;
 * // Result: true
 * 
 * // Using comparers explicitly
 * const result1 = TyneqComparer.defaultComparer(5, 3); // 1 (5 > 3)
 * const result2 = TyneqComparer.defaultComparer(2, 2); // 0 (2 == 2)
 * const result3 = TyneqComparer.defaultComparer(1, 7); // -1 (1 < 7)
 * 
 * const equal = TyneqComparer.defaultEqualityComparer('hello', 'hello'); // true
 * const notEqual = TyneqComparer.defaultEqualityComparer(1, 2); // false
 * ```
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
     * Compares two values using JavaScript's `<` and `>` operators and returns:
     * - Positive value (1) if `a > b`
     * - Negative value (-1) if `a < b`
     * - Zero (0) if `a == b` (neither `<` nor `>`)
     * 
     * This function is used as the default comparer for sorting operators
     * like `orderBy()`, `orderByDescending()`, `min()`, and `max()` when
     * no custom comparer is provided.
     * 
     * The comparer relies on the type's built-in comparison operators. For custom
     * types, ensure they implement comparison semantics correctly. For complex
     * sorting logic, provide a custom comparer function.
     * 
     * Behavioral notes:
     * - For numbers: Standard numeric comparison
     * - For strings: Lexicographic (Unicode code point) comparison
     * - For dates: Chronological comparison
     * - Comparing `null`/`undefined` may produce unexpected results; filter them first
     * 
     * @typeParam T - The type of values being compared (must support `<` and `>`).
     * 
     * @param a - The first value.
     * @param b - The second value.
     * 
     * @returns 
     * - `1` if `a > b`
     * - `-1` if `a < b`
     * - `0` if `a` is equal to `b`
     * 
     * @example
     * ```typescript
     * // Numeric comparison
     * TyneqComparer.defaultComparer(10, 5);  // 1
     * TyneqComparer.defaultComparer(3, 3);   // 0
     * TyneqComparer.defaultComparer(2, 8);   // -1
     * 
     * // String comparison (lexicographic)
     * TyneqComparer.defaultComparer('apple', 'banana');  // -1
     * TyneqComparer.defaultComparer('zebra', 'aardvark'); // 1
     * 
     * // Using with orderBy
     * const sorted = Tyneq.from([3, 1, 4, 1, 5])
     *     .orderBy(n => n, TyneqComparer.defaultComparer)
     *     .toArray();
     * // Result: [1, 1, 3, 4, 5]
     * ```
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
     * Compares two values using JavaScript's strict equality operator (`===`)
     * and returns a boolean indicating whether the values are equal.
     * 
     * This function is used as the default equality comparer for operators like
     * `distinct()`, `union()`, `intersect()`, `except()`, `contains()`, and
     * `sequenceEqual()` when no custom equality comparer is provided.
     * 
     * Behavioral notes:
     * - Uses strict equality (`===`), not loose equality (`==`)
     * - For primitives (number, string, boolean): compares by value
     * - For objects (including arrays, dates): compares by reference
     * - `NaN === NaN` is `false` (standard JavaScript behavior)
     * - For deep object equality, provide a custom equality comparer
     * 
     * @typeParam T - The type of values being compared.
     * 
     * @param a - The first value.
     * @param b - The second value.
     * 
     * @returns `true` if `a === b`, otherwise `false`.
     * 
     * @example
     * ```typescript
     * // Primitive comparisons
     * TyneqComparer.defaultEqualityComparer(42, 42);       // true
     * TyneqComparer.defaultEqualityComparer('hi', 'hi');   // true
     * TyneqComparer.defaultEqualityComparer(5, 10);        // false
     * 
     * // Reference comparisons for objects
     * const obj1 = { id: 1 };
     * const obj2 = { id: 1 };
     * const obj3 = obj1;
     * TyneqComparer.defaultEqualityComparer(obj1, obj2); // false (different references)
     * TyneqComparer.defaultEqualityComparer(obj1, obj3); // true (same reference)
     * 
     * // Using with distinct
     * const unique = Tyneq.from([1, 2, 2, 3, 1, 4])
     *     .distinct() // Uses defaultEqualityComparer internally
     *     .toArray();
     * // Result: [1, 2, 3, 4]
     * 
     * // Custom equality for deep comparison
     * const users = [
     *     { id: 1, name: 'Alice' },
     *     { id: 2, name: 'Bob' },
     *     { id: 1, name: 'Alice' }
     * ];
     * const uniqueUsers = Tyneq.from(users)
     *     .distinctBy(u => u.id) // Use distinctBy with key selector
     *     .toArray();
     * // Result: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
     * ```
     * 
     * @see {@link defaultComparer} for relational comparisons.
     */
    public static defaultEqualityComparer<T>(a: T, b: T): boolean {
        return a === b;
    }
}