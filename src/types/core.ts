import { BaseEnumerableSorter } from "../core/ordering/BaseEnumerableSorter";
import { Nullable } from "./utility";
import { tyneqQueryNode } from "./queryplan";
import type { IQueryNode } from "./queryplan";

/**
 * Represents an iterator that traverses a sequence of elements.
 *
 * @remarks
 * Extends the standard JavaScript `Iterator<T>` interface with optional `return` and `throw`
 * methods. Enumerators created from {@link IEnumeratorFactory} can support re-iteration by
 * creating fresh instances on each call to `getEnumerator()`.
 *
 * @typeParam T - The type of elements being enumerated.
 *
 * @see {@link IEnumeratorFactory} for creating enumerators.
 * @see {@link IEnumerable} for re-iterable sequences.
 *
 * @group Interfaces
 */
export interface IEnumerator<T> extends Iterator<T> {
    next(): IteratorResult<T>;

    /**
     * Signals early termination to the iterator.
     */
    return?(value?: unknown): IteratorResult<T>;

    /**
     * Injects an exception into the iterator.
     */
    throw?(e?: unknown): IteratorResult<T>;
}

/**
 * Provides a factory method for creating enumerators.
 *
 * @remarks
 * Each call to `getEnumerator()` must return a new, independent enumerator instance starting
 * from the beginning of the sequence with no shared iteration state.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @see {@link IEnumerator} for the iterator type returned.
 * @see {@link IEnumerable} which combines this with the Iterable protocol.
 *
 * @group Interfaces
 */
export interface IEnumeratorFactory<T> {
    /**
     * Creates a new enumerator positioned before the first element.
     */
    getEnumerator(): IEnumerator<T>;
}

/**
 * Represents a re-iterable sequence of elements.
 *
 * @remarks
 * Combines the standard JavaScript `Iterable<T>` protocol with the {@link IEnumeratorFactory}
 * pattern so that sequences can be enumerated multiple times. Each call to `Symbol.iterator`
 * returns a fresh, independent enumerator. This interface serves as the base for
 * {@link ITyneqEnumerable}, which extends it with LINQ-style query operators.
 *
 * @typeParam T - The type of elements in the sequence.
 *
 * @see {@link IEnumerator} for the iterator type.
 * @see {@link IEnumeratorFactory} for the factory pattern.
 * @see {@link ITyneqEnumerable} for the full query operator interface.
 *
 * @group Interfaces
 */
export interface IEnumerable<T> extends Iterable<T>, IEnumeratorFactory<T> {
    [Symbol.iterator](): IEnumerator<T>;
}

/**
 * A factory function that creates a new enumerator.
 *
 * @remarks
 * Lightweight functional alternative to {@link IEnumeratorFactory}. Each invocation must
 * produce a fresh, independent enumerator with no shared mutable state.
 *
 * @typeParam T - The type of elements produced by the enumerator.
 *
 * @see {@link IEnumerator} for the enumerator type returned.
 * @see {@link IEnumeratorFactory} for the interface-based equivalent.
 *
 * @group Types
 */
export type IteratorFactory<T> = () => IEnumerator<T>;

/**
 * A factory function that creates a typed enumerable from an iterator factory.
 *
 * @remarks
 * Used internally to construct specific {@link ITyneqEnumerable} implementations so that
 * query operators produce sequences of the same concrete type as the source.
 *
 * @typeParam TSource - The element type of the sequence.
 * @typeParam TEnumerable - The specific enumerable implementation type.
 *
 * @see {@link ITyneqEnumerable} for the base enumerable interface.
 * @see {@link IteratorFactory} for the factory function type.
 *
 * @group Types
 * @internal
 */
export type TyneqEnumerableFactory<TSource, TEnumerable extends ITyneqEnumerable<TSource>> = (iteratorFactory: IteratorFactory<TSource>) => TEnumerable;

