import { IEnumerator, IEnumeratorFactory, ITyneqCachedEnumerable, ITyneqEnumerable, ITyneqOrderedEnumerable } from '../types/core';
import { TyneqEnumerableBase } from "./TyneqEnumerableBase";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";
import { TyneqCachedEnumerable } from './cache/TyneqCachedEnumerable';
import { TyneqOrderedEnumerable } from './ordering/TyneqOrderedEnumerable';

/**
 * Standard implementation of a queryable enumerable sequence.
 * 
 * @remarks
 * `TyneqEnumerable<TSource>` is the core implementation returned by most Tyneq factory
 * methods and query operators. It wraps an {@link IEnumeratorFactory} that produces
 * fresh iterators on each enumeration, enabling re-iterable, lazy-evaluated sequences.
 * 
 * ## Key Characteristics
 * 
 * - **Lazy Evaluation**: Query operators (select, where, etc.) are not executed until
 *   the sequence is enumerated (e.g., via `toArray()`, `for...of`, or `count()`).
 * - **Re-Iterable**: Each call to `[Symbol.iterator]()` or `getEnumerator()` obtains
 *   a fresh iterator from the factory, allowing the sequence to be enumerated multiple times.
 * - **Deferred Execution**: Chaining operators builds a pipeline of transformations
 *   that execute element-by-element during iteration.
 * 
 * ## Enumerator Factory Pattern
 * 
 * The constructor accepts an {@link IEnumeratorFactory}, which is an object with a
 * `getEnumerator()` method. This factory is called each time the sequence is iterated,
 * ensuring independent iteration state.
 * 
 * The factory is validated on construction; null or undefined factories throw an error
 * via {@link ArgumentUtility.checkNotOptional}.
 * 
 * ## Method Resolution
 * 
 * `TyneqEnumerable` inherits all query operators from {@link TyneqEnumerableBase},
 * including:
 * - **Streaming operators**: select, where, take, skip, etc.
 * - **Buffering operators**: orderBy, reverse, distinct, groupBy, etc.
 * - **Terminal operators**: toArray, count, first, sum, etc.
 * 
 * When operators return new sequences, they call {@link createEnumerable} to wrap
 * the result in a fresh `TyneqEnumerable` instance.
 * 
 * ## Ordered Sequences
 * 
 * When `orderBy()` or `orderByDescending()` is called, the result is a
 * {@link TyneqOrderedEnumerable}, which supports multi-level sorting via `thenBy()`
 * and `thenByDescending()`. The {@link createOrderedEnumerable} method constructs
 * these specialized instances.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @example
 * ```typescript
 * // Created by Tyneq.from()
 * const numbers = Tyneq.from([1, 2, 3, 4, 5]);
 * 
 * // Chaining operators (lazy, not yet executed)
 * const query = numbers
 *     .where(n => n % 2 === 0)
 *     .select(n => n * n);
 * 
 * // Execute by enumerating (triggers evaluation)
 * const result = query.toArray(); // [4, 16]
 * 
 * // Re-iterate (creates fresh enumerator)
 * for (const n of query) {
 *     console.log(n); // 4, 16
 * }
 * 
 * // Directly creating a TyneqEnumerable with a factory
 * const custom = new TyneqEnumerable<number>({
 *     getEnumerator() {
 *         let i = 0;
 *         return {
 *             next() {
 *                 if (i < 3) {
 *                     return { value: i++, done: false };
 *                 }
 *                 return { value: undefined, done: true };
 *             }
 *         };
 *     }
 * });
 * console.log(custom.toArray()); // [0, 1, 2]
 * ```
 * 
 * @see {@link TyneqEnumerableBase} for inherited query operators.
 * @see {@link TyneqOrderedEnumerable} for ordered sequence support.
 * @see {@link Tyneq} for factory methods that create instances.
 */
export class TyneqEnumerable<TSource> extends TyneqEnumerableBase<TSource> {
    /**
     * The factory that produces enumerators for this sequence.
     * 
     * @remarks
     * Called each time the sequence is iterated via `[Symbol.iterator]()` or `getEnumerator()`.
     * Ensures independent iteration state for each enumeration.
     */
    protected readonly enumeratorFactory: IEnumeratorFactory<TSource>;

