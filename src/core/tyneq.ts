import { RangeEnumerator } from "../enumerators/streaming/range";
import { RandomOperatorEnumerable } from "../operators/streaming/random";
import { RangeOperatorEnumerable } from "../operators/streaming/range";
import { IEnumerable, IEnumerator, IEnumeratorFactory, IteratorFactory } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";
import { EnumerableAdapter } from "./adapter/EnumerableAdapter";
import { TyneqEnumerable } from './TyneqEnumerable';

/**
 * Provides static factory methods for creating queryable sequences.
 * 
 * @remarks
 * The `Tyneq` class serves as the primary entry point for creating typed enumerable sequences.
 * It provides methods to wrap existing iterables, generate numeric ranges, create empty sequences,
 * and enumerate items with their indices. All methods return lazy-evaluated sequences that implement
 * the full suite of LINQ-style query operators.
 * 
 * All factory methods validate their inputs using {@link ArgumentUtility}, throwing appropriate
 * errors for invalid arguments (null, undefined, negative values, non-integers where required).
 * 
 * This class is designed following the static factory pattern and cannot be instantiated.
 * 
 * @see {@link TyneqEnumerable} for the enumerable sequence type returned by these methods.
 * 
 * @example
 * ```typescript
 * // Create from array
 * const numbers = Tyneq.from([1, 2, 3, 4, 5]);
 * 
 * // Generate range
 * const range = Tyneq.range(0, 100);
 * 
 * // Create empty sequence
 * const empty = Tyneq.empty<string>();
 * 
 * // Enumerate with indices
 * const indexed = Tyneq.enumerate(['a', 'b', 'c']);
 * ```
 */
export class Tyneq {
    /**
     * Wraps an iterable source into a queryable sequence.
     * 
     * @remarks
     * Creates a {@link TyneqEnumerable} from any iterable source (arrays, sets, maps, generator functions, etc.).
     * The returned sequence is lazy-evaluated and re-iterable, meaning it can be enumerated multiple times.
     * Each enumeration calls the source's `Symbol.iterator` method to obtain a fresh iterator.
     * 
     * The source is not copied or cached; iteration delegates directly to the source's iterator.
     * If the source is a generator function, each enumeration will execute the generator from the beginning.
     * 
     * Performance: O(1) time and space to create the wrapper. Enumeration performance depends on the source.
     * 
     * @param source - The iterable source to wrap. Must not be null or undefined.
     * 
     * @returns A {@link TyneqEnumerable} that wraps the source iterable.
     * 
     * @throws {@link ArgumentNullError} when `source` is null.
     * @throws {@link ArgumentError} when `source` is undefined.
     * 
     * @example
     * ```typescript
     * // From array
     * const fromArray = Tyneq.from([1, 2, 3, 4, 5]);
     * 
     * // From Set
     * const fromSet = Tyneq.from(new Set(['a', 'b', 'c']));
     * 
     * // From generator function
     * function* fibonacci() {
     *     let [a, b] = [0, 1];
     *     while (true) {
     *         yield a;
     *         [a, b] = [b, a + b];
     *     }
     * }
     * const fib = Tyneq.from(fibonacci()).take(10);
     * 
     * // From Map (yields [key, value] tuples)
     * const map = new Map([['a', 1], ['b', 2]]);
     * const fromMap = Tyneq.from(map);
     * ```
     * 
     * @see {@link enumerate} for wrapping an iterable with index tracking.
     * @see {@link TyneqEnumerable} for available query operators.
     */
    public static from<TSource>(source: Iterable<TSource>): TyneqEnumerable<TSource> {
        ArgumentUtility.checkNotOptional(source, nameof({ source }));

        const adapter = new EnumerableAdapter(source);
        return new TyneqEnumerable<TSource>(adapter);
    }

    public static random<TSource>(count: number, randomizer: () => TSource): TyneqEnumerable<TSource> {
        if (count === 0) {
            return this.empty<TSource>();
        }

        const operator = new RandomOperatorEnumerable<TSource>(count, randomizer);

        return new TyneqEnumerable<TSource>(operator);
    }

    public static isNullOrEmpty<TSource>(source: Iterable<TSource> | null | undefined): boolean {
        if (source === null || source === undefined) {
            return true;
        }

        return this.from(source).isNullOrEmpty();
    }