/**
 * Represents a queryable sequence with LINQ-style operators.
 *
 * @remarks
 * Extends {@link IEnumerable} with terminal, streaming, and buffering operators. Streaming
 * operators transform elements one-at-a-time using deferred execution; buffering operators
 * buffer part or all of the source before producing results; terminal operators enumerate the
 * source immediately and return a concrete value. Sequences are re-iterable — each enumeration
 * creates a fresh iterator and re-executes the pipeline.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link IEnumerable} for the base iterable interface.
 * @see {@link ITyneqOrderedEnumerable} for ordered sequences with additional sorting operators.
 *
 * @group Interfaces
 */
export interface ITyneqEnumerable<TSource> extends IEnumerable<TSource> {
    // ========================================================================
    // QUERY PLAN
    // ========================================================================

    /**
     * The query plan node for this step in the operator chain.
     *
     * @remarks
     * Access via the {@link tyneqQueryNode} symbol — not a normal string-keyed property,
     * so it does not appear in autocomplete. Import the symbol explicitly to opt in:
     *
     * ```ts
     * import { tyneqQueryNode } from 'tyneq';
     *
     * const seq = Tyneq.from([1, 2, 3]).where(x => x > 0).select(x => x * 2);
     * const node = seq[tyneqQueryNode]; // IQueryNode | null
     * console.log(node?.operatorName);  // 'select'
     * ```
     *
     * `null` for sequences created without query-plan support (e.g., `pipe()`).
     */
    readonly [tyneqQueryNode]: Nullable<IQueryNode>;

    // ========================================================================
    // TERMINAL OPERATORS
    // These operators execute the query and return a concrete value.
    // ========================================================================

    /**
     * Returns `true` if any element satisfies the predicate.
     *
     * @param predicate - Tests each element; return `true` to match.
     * @returns `false` if the sequence is empty.
     */
    any(predicate: (item: TSource) => boolean): boolean;

    /**
     * Returns `true` if every element satisfies the predicate.
     *
     * @returns `true` if the sequence is empty.
     */
    all(predicate: (item: TSource) => boolean): boolean;

    /**
     * Returns `true` if the sequence contains `value`.
     *
     * @remarks
     * Immediate. Source is fully enumerated when this method is called. Elements are compared
     * with `===`. Returns `false` for an empty sequence. Short-circuits on the first match.
     */
    contains(value: TSource): boolean;

    /**
     * Returns the number of elements in the sequence.
     *
     * @remarks
     * Immediate. Source is fully enumerated when this method is called. Returns `0` for an
     * empty sequence.
     */
    count(): number;

    /**
     * Returns the number of elements that satisfy the predicate.
     *
     * @remarks
     * Immediate. Source is fully enumerated when this method is called.
     */
    countBy(predicate: (item: TSource) => boolean): number;

    /**
     * Forces immediate evaluation by fully consuming the sequence.
     *
     * @remarks
     * Immediate. Source is fully enumerated when this method is called. Use to trigger
     * side effects registered via `tap()` or `tapIf()` without materializing results.
     */
    consume(): void;

    /**
     * Returns `true` if the sequence is `null` or contains no elements.
     *
     * @remarks
     * Immediate. Reads at most one element from the source.
     */
    isNullOrEmpty(): boolean;

    /**
     * Returns the element at zero-based `index`.
     *
     * @throws {InvalidOperationError} When the index is out of range.
     */
    elementAt(index: number): TSource;

    /**
     * Returns the element at zero-based `index`, or `defaultValue` if the index is out of range.
     */
    elementAtOrDefault(index: number, defaultValue: TSource): TSource;

    /**
     * Returns the first element matching the predicate.
     *
     * @throws {InvalidOperationError} When no element matches.
     */
    first(predicate: (item: TSource) => boolean): TSource;

    /**
     * Returns the first element matching the predicate, or `defaultValue` if none matches.
     */
    firstOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource;

    /**
     * Returns the zero-based index of the first element matching the predicate, or `-1` if not found.
     *
     * @param startIndex - Index to begin searching from; defaults to `0`.
     * @throws {ArgumentNullError} When `predicate` is null.
     * @throws {ArgumentError} When `predicate` is undefined.
     */
    indexOf(predicate: (item: TSource) => boolean, startIndex?: number): number;