    /**
     * Creates a new enumerable sequence from an enumerator factory.
     * 
     * @remarks
     * Validates the factory parameter and stores it for later use by {@link getEnumerator}.
     * The factory is called each time the sequence is enumerated, ensuring independent
     * iteration state and enabling re-iteration.
     * 
     * Most consumers use {@link Tyneq} factory methods (e.g., `Tyneq.from()`, `Tyneq.range()`)
     * rather than constructing `TyneqEnumerable` directly. This constructor is primarily
     * used internally by query operators.
     * 
     * @param enumeratorFactory - Factory that produces fresh iterators on each enumeration.
     *                            Must not be null or undefined.
     * 
     * @throws {@link ArgumentNullError} when `enumeratorFactory` is null.
     * @throws {@link ArgumentError} when `enumeratorFactory` is undefined.
     */
    public constructor(enumeratorFactory: IEnumeratorFactory<TSource>) {
        super();
        ArgumentUtility.checkNotOptional(enumeratorFactory, nameof({ enumeratorFactory }));
        this.enumeratorFactory = enumeratorFactory;
    }

    /**
     * Obtains a fresh iterator for this sequence.
     * 
     * @remarks
     * Delegates to the {@link enumeratorFactory} to produce a new iterator.
     * Each call returns an independent iterator with its own iteration state,
     * allowing the sequence to be enumerated multiple times concurrently.
     * 
     * This method is called automatically by the `[Symbol.iterator]()` method
     * (defined in {@link TyneqEnumerableBase}), enabling `for...of` loops.
     * 
     * **Performance**: O(1) time to create the iterator. Actual iteration cost
     * depends on the underlying enumerator factory implementation.
     * 
     * @returns A fresh iterator positioned before the first element.
     */
    public override getEnumerator(): IEnumerator<TSource> {
        return this.enumeratorFactory.getEnumerator();
    }

    /**
     * Creates a new enumerable sequence from an enumerator factory.
     * 
     * @remarks
     * Called by query operators to wrap their result in a `TyneqEnumerable` instance.
     * This allows operators to return sequences with the same type and capabilities
     * as the original sequence.
     * 
     * This is part of the factory pattern infrastructure enabling operator chaining.
     * Each operator creates a new enumerable wrapping its transformation logic.
     * 
     * @typeParam TResult - The element type of the new sequence.
     * 
     * @param factory - Factory that produces enumerators for the new sequence.
     * 
     * @returns A new `TyneqEnumerable<TResult>` wrapping the factory.
     */
    protected override createEnumerable<TResult>(factory: IEnumeratorFactory<TResult>): ITyneqEnumerable<TResult> {
        return new TyneqEnumerable<TResult>(factory);
    }

    /**
     * Creates an ordered enumerable for multi-level sorting.
     * 
     * @remarks
     * Called by `orderBy()` and `orderByDescending()` operators to produce a
     * {@link TyneqOrderedEnumerable}, which supports `thenBy()` and `thenByDescending()`
     * for secondary sort criteria.
     * 
     * This is part of the factory pattern infrastructure. The ordered enumerable
     * maintains a reference to this sequence and applies sorting lazily during enumeration.
     * 
     * @typeParam TKey - The type of the sort key.
     * 
     * @param keySelector - Function to extract the sort key from each element.
     * @param comparer - Function to compare two keys.
     * @param descending - Whether to sort in descending order.
     * 
     * @returns A {@link TyneqOrderedEnumerable} configured with the sort criterion.
     */
    protected createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean
    ): ITyneqOrderedEnumerable<TSource> {
        return new TyneqOrderedEnumerable<TSource, TKey>(
            this,
            keySelector,
            comparer,
            descending
        );
    }

    protected createCachedEnumerable(source: ITyneqEnumerable<TSource>): ITyneqCachedEnumerable<TSource> {
        return new TyneqCachedEnumerable<TSource>(source);
    }
}