    /**
     * Generates a sequence of integers within a specified range.
     * 
     * @remarks
     * Produces a sequence starting at `start` and containing `count` consecutive integers.
     * The sequence is inclusive of `start` and exclusive of `start + count`.
     * The returned sequence is lazy-evaluated; elements are generated on-demand during iteration.
     * 
     * The generated sequence is deterministic and re-iterable. Each enumeration produces
     * the same sequence of numbers.
     * 
     * Performance: O(1) time and space to create the sequence. O(count) time to enumerate all elements.
     * 
     * @param start - The first integer in the sequence. May be any finite integer (positive, negative, or zero).
     * @param count - The number of integers to generate. Must be a non-negative integer. A count of 0 produces an empty sequence.
     * 
     * @returns A {@link TyneqEnumerable} containing `count` consecutive integers starting from `start`.
     * 
     * @throws {@link ArgumentOutOfRangeError} when `count` is negative or not a finite number.
     * @throws {@link ArgumentError} when `count` is not an integer.
     * 
     * @example
     * ```typescript
     * // Generate numbers 0 to 9
     * const zeroToNine = Tyneq.range(0, 10);
     * // Result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     * 
     * // Generate numbers 5 to 14
     * const fiveToFourteen = Tyneq.range(5, 10);
     * // Result: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
     * 
     * // Negative start value
     * const negativeRange = Tyneq.range(-5, 5);
     * // Result: [-5, -4, -3, -2, -1]
     * 
     * // Empty sequence (count = 0)
     * const empty = Tyneq.range(100, 0);
     * // Result: []
     * 
     * // Combine with query operators
     * const squares = Tyneq.range(1, 10)
     *     .select(n => n * n)
     *     .toArray();
     * // Result: [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
     * ```
     * 
     * @see {@link empty} for creating an empty sequence.
     */
    public static range(start: number, count: number): TyneqEnumerable<number> {
        ArgumentUtility.checkNonNegative(count, nameof({ count }));
        ArgumentUtility.checkInteger(count, nameof({ count }));

        if (count === 0) {
            return this.empty<number>();
        }

        const operator = new RangeOperatorEnumerable(start, start + count - 1);

        return new TyneqEnumerable<number>(operator);
    }

    /**
     * Creates an empty sequence of the specified type.
     * 
     * @remarks
     * Returns a re-iterable sequence with no elements. The sequence is typed to `TSource` but contains
     * no values. Enumeration completes immediately without yielding any items.
     * 
     * This method is useful as a starting point for query composition, for representing "no results",
     * or as a default/fallback value in conditional logic.
     * 
     * Performance: O(1) time and space. Enumeration performs no iterations.
     * 
     * @typeParam TSource - The element type of the empty sequence.
     * 
     * @returns A {@link TyneqEnumerable} containing zero elements.
     * 
     * @example
     * ```typescript
     * // Create empty sequence of numbers
     * const noNumbers = Tyneq.empty<number>();
     * console.log(noNumbers.count()); // 0
     * 
     * // Use as fallback
     * function getItems(includeItems: boolean): TyneqEnumerable<string> {
     *     return includeItems 
     *         ? Tyneq.from(['item1', 'item2'])
     *         : Tyneq.empty<string>();
     * }
     * 
     * // Type-safe empty sequence
     * interface User { id: number; name: string; }
     * const noUsers = Tyneq.empty<User>();
     * 
     * // Combining with other sequences
     * const combined = Tyneq.empty<number>()
     *     .concat(Tyneq.range(1, 5))
     *     .toArray();
     * // Result: [1, 2, 3, 4, 5]
     * ```
     * 
     * @see {@link range} for generating a sequence with a specific count.
     * @see {@link from} for wrapping existing iterables.
     */
    public static empty<TSource>(): TyneqEnumerable<TSource> {
        return this.from<TSource>([]);
    }

    /**
     * Wraps an iterable source and pairs each element with its zero-based index.
     * 
     * @remarks
     * Creates a sequence of tuples where each tuple contains the element's index (starting at 0)
     * and the element itself. The index is computed during enumeration using a closure variable
     * that increments with each yielded element.
     * 
     * The returned sequence is lazy-evaluated but NOT deterministically re-iterable if enumerated
     * multiple times. The index counter is shared across all enumerations and will continue
     * incrementing. For re-iterable indexed sequences, call `.toArray()` or materialize the
     * sequence after creation.
     * 
     * The enumeration order matches the source's iteration order. If the source is unordered
     * (e.g., Set in some environments), the indices reflect enumeration order, not insertion order.
     * 
     * Performance: O(1) time and space to create the sequence. O(n) time to enumerate all elements.
     * 
     * @typeParam TSource - The element type of the source sequence.
     * 
     * @param source - The iterable source to enumerate with indices. Must not be null or undefined.
     * 
     * @returns An {@link IEnumerable} of tuples where each tuple is `[index, element]`.
     * 
     * @throws {@link ArgumentNullError} when `source` is null.
     * @throws {@link ArgumentError} when `source` is undefined.
     * 
     * @example
     * ```typescript
     * // Basic enumeration with index
     * const letters = Tyneq.enumerate(['a', 'b', 'c']);
     * for (const [index, letter] of letters) {
     *     console.log(`${index}: ${letter}`);
     * }
     * // Output:
     * // 0: a
     * // 1: b
     * // 2: c
     * 
     * // Find index of first match
     * const numbers = [10, 20, 30, 40, 50];
     * const [index, value] = Tyneq.enumerate(numbers)
     *     .first(([i, n]) => n > 25);
     * // index = 2, value = 30
     * 
     * // Create indexed objects
     * const items = ['apple', 'banana', 'cherry'];
     * const indexed = Tyneq.enumerate(items)
     *     .select(([i, item]) => ({ id: i, name: item }))
     *     .toArray();
     * // Result: [
     * //   { id: 0, name: 'apple' },
     * //   { id: 1, name: 'banana' },
     * //   { id: 2, name: 'cherry' }
     * // ]
     * ```
     * 
     * @see {@link from} for wrapping an iterable without index tracking.
     */
    public static enumerate<TSource>(source: Iterable<TSource>): IEnumerable<[number, TSource]> {
        let index = 0;
        return this.from(source).select(item => [index++, item] as [number, TSource]);
    }
}