    /**
     * Returns the last element matching the predicate.
     *
     * @throws {InvalidOperationError} When no element matches.
     */
    last(predicate: (item: TSource) => boolean): TSource;

    /**
     * Returns the last element matching the predicate, or `defaultValue` if none matches.
     *
     * @throws {ArgumentNullError} When `predicate` is null.
     * @throws {ArgumentError} When `predicate` is undefined.
     */
    lastOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource;

    /**
     * Returns the maximum element.
     *
     * @param comparer - Custom comparison function; if omitted, uses default ordering.
     * @throws {InvalidOperationError} When the sequence is empty.
     */
    max(comparer?: (a: TSource, b: TSource) => number): TSource;

    /**
     * Returns the element with the largest key.
     *
     * @param comparer - Custom comparison function for keys; if omitted, uses default ordering.
     * @throws {InvalidOperationError} When the sequence is empty.
     */
    maxBy<TKey>(keySelector: (element: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): TSource;

    /**
     * Returns the minimum element.
     *
     * @param comparer - Custom comparison function; if omitted, uses default ordering.
     * @throws {InvalidOperationError} When the sequence is empty.
     */
    min(comparer?: (a: TSource, b: TSource) => number): TSource;

    /**
     * Returns the element with the smallest key.
     *
     * @param comparer - Custom comparison function for keys; if omitted, uses default ordering.
     * @throws {InvalidOperationError} When the sequence is empty.
     */
    minBy<TKey>(keySelector: (element: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): TSource;

    /**
     * Returns `true` if both sequences contain the same elements in the same order.
     *
     * @param equalityComparer - Custom equality test; if omitted, uses `===`.
     */
    sequenceEqual(other: Iterable<TSource>, equalityComparer?: (a: TSource, b: TSource) => boolean): boolean;

    /**
     * Returns the only element matching the predicate.
     *
     * @throws {InvalidOperationError} When no element matches, or more than one element matches.
     */
    single(predicate: (item: TSource) => boolean): TSource;

    /**
     * Returns the only element matching the predicate, or `defaultValue` if none matches.
     *
     * @throws {InvalidOperationError} When more than one element matches.
     */
    singleOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource;

    /**
     * Returns `true` if the sequence begins with all elements of `sequence`, in order.
     */
    startsWith(sequence: Iterable<TSource>): boolean;

    /**
     * Returns the sum of values extracted by `selector`. Returns `0` for an empty sequence.
     *
     * @throws {ArgumentNullError} When `selector` is null.
     * @throws {ArgumentError} When `selector` is undefined.
     */
    sum(selector: (item: TSource) => number): number;

    /**
     * Materializes the sequence into an array.
     *
     * @remarks
     * Immediate. Source is fully enumerated when this method is called.
     */
    toArray(): TSource[];

    /**
     * Wraps the sequence as a native `AsyncIterable`, enabling `for await...of` consumption
     * and piping to async sinks.
     *
     * @remarks
     * Deferred. The source is not enumerated until the returned `AsyncIterable` is iterated.
     * Each iteration of the returned `AsyncIterable` produces a fresh traversal of the source.
     */
    toAsync(): AsyncIterable<TSource>;

    /**
     * Creates a `Map` by applying `selector` to each element.
     *
     * @remarks
     * Immediate. Source is fully enumerated when this method is called.
     */
    toMap<TKey, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>): Map<TKey, TValue>;

    /**
     * Creates a plain record object by applying `selector` to each element.
     *
     * @remarks
     * Immediate. Source is fully enumerated when this method is called.
     */
    toRecord<TKey extends string | number | symbol, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>): Record<TKey, TValue>;

    /**
     * Materializes the sequence into a `Set`, deduplicating by reference equality.
     *
     * @remarks
     * Immediate. Source is fully enumerated when this method is called.
     */
    toSet(): Set<TSource>;

