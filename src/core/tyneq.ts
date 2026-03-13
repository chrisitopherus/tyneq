import { RangeEnumerator } from "../enumerators/streaming/range";
import { RandomEnumerator } from "../enumerators/streaming/random";
import { IEnumerable, IEnumerator, IEnumeratorFactory, IteratorFactory, ITyneqEnumerable } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";
import { EnumerableAdapter } from "./adapter/EnumerableAdapter";
import { TyneqEnumerable } from './TyneqEnumerable';
import { QueryNode } from '../queryplan/QueryNode';

/**
 * Provides static factory methods for creating queryable sequences.
 *
 * @remarks
 * The primary entry point for creating typed enumerable sequences. All methods return
 * lazy-evaluated sequences implementing the full LINQ-style operator surface. Inputs are
 * validated eagerly and throw appropriate errors for null, undefined, or out-of-range values.
 *
 * This class follows the static factory pattern and cannot be instantiated.
 *
 * @see {@link ITyneqEnumerable} for the operator surface of returned sequences.
 *
 * @group Classes
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
     * Wraps an iterable source in a queryable sequence.
     *
     * @remarks
     * The source is not copied or cached; iteration delegates to the source's own iterator.
     * Each enumeration calls the source's `Symbol.iterator` method for a fresh iterator.
     *
     * @param source - The iterable to wrap. Must not be null or undefined.
     *
     * @returns An `ITyneqEnumerable` wrapping the source.
     *
     * @throws {ArgumentNullError} If `source` is null.
     * @throws {ArgumentError} If `source` is undefined or not iterable.
     *
     * @see {@link enumerate} for wrapping an iterable with index tracking.
     */
    public static from<TSource>(source: Iterable<TSource>): ITyneqEnumerable<TSource> {
        ArgumentUtility.checkNotOptional({ source });
        ArgumentUtility.checkIterable({ source });

        const adapter = new EnumerableAdapter(source);
        return new TyneqEnumerable<TSource>(adapter, new QueryNode('from', [source], null, 'source'));
    }

    /**
     * Generates a sequence of `count` elements produced by calling `randomizer` once per element.
     *
     * @remarks
     * If `count` is 0, returns an empty sequence immediately. Otherwise, the sequence is lazy —
     * `randomizer` is called once per element during iteration.
     *
     * @typeParam TSource - The element type returned by `randomizer`.
     *
     * @param count - Number of elements to generate. A value of 0 returns an empty sequence.
     * @param randomizer - Called once for each element position. Must not be null or undefined.
     *
     * @returns A lazy sequence of `count` elements produced by `randomizer`.
     *
     * @see {@link empty} for an empty sequence.
     */
    public static random<TSource>(count: number, randomizer: () => TSource): ITyneqEnumerable<TSource> {
        ArgumentUtility.checkNonNegative({ count });
        ArgumentUtility.checkNotOptional({ randomizer });

        if (count === 0) {
            return this.empty<TSource>();
        }

        return new TyneqEnumerable<TSource>({
            getEnumerator: () => new RandomEnumerator<TSource>(count, randomizer)
        }, new QueryNode('random', [count], null, 'source'));
    }

    /**
     * Returns `true` if `source` is `null`, `undefined`, or contains no elements.
     *
     * @remarks
     * Iterates the source only far enough to determine whether it contains at least one element.
     *
     * @param source - The iterable to test. May be `null` or `undefined`.
     *
     * @returns `true` if `source` is nullish or empty; otherwise `false`.
     */
    public static isNullOrEmpty<TSource>(source: Iterable<TSource> | null | undefined): boolean {
        if (source === null || source === undefined) {
            return true;
        }

        return this.from(source).isNullOrEmpty();
    }

    /**
     * Generates a sequence of consecutive integers starting at `start`.
     *
     * @remarks
     * The sequence is lazy; elements are generated on demand during iteration.
     *
     * @param start - The first integer in the sequence.
     * @param count - The number of integers to generate. Must be a non-negative integer.
     *
     * @returns An `ITyneqEnumerable` containing `count` consecutive integers starting from `start`.
     *
     * @throws {ArgumentOutOfRangeError} If `count` is negative or not a finite number.
     * @throws {ArgumentError} If `count` is not an integer.
     *
     * @see {@link empty} for creating an empty sequence.
     */
    public static range(start: number, count: number): ITyneqEnumerable<number> {
        ArgumentUtility.checkNonNegative({ count });
        ArgumentUtility.checkInteger({ count });

        if (count === 0) {
            return this.empty<number>();
        }

        const end = start + count - 1;
        return new TyneqEnumerable<number>({
            getEnumerator: () => new RangeEnumerator(start, end)
        }, new QueryNode('range', [start, count], null, 'source'));
    }

    /**
     * Creates an empty sequence of the specified type.
     *
     * @typeParam TSource - The element type of the empty sequence.
     *
     * @returns An `ITyneqEnumerable` containing zero elements.
     *
     * @see {@link range} for generating a sequence with a specific count.
     * @see {@link from} for wrapping existing iterables.
     */
    public static empty<TSource>(): ITyneqEnumerable<TSource> {
        return this.from<TSource>([]);
    }

    /**
     * Wraps an iterable source and pairs each element with its zero-based index.
     *
     * @remarks
     * The index counter is shared across all enumerations of the returned sequence.
     * To get a stable indexed sequence, materialize it with `toArray()` after creation.
     *
     * @typeParam TSource - The element type of the source sequence.
     *
     * @param source - The iterable to enumerate with indices. Must not be null or undefined.
     *
     * @returns An `IEnumerable` of `[index, element]` tuples.
     *
     * @throws {ArgumentNullError} If `source` is null.
     * @throws {ArgumentError} If `source` is undefined.
     *
     * @see {@link from} for wrapping an iterable without index tracking.
     */
    public static enumerate<TSource>(source: Iterable<TSource>): IEnumerable<[number, TSource]> {
        let index = 0;
        return this.from(source).select(item => [index++, item] as [number, TSource]);
    }
}