    /**
     * Returns the arithmetic mean of values extracted by `selector`. Returns `0` for an empty sequence.
     *
     * @throws {ArgumentNullError} When `selector` is null.
     * @throws {ArgumentError} When `selector` is undefined.
     */
    average(selector: (item: TSource) => number): number;

    /**
     * Applies `func` to each element with a running accumulator, then transforms the final value with `resultSelector`.
     *
     * @param seed - Initial accumulator value.
     * @throws {ArgumentNullError} When `func` or `resultSelector` is null.
     * @throws {ArgumentError} When `func` or `resultSelector` is undefined.
     */
    aggregate<UAccumulate, VResult>(
        seed: UAccumulate,
        func: (accumulate: UAccumulate, item: TSource) => UAccumulate,
        resultSelector: (accumulate: UAccumulate) => VResult
    ): VResult;

    // ========================================================================
    // STREAMING OPERATORS
    // These operators transform elements lazily as they flow through the pipeline.
    // They do not enumerate the source until iteration begins.
    // ========================================================================

    /**
     * Yields all source elements followed by `item`.
     *
     * @remarks
     * Deferred. Source is not enumerated until the returned sequence is iterated.
     */
    append(item: TSource): ITyneqEnumerable<TSource>;

    /**
     * Casts every element to `U` via a compile-time-only double assertion.
     *
     * @remarks
     * Deferred. Source is not enumerated until the returned sequence is iterated.
     *
     * No runtime type checking is performed. Use {@link ofType} for runtime-safe filtering.
     */
    cast<U>(): ITyneqEnumerable<U>;

    /**
     * Splits the sequence into arrays of at most `size` elements. The last chunk may be smaller.
     *
     * @remarks
     * Deferred. Source is not enumerated until the returned sequence is iterated.
     */
    chunk(size: number): ITyneqEnumerable<TSource[]>;

    /**
     * Yields all elements of this sequence followed by all elements of `other`.
     *
     * @remarks
     * Deferred. Source is not enumerated until the returned sequence is iterated.
     */
    concat(other: Iterable<TSource>): ITyneqEnumerable<TSource>;

    /**
     * Returns the sequence unchanged, or a single-element sequence containing `defaultValue` if empty.
     *
     * @remarks
     * Deferred. Source is not enumerated until the returned sequence is iterated.
     */
    defaultIfEmpty(defaultValue: TSource): ITyneqEnumerable<TSource>;

    /**
     * Yields adjacent element pairs as `[previous, current]` tuples.
     *
     * @remarks
     * Deferred. Source is not enumerated until the returned sequence is iterated. Produces
     * no output for sequences with fewer than two elements.
     */
    pairwise(): ITyneqEnumerable<[TSource, TSource]>;

    /**
     * Filters elements to those matching `guard`, narrowing the element type to `U`.
     *
     * @remarks
     * Deferred. Source is not enumerated until the returned sequence is iterated.
     *
     * @throws {ArgumentNullError} When `guard` is null.
     * @throws {ArgumentError} When `guard` is undefined.
     */
    ofType<U extends TSource>(guard: (value: TSource) => value is U): ITyneqEnumerable<U>;

    /**
     * Yields `item` followed by all source elements.
     *
     * @remarks
     * Deferred. Source is not enumerated until the returned sequence is iterated.
     */
    prepend(item: TSource): ITyneqEnumerable<TSource>;

    /**
     * Replaces every element with `value`, preserving the element count.
     */
    populate<TValue>(value: TValue): ITyneqEnumerable<TValue>;

    /**
     * Projects each element using `selector`.
     *
     * @throws {ArgumentNullError} When `selector` is null.
     */
    select<TResult>(selector: (item: TSource) => TResult): ITyneqEnumerable<TResult>;

    /**
     * Projects each element to a sequence and flattens the results.
     *
     * @throws {ArgumentNullError} When `selector` is null.
     * @throws {ArgumentError} When `selector` is undefined.
     */
    selectMany<TResult>(selector: (item: TSource) => Iterable<TResult>): ITyneqEnumerable<TResult>;

    /**
     * Skips the first `count` elements. Negative or zero values skip nothing.
     */
    skip(count: number): ITyneqEnumerable<TSource>;

    /**
     * Skips the last `count` elements. Negative or zero values skip nothing.
     */
    skipLast(count: number): ITyneqEnumerable<TSource>;

    /**
     * Skips elements while the predicate returns `true`, then yields the remainder.
     *
     * @throws {ArgumentNullError} When `predicate` is null.
     * @throws {ArgumentError} When `predicate` is undefined.
     */
    skipWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource>;

    /**
     * Splits the sequence on elements where `splitOn` returns `true`. Split-point elements are excluded.
     *
     * @throws {ArgumentNullError} When `splitOn` is null.
     * @throws {ArgumentError} When `splitOn` is undefined.
     */
    split(splitOn: (item: TSource) => boolean): ITyneqEnumerable<TSource[]>;

    /**
     * Takes the first `count` elements. Negative or zero values return an empty sequence.
     */
    take(count: number): ITyneqEnumerable<TSource>;

    /**
     * Yields elements while the predicate returns `true`, stopping at the first non-matching element.
     *
     * @throws {ArgumentNullError} When `predicate` is null.
     * @throws {ArgumentError} When `predicate` is undefined.
     */
    takeWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource>;

    /**
     * Invokes `action` on each element as a side effect, passing elements through unchanged.
     *
     * @throws {ArgumentNullError} When `action` is null.
     */
    tap(action: (item: TSource) => void): ITyneqEnumerable<TSource>;

    /**
     * Invokes `action` on each element only if `predicate()` returns `true` at call time.
     *
     * @throws {ArgumentNullError} When `action` or `predicate` is null.
     */
    tapIf(action: (item: TSource) => void, predicate: () => boolean): ITyneqEnumerable<TSource>;

    /**
     * Yields every `count`-th element, discarding elements in between. A value of `1` yields every element.
     *
     * @param count - Sampling interval; must be a positive integer.
     */
    throttle(count: number): ITyneqEnumerable<TSource>;

    /**
     * Filters the sequence to elements where `predicate` returns `true`.
     *
     * @throws {ArgumentNullError} When `predicate` is null.
     */
    where(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource>;

    /**
     * Pairs elements from both sequences using `selector`. Stops when either sequence is exhausted.
     */
    zip<TOther, TResult>(other: Iterable<TOther>, selector: (first: TSource, second: TOther) => TResult): ITyneqEnumerable<TResult>;

    // ========================================================================
    // BUFFERING OPERATORS
    // These operators must buffer or cache elements before producing results.
    // They enumerate part or all of the source during execution.
    // ========================================================================

    /**
     * Returns distinct elements in order of first occurrence.
     */
    distinct(): ITyneqEnumerable<TSource>;

    /**
     * Returns elements with distinct keys in order of first key occurrence.
     *
     * @throws {ArgumentNullError} When `keySelector` is null.
     * @throws {ArgumentError} When `keySelector` is undefined.
     */
    distinctBy<TKey>(keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource>;

    /**
     * Returns distinct elements from this sequence that do not appear in `excludedValues`.
     */
    except(excludedValues: Iterable<TSource>): ITyneqEnumerable<TSource>;

    /**
     * Returns elements whose extracted key does not appear in `excludedKeys`.
     */
    exceptBy<TKey>(excludedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource>;

    /**
     * Groups elements by key and projects each group into a result.
     *
     * @param resultSelector - Called once per group with the key and an enumerable of projected values.
     * @throws {ArgumentNullError} When any parameter is null.
     * @throws {ArgumentError} When any parameter is undefined.
     */
    groupBy<TKey, TValue, TResult>(
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: ITyneqEnumerable<TValue>) => TResult
    ): ITyneqEnumerable<TResult>;

    /**
     * Performs a left outer join, grouping inner matches under each outer element.
     *
     * @param resultSelector - Receives each outer element and an enumerable of its inner matches (empty if none).
     */
    groupJoin<TInner, TKey, TResult>(
        inner: Iterable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, group: ITyneqEnumerable<TInner>) => TResult
    ): ITyneqEnumerable<TResult>;

    /**
     * Returns distinct elements that appear in both this sequence and `intersectedValues`.
     */
    intersect(intersectedValues: Iterable<TSource>): ITyneqEnumerable<TSource>;

    /**
     * Returns elements whose extracted key appears in `intersectedKeys`.
     */
    intersectBy<TKey>(intersectedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource>;

    /**
     * Correlates elements by key equality (inner join). Only outer elements with at least one matching inner element are yielded.
     *
     * @throws {ArgumentNullError} When any function parameter is null.
     * @throws {ArgumentError} When any function parameter is undefined.
     */
    join<TInner, TKey, TResult>(
        inner: Iterable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, inner: TInner) => TResult
    ): ITyneqEnumerable<TResult>;

    /**
     * Caches the sequence so that subsequent enumerations replay from the cache instead of re-evaluating the source.
     *
     * @remarks
     * Deferred. Source is not enumerated until the returned sequence is iterated. Elements are
     * cached incrementally; subsequent enumerations reuse cached values for the portion already
     * evaluated and continue from the source for the remainder.
     *
     * @returns A cached enumerable that stores source elements on first access.
     * Call `refresh()` on the returned value to invalidate the cache.
     */
    memoize(): ITyneqCachedEnumerable<TSource>;

    /**
     * Sorts elements in ascending order by `keySelector`.
     *
     * @param comparer - Custom comparison function; if omitted, uses default ordering.
     * @returns An ordered sequence; chain `thenBy()` or `thenByDescending()` for secondary sorts.
     * @throws {ArgumentNullError} When `keySelector` is null.
     * @throws {ArgumentError} When `keySelector` is undefined.
     */
    orderBy<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: (a: TKey, b: TKey) => number
    ): ITyneqOrderedEnumerable<TSource>;

    /**
     * Sorts elements in descending order by `keySelector`.
     *
     * @param comparer - Custom comparison function; if omitted, uses default ordering.
     * @returns An ordered sequence; chain `thenBy()` or `thenByDescending()` for secondary sorts.
     * @throws {ArgumentNullError} When `keySelector` is null.
     * @throws {ArgumentError} When `keySelector` is undefined.
     */
    orderByDescending<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: (a: TKey, b: TKey) => number
    ): ITyneqOrderedEnumerable<TSource>;

    /**
     * Yields elements in reverse order.
     *
     * @remarks
     * Deferred. Source is fully buffered on the first iteration of the returned sequence.
     */
    reverse(): ITyneqEnumerable<TSource>;

    /**
     * Yields elements in a random order.
     *
     * @remarks
     * Deferred. Source is fully buffered on the first iteration of the returned sequence.
     */
    shuffle(): ITyneqEnumerable<TSource>;

    /**
     * Inserts `other` at a position counted from the end. `index = 0` inserts at the very end.
     */
    backsert(index: number, other: Iterable<TSource>): ITyneqEnumerable<TSource>;

    /**
     * Returns distinct elements from both sequences (set union).
     */
    union(otherValues: Iterable<TSource>): ITyneqEnumerable<TSource>;

    /**
     * Returns elements with distinct keys from both sequences, using `keySelector` for comparison.
     */
    unionBy<TKey>(otherValues: Iterable<TSource>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource>;

    // ========================================================================
    // EXTENSION / PLUGIN
    // Advanced extensibility for custom operators.
    // ========================================================================

    /**
     * Applies a custom transformation via a user-supplied factory function.
     */
    pipe<TResult>(factory: (source: Iterable<TSource>) => IEnumerator<TResult> | IterableIterator<TResult>): ITyneqEnumerable<TResult>;

    // ========================================================================
    // EXTENSION OPERATORS
    // Registered via the extensibility infrastructure (@operator, createOperator,
    // createGeneratorOperator, @terminal, createTerminalOperator).
    // Requires importing 'tyneq/extensions' (or the operators/extensions barrel)
    // to trigger side-effect registration before using these operators.
    // ========================================================================

    /**
     * Emits a running accumulation of elements (streaming reduce / prefix scan).
     *
     * @remarks
     * Deferred. Source is not enumerated until the returned sequence is iterated.
     *
     * Unlike `aggregate()`, yields every intermediate accumulator value rather than only the
     * final result. The seed is not yielded; the first emitted value is
     * `accumulator(seed, element[0])`.
     *
     * @typeParam TResult - The type of the accumulated result.
     * @param seed - Initial accumulator value.
     * @param accumulator - Applied to `(currentAcc, item)` for each element.
     * @returns A sequence of intermediate accumulated values.
     *
     * @example
     * ```ts
     * Tyneq.from([1, 2, 3, 4, 5])
     *     .scan(0, (acc, n) => acc + n)
     *     .toArray();
     * // → [1, 3, 6, 10, 15]
     * ```
     */
    scan<TResult>(seed: TResult, accumulator: (acc: TResult, item: TSource) => TResult): ITyneqEnumerable<TResult>;

    /**
     * Produces overlapping sliding windows of exactly `size` consecutive elements.
     *
     * @remarks
     * Deferred. Source is not enumerated until the returned sequence is iterated.
     *
     * Only complete windows are emitted. Trailing elements that do not fill a full window
     * are discarded. The sequence must contain at least `size` elements for any output to
     * be produced.
     *
     * @param size - The number of elements per window (must be ≥ 1).
     * @returns A sequence of arrays, each containing `size` consecutive elements.
     *
     * @example
     * ```ts
     * Tyneq.from([1, 2, 3, 4, 5])
     *     .window(3)
     *     .toArray();
     * // → [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
     * ```
     */
    window(size: number): ITyneqEnumerable<TSource[]>;

    /**
     * Places a `delimiter` element between every pair of consecutive elements.
     *
     * @remarks
     * Deferred. Source is not enumerated until the returned sequence is iterated.
     *
     * The delimiter is only inserted between existing elements — it is never prepended or
     * appended. An empty or single-element sequence passes through unchanged.
     *
     * @param delimiter - The value to insert between elements.
     * @returns A sequence with `delimiter` inserted between each adjacent pair.
     *
     * @example
     * ```ts
     * Tyneq.from([1, 2, 3])
     *     .intersperse(0)
     *     .toArray();
     * // → [1, 0, 2, 0, 3]
     * ```
     */
    intersperse(delimiter: TSource): ITyneqEnumerable<TSource>;

    /**
     * Returns both the minimum and maximum elements in a single enumeration pass.
     *
     * @remarks
     * Immediate. Source is fully enumerated when this method is called.
     *
     * @param comparer - Custom comparison function; if omitted, uses default ordering.
     * @throws {SequenceContainsNoElementsError} When the sequence is empty.
     *
     * @example
     * ```ts
     * const { min, max } = Tyneq.from([3, 1, 4, 1, 5, 9, 2, 6]).minMax();
     * // → { min: 1, max: 9 }
     * ```
     */
    minMax(comparer?: (a: TSource, b: TSource) => number): MinMaxResult<TSource>;
}

/**
 * Represents an ordered sequence with additional ordering operators.
 *
 * @remarks
 * Returned by `orderBy()` and `orderByDescending()`. Extends {@link ITyneqEnumerable} with
 * `thenBy()` and `thenByDescending()` for multi-level sorting. Each `thenBy` call adds a
 * secondary sort criterion without replacing the primary ordering. The sort is stable.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable} for the base enumerable interface.
 *
 * @group Interfaces
 */
export interface ITyneqOrderedEnumerable<TSource> extends ITyneqEnumerable<TSource> {
    /**
     * Adds a secondary sort in ascending order.
     *
     * @param comparer - Custom comparison function; if omitted, uses default ordering.
     */
    thenBy<TKey>(keySelector: (item: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): ITyneqOrderedEnumerable<TSource>;

    /**
     * Adds a secondary sort in descending order.
     *
     * @param comparer - Custom comparison function; if omitted, uses default ordering.
     */
    thenByDescending<TKey>(keySelector: (item: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): ITyneqOrderedEnumerable<TSource>;
}

/**
 * A cached sequence that replays already-fetched elements without re-evaluating the source.
 *
 * @remarks
 * Obtained by calling `memoize()` on any {@link ITyneqEnumerable}. Elements are fetched from
 * the source on demand and stored in an internal cache. Subsequent enumerations replay cached
 * elements for the portion already evaluated.
 *
 * Call `refresh()` to discard the cache and restart evaluation from the source on the next
 * iteration.
 *
 * @typeParam TSource - Element type of the sequence.
 *
 * @see {@link ITyneqEnumerable.memoize} Factory method that returns this interface.
 *
 * @group Interfaces
 * @internal
 */
export interface ITyneqCachedEnumerable<TSource> extends ITyneqEnumerable<TSource> {
    /**
     * Discards the internal cache and resets the sequence to re-evaluate from the source on
     * the next iteration.
     *
     * @returns The same cached enumerable instance, now with an empty cache.
     */
    refresh(): ITyneqCachedEnumerable<TSource>;
}

/**
 * Low-level contract for incremental cache access used by memoize enumerators.
 *
 * @typeParam TSource - Element type of the sequence.
 *
 * @group Interfaces
 * @internal
 */
export interface ICachedEnumerable<TSource> extends IEnumerable<TSource> {
    /**
     * Returns the element at `index` from the cache if available, or fetches the next element
     * from the source and caches it.
     *
     * @param index - Zero-based index of the element to retrieve.
     * @returns `{ has: true, value }` if the element exists; `{ has: false }` if the source is
     *   exhausted before reaching `index`.
     */
    tryGetAtFromCache(index: number): CacheResult<TSource>;
}

/**
 * Result of a single cache lookup via {@link ICachedEnumerable.tryGetAtFromCache}.
 *
 * @typeParam TSource - Element type of the sequence.
 *
 * @group Types
 * @internal
 */
export type CacheResult<TSource> = { has: true, value: TSource } | { has: false };

/**
 * Internal contract for ordered enumerable implementations.
 *
 * @remarks
 * Maintains a reference to the source sequence, an optional parent ordering for chained
 * `thenBy` operations, and a method to construct the composite {@link BaseEnumerableSorter}.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqOrderedEnumerable} for the public ordered enumerable interface.
 * @see {@link BaseEnumerableSorter} for the sorter implementation.
 *
 * @group Interfaces
 * @internal
 */
export interface IOrderedEnumerable<TSource> extends IEnumerable<TSource> {
    source: ITyneqEnumerable<TSource>;

    /**
     * The parent ordering in a multi-level sort chain, or `null` for the primary ordering.
     */
    parent: Nullable<IOrderedEnumerable<TSource>>;

    /**
     * Creates a sorter that applies this ordering and all parent orderings.
     *
     * @param next - The next sorter in the chain, or `null` if this is the last.
     * @returns A composite sorter implementing the full sort behavior.
     */
    getSorter(next: Nullable<BaseEnumerableSorter<TSource>>): BaseEnumerableSorter<TSource>;
}

/**
 * The result of a `minMax()` operation: both the minimum and maximum element.
 *
 * @typeParam T - Element type of the source sequence.
 *
 * @see {@link ITyneqEnumerable.minMax}
 *
 * @group Types
 */
export type MinMaxResult<T> = {
    /** The smallest element according to the comparer. */
    readonly min: T;
    /** The largest element according to the comparer. */
    readonly max: T;
};

/**
 * Represents a key-value pair.
 *
 * @remarks
 * Returned by selector functions passed to `toMap()` and `toRecord()`.
 *
 * @typeParam TKey - The type of the key.
 * @typeParam TValue - The type of the value.
 *
 * @see {@link ITyneqEnumerable.toMap}
 * @see {@link ITyneqEnumerable.toRecord}
 *
 * @group Types
 */
export type KeyValuePair<TKey, TValue> = {
    key: TKey;
    value: TValue;
};
