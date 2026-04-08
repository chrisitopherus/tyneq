import { BaseEnumerableSorter } from "../core/ordering/BaseEnumerableSorter";
import { BoundMethod, Nullable } from "./utility";
import { tyneqQueryNode } from "./queryplan";
import type { OperatorCategory, QueryPlanNode } from "./queryplan";
import { TyneqEnumerableBase } from "../core/TyneqEnumerableBase";
import { OperatorMetadata } from "../core/OperatorMetadata";
import { TyneqEnumerableCore } from "../core/TyneqEnumerableCore";

/**
 * A pull-based iterator over a sequence.
 *
 * @remarks
 * Extends the native `Iterator<T>` protocol. `return()` disposes the iterator early;
 * `throw()` is not supported and throws {@link NotSupportedError} if called.
 *
 * @typeParam T - Element type.
 * @group Interfaces
 */
export interface Enumerator<T> extends Iterator<T> {
    next(): IteratorResult<T>;

    /**
     * Terminates the iterator early and releases resources.
     *
     * @remarks
     * Idempotent - safe to call multiple times. Calling `next()` after `return()` returns `{ done: true }`.
     */
    return?(value?: unknown): IteratorResult<T>;

    /**
     * Not supported. Throws {@link NotSupportedError} if called.
     */
    throw?(e?: unknown): IteratorResult<T>;
}

/**
 * A factory that produces a fresh {@link Enumerator} on demand.
 *
 * @typeParam T - Element type.
 * @group Interfaces
 */
export interface EnumeratorFactory<T> {
    /** Returns a new, independent enumerator starting at the beginning of the sequence. */
    getEnumerator(): Enumerator<T>;
}

/**
 * A function that compares two values for ordering.
 *
 * @remarks
 * Must return a negative number when `a < b`, a positive number when `a > b`, and `0` when equal.
 * Matches the signature expected by `Array.prototype.sort`.
 *
 * @typeParam T - The type of values being compared.
 * @group Types
 */
export type Comparer<T> = (a: T, b: T) => number;

/**
 * A function that tests two values for equality.
 *
 * @typeParam T - The type of values being compared.
 * @group Types
 */
export type EqualityComparer<T> = (a: T, b: T) => boolean;

/**
 * A lazy, re-iterable sequence.
 *
 * @remarks
 * Each call to `[Symbol.iterator]()` or `getEnumerator()` produces a fresh enumerator with
 * independent state, allowing the same sequence to be iterated multiple times.
 *
 * @typeParam T - Element type.
 * @group Interfaces
 */
export interface Enumerable<T> extends Iterable<T>, EnumeratorFactory<T> {
    [Symbol.iterator](): Enumerator<T>;
}

/**
 * Function that produces a fresh {@link Enumerator} each time it is called.
 *
 * @group Types
 */
export type IteratorFactory<T> = () => Enumerator<T>;

/**
 * Function that wraps an iterator factory in a concrete `TyneqSequence` subclass.
 *
 * @group Types
 * @internal
 */
export type TyneqEnumerableFactory<TSource, TEnumerable extends TyneqSequence<TSource>> = (iteratorFactory: IteratorFactory<TSource>) => TEnumerable;

/**
 * The primary public API for a lazy sequence - the type returned by all Tyneq operators.
 *
 * @remarks
 * Every operator method returns a new `TyneqSequence` without consuming the source.
 * The source is not iterated until the returned sequence is iterated.
 *
 * @typeParam TSource - Element type.
 * @group Interfaces
 */
export interface TyneqSequence<TSource> extends Enumerable<TSource> {
    // ========================================================================
    // QUERY PLAN
    // ========================================================================

    /**
     * The query plan node for this sequence, or `null` if no plan is available.
     *
     * @remarks
     * Use {@link QueryPlanPrinter} to render this as a string.
     * Sequences created via `pipe()` always have `null` here.
     */
    readonly [tyneqQueryNode]: Nullable<QueryPlanNode>;

    // ========================================================================
    // TERMINAL OPERATORS
    // These operators execute the query and return a concrete value.
    // ========================================================================

    /**
     * Returns `true` if any element satisfies the predicate.
     *
     * @remarks
     * Returns `false` for an empty sequence.
     *
     * @throws {ArgumentNullError} When `predicate` is null or undefined.
     */
    any(predicate: (item: TSource) => boolean): boolean;

    /**
     * Returns `true` if all elements satisfy the predicate.
     *
     * @remarks
     * Returns `true` for an empty sequence (vacuous truth).
     *
     * @throws {ArgumentNullError} When `predicate` is null or undefined.
     */
    all(predicate: (item: TSource) => boolean): boolean;

    /**
     * Returns `true` if the sequence contains `value` using strict equality (`===`).
     *
     * @remarks
     * Returns `false` for an empty sequence.
     */
    contains(value: TSource): boolean;

    /**
     * Returns the number of elements.
     *
     * @remarks
     * Returns `0` for an empty sequence.
     */
    count(): number;

    /**
     * Returns the number of elements that satisfy the predicate.
     *
     * @remarks
     * Returns `0` if no elements match or the sequence is empty.
     *
     * @throws {ArgumentNullError} When `predicate` is null or undefined.
     */
    countBy(predicate: (item: TSource) => boolean): number;

    /**
     * Iterates the entire sequence and discards all elements.
     *
     * @remarks
     * Useful for triggering side effects (e.g., after `tap`).
     */
    consume(): void;

    /**
     * Returns `true` if the sequence is empty or if the first element is `null` or `undefined`.
     */
    isNullOrEmpty(): boolean;

    /**
     * Returns the element at `index`.
     *
     * @throws {ArgumentOutOfRangeError} When `index` is negative or greater than or equal to the sequence length.
     */
    elementAt(index: number): TSource;

    /**
     * Returns the element at `index`, or `defaultValue` if the index is out of range.
     */
    elementAtOrDefault(index: number, defaultValue: TSource): TSource;

    /**
     * Returns the first element that satisfies the predicate.
     *
     * @throws {ArgumentNullError} When `predicate` is null or undefined.
     * @throws {SequenceContainsNoElementsError} When no element satisfies the predicate.
     */
    first(predicate: (item: TSource) => boolean): TSource;

    /**
     * Returns the first element that satisfies the predicate, or `defaultValue` if none does.
     *
     * @throws {ArgumentNullError} When `predicate` is null or undefined.
     */
    firstOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource;

    /**
     * Returns the zero-based index of the first element that satisfies the predicate.
     *
     * @remarks
     * Returns `-1` if no element satisfies the predicate.
     * When `startIndex` is provided, the search starts at that index.
     *
     * @throws {ArgumentNullError} When `predicate` is null or undefined.
     */
    indexOf(predicate: (item: TSource) => boolean, startIndex?: number): number;

    /**
     * Returns the last element that satisfies the predicate.
     *
     * @throws {ArgumentNullError} When `predicate` is null or undefined.
     * @throws {SequenceContainsNoElementsError} When no element satisfies the predicate.
     */
    last(predicate: (item: TSource) => boolean): TSource;

    /**
     * Returns the last element that satisfies the predicate, or `defaultValue` if none does.
     *
     * @throws {ArgumentNullError} When `predicate` is null or undefined.
     */
    lastOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource;

    /**
     * Returns the maximum element according to the comparer.
     *
     * @remarks
     * Uses the natural `>` operator when no comparer is provided.
     *
     * @throws {SequenceContainsNoElementsError} When the sequence is empty.
     */
    max(comparer?: Comparer<TSource>): TSource;

    /**
     * Returns the element with the maximum key.
     *
     * @throws {SequenceContainsNoElementsError} When the sequence is empty.
     * @throws {ArgumentNullError} When `keySelector` is null or undefined.
     */
    maxBy<TKey>(keySelector: (element: TSource) => TKey, comparer?: Comparer<TKey>): TSource;

    /**
     * Returns the minimum element according to the comparer.
     *
     * @remarks
     * Uses the natural `<` operator when no comparer is provided.
     *
     * @throws {SequenceContainsNoElementsError} When the sequence is empty.
     */
    min(comparer?: Comparer<TSource>): TSource;

    /**
     * Returns the element with the minimum key.
     *
     * @throws {SequenceContainsNoElementsError} When the sequence is empty.
     * @throws {ArgumentNullError} When `keySelector` is null or undefined.
     */
    minBy<TKey>(keySelector: (element: TSource) => TKey, comparer?: Comparer<TKey>): TSource;

    /**
     * Returns `true` if this sequence and `other` have the same elements in the same order.
     *
     * @remarks
     * Uses `equalityComparer` for element comparison, or `===` when omitted.
     * Returns `true` if both sequences are empty.
     */
    sequenceEqual(other: Iterable<TSource>, equalityComparer?: EqualityComparer<TSource>): boolean;

    /**
     * Returns the only element that satisfies the predicate.
     *
     * @throws {ArgumentNullError} When `predicate` is null or undefined.
     * @throws {SequenceContainsNoElementsError} When no element satisfies the predicate.
     * @throws {InvalidOperationError} When more than one element satisfies the predicate.
     */
    single(predicate: (item: TSource) => boolean): TSource;

    /**
     * Returns the only element that satisfies the predicate, or `defaultValue` if none does.
     *
     * @throws {ArgumentNullError} When `predicate` is null or undefined.
     * @throws {InvalidOperationError} When more than one element satisfies the predicate.
     */
    singleOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource;

    /**
     * Returns `true` if this sequence starts with all elements of `sequence` in order.
     *
     * @remarks
     * Uses `===` for element comparison. Returns `true` when `sequence` is empty.
     */
    startsWith(sequence: Iterable<TSource>): boolean;

    /**
     * Returns the sum of `selector` applied to each element.
     *
     * @remarks
     * Returns `0` for an empty sequence.
     *
     * @throws {ArgumentNullError} When `selector` is null or undefined.
     */
    sum(selector: (item: TSource) => number): number;

    /**
     * Materializes the sequence into an array.
     *
     * @remarks
     * Returns `[]` for an empty sequence.
     */
    toArray(): TSource[];

    /**
     * Returns an `AsyncIterable` that iterates this sequence asynchronously.
     *
     * @remarks
     * Deferred - each `for await...of` loop produces a fresh traversal of the source.
     */
    toAsync(): AsyncIterable<TSource>;

    /**
     * Materializes the sequence into a `Map`.
     *
     * @throws {ArgumentNullError} When `selector` is null or undefined.
     */
    toMap<TKey, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>): Map<TKey, TValue>;

    /**
     * Materializes the sequence into a plain object record.
     *
     * @throws {ArgumentNullError} When `selector` is null or undefined.
     */
    toRecord<TKey extends string | number | symbol, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>): Record<TKey, TValue>;

    /**
     * Materializes the sequence into a `Set`.
     *
     * @remarks
     * Duplicate elements are deduplicated using `Set` identity semantics.
     */
    toSet(): Set<TSource>;

    /**
     * Returns the arithmetic mean of `selector` applied to each element.
     *
     * @throws {SequenceContainsNoElementsError} When the sequence is empty.
     * @throws {ArgumentNullError} When `selector` is null or undefined.
     */
    average(selector: (item: TSource) => number): number;

    /**
     * Folds the sequence into a single result value.
     *
     * @remarks
     * Applies `func` to each element in order, starting from `seed`. Returns `resultSelector(seed)` for an empty sequence.
     *
     * @throws {ArgumentNullError} When `func` or `resultSelector` is null or undefined.
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

    /** Returns a new sequence with `item` appended after all source elements. */
    append(item: TSource): TyneqSequence<TSource>;

    /**
     * Partitions the sequence into non-overlapping arrays of length `size`.
     *
     * @remarks
     * The last chunk may be shorter than `size` if the sequence length is not divisible by `size`.
     *
     * @throws {ArgumentOutOfRangeError} When `size` is less than or equal to `0`.
     */
    chunk(size: number): TyneqSequence<TSource[]>;

    /** Returns a new sequence with the elements of `other` appended after the source. */
    concat(other: Iterable<TSource>): TyneqSequence<TSource>;

    /**
     * Returns a sequence that yields `defaultValue` when the source is empty.
     *
     * @remarks
     * Passes source elements through unchanged when the source is non-empty.
     */
    defaultIfEmpty(defaultValue: TSource): TyneqSequence<TSource>;

    /**
     * Returns consecutive overlapping pairs of elements: `[e0,e1]`, `[e1,e2]`, ...
     *
     * @remarks
     * Returns an empty sequence when the source has fewer than two elements.
     */
    pairwise(): TyneqSequence<[TSource, TSource]>;

    /**
     * Filters elements to those for which `guard` returns `true`, narrowing the type to `U`.
     *
     * @throws {ArgumentNullError} When `guard` is null or undefined.
     */
    ofType<U extends TSource>(guard: (value: TSource) => value is U): TyneqSequence<U>;

    /** Returns a new sequence with `item` prepended before all source elements. */
    prepend(item: TSource): TyneqSequence<TSource>;

    /**
     * Replaces each element with `value`, keeping the same sequence length.
     *
     * @remarks
     * Useful for generating a sequence of a fixed value with a known length derived from the source.
     */
    populate<TValue>(value: TValue): TyneqSequence<TValue>;

    /**
     * Projects each element through `selector`.
     *
     * @throws {ArgumentNullError} When `selector` is null or undefined.
     */
    select<TResult>(selector: (item: TSource) => TResult): TyneqSequence<TResult>;

    /**
     * Projects each element to an iterable and flattens the results into a single sequence.
     *
     * @throws {ArgumentNullError} When `selector` is null or undefined.
     */
    selectMany<TResult>(selector: (item: TSource) => Iterable<TResult>): TyneqSequence<TResult>;

    /**
     * Skips the first `count` elements.
     *
     * @remarks
     * Returns an empty sequence when `count` exceeds the sequence length.
     * `count` must be non-negative.
     *
     * @throws {ArgumentOutOfRangeError} When `count` is negative.
     */
    skip(count: number): TyneqSequence<TSource>;

    /**
     * Skips the last `count` elements.
     *
     * @remarks
     * Buffers `count` elements to determine the cutoff.
     *
     * @throws {ArgumentOutOfRangeError} When `count` is negative.
     */
    skipLast(count: number): TyneqSequence<TSource>;

    /**
     * Skips elements while `predicate` returns `true`, then yields the rest.
     *
     * @throws {ArgumentNullError} When `predicate` is null or undefined.
     */
    skipWhile(predicate: (item: TSource) => boolean): TyneqSequence<TSource>;

    /**
     * Splits the sequence at elements where `splitOn` returns `true`.
     *
     * @remarks
     * The delimiter elements are consumed and not included in any sub-array.
     *
     * @throws {ArgumentNullError} When `splitOn` is null or undefined.
     */
    split(splitOn: (item: TSource) => boolean): TyneqSequence<TSource[]>;

    /**
     * Takes at most the first `count` elements.
     *
     * @throws {ArgumentOutOfRangeError} When `count` is negative.
     */
    take(count: number): TyneqSequence<TSource>;

    /**
     * Takes elements while `predicate` returns `true`, then stops.
     *
     * @throws {ArgumentNullError} When `predicate` is null or undefined.
     */
    takeWhile(predicate: (item: TSource) => boolean): TyneqSequence<TSource>;

    /**
     * Executes `action` for each element as it passes through the pipeline, then yields it unchanged.
     *
     * @throws {ArgumentNullError} When `action` is null or undefined.
     */
    tap(action: (item: TSource) => void): TyneqSequence<TSource>;

    /**
     * Executes `action` for each element only while `predicate()` returns `true`.
     *
     * @throws {ArgumentNullError} When `action` or `predicate` is null or undefined.
     */
    tapIf(action: (item: TSource) => void, predicate: () => boolean): TyneqSequence<TSource>;

    /**
     * Yields every `count`-th element (i.e. elements at indices 0, `count`, `2*count`, ...).
     *
     * @throws {ArgumentOutOfRangeError} When `count` is less than or equal to `0`.
     */
    throttle(count: number): TyneqSequence<TSource>;

    /**
     * Yields only elements for which `predicate` returns `true`.
     *
     * @throws {ArgumentNullError} When `predicate` is null or undefined.
     */
    where(predicate: (item: TSource) => boolean): TyneqSequence<TSource>;

    /**
     * Pairs each element with the corresponding element from `other` using `selector`.
     *
     * @remarks
     * Stops at the shorter of the two sequences.
     *
     * @throws {ArgumentNullError} When `other` or `selector` is null or undefined.
     */
    zip<TOther, TResult>(other: Iterable<TOther>, selector: (first: TSource, second: TOther) => TResult): TyneqSequence<TResult>;

    // ========================================================================
    // BUFFERING OPERATORS
    // These operators must buffer or cache elements before producing results.
    // They enumerate part or all of the source during execution.
    // ========================================================================

    /** Returns the sequence without duplicate elements (using `===` equality). */
    distinct(): TyneqSequence<TSource>;

    /**
     * Returns the sequence without duplicate elements, comparing by the result of `keySelector`.
     *
     * @throws {ArgumentNullError} When `keySelector` is null or undefined.
     */
    distinctBy<TKey>(keySelector: (item: TSource) => TKey): TyneqSequence<TSource>;

    /** Returns elements not present in `excludedValues`, using `===` equality. */
    except(excludedValues: Iterable<TSource>): TyneqSequence<TSource>;

    /**
     * Returns elements whose key (via `keySelector`) is not found in `excludedKeys`.
     *
     * @throws {ArgumentNullError} When `keySelector` is null or undefined.
     */
    exceptBy<TKey>(excludedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey): TyneqSequence<TSource>;

    /**
     * Groups elements by key and projects each group with `resultSelector`.
     *
     * @throws {ArgumentNullError} When `keySelector`, `valueSelector`, or `resultSelector` is null or undefined.
     */
    groupBy<TKey, TValue, TResult>(
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: TyneqSequence<TValue>) => TResult
    ): TyneqSequence<TResult>;

    /**
     * Performs a left outer join: each outer element is paired with its matching inner group.
     *
     * @remarks
     * Elements with no match in `inner` receive an empty group.
     *
     * @throws {ArgumentNullError} When any selector is null or undefined.
     */
    groupJoin<TInner, TKey, TResult>(
        inner: Iterable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, group: TyneqSequence<TInner>) => TResult
    ): TyneqSequence<TResult>;

    /** Returns elements that are also present in `intersectedValues`, using `===` equality. */
    intersect(intersectedValues: Iterable<TSource>): TyneqSequence<TSource>;

    /**
     * Returns elements whose key (via `keySelector`) is found in `intersectedKeys`.
     *
     * @throws {ArgumentNullError} When `keySelector` is null or undefined.
     */
    intersectBy<TKey>(intersectedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey): TyneqSequence<TSource>;

    /**
     * Performs an inner join: produces one result for each matching pair of outer and inner elements.
     *
     * @throws {ArgumentNullError} When any selector is null or undefined.
     */
    join<TInner, TKey, TResult>(
        inner: Iterable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, inner: TInner) => TResult
    ): TyneqSequence<TResult>;

    /**
     * Returns a sequence that caches elements incrementally as they are iterated.
     *
     * @remarks
     * Subsequent iterations replay the cache; the source is only iterated once.
     * Call `refresh()` on the returned sequence to clear the cache and re-enumerate the source.
     */
    memoize(): TyneqCachedSequence<TSource>;

    /**
     * Returns the sequence sorted in ascending order by `keySelector`.
     *
     * @remarks
     * Stable sort. Append `thenBy`/`thenByDescending` for multi-key sorting.
     *
     * @throws {ArgumentNullError} When `keySelector` is null or undefined.
     */
    orderBy<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: Comparer<TKey>
    ): TyneqOrderedSequence<TSource>;

    /**
     * Returns the sequence sorted in descending order by `keySelector`.
     *
     * @remarks
     * Stable sort. Append `thenBy`/`thenByDescending` for multi-key sorting.
     *
     * @throws {ArgumentNullError} When `keySelector` is null or undefined.
     */
    orderByDescending<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: Comparer<TKey>
    ): TyneqOrderedSequence<TSource>;

    /** Returns all possible permutations of the sequence. */
    permutations(): TyneqSequence<TSource[]>;

    /** Returns the sequence in reverse order. */
    reverse(): TyneqSequence<TSource>;

    /** Returns the sequence in random order using `Math.random()`. */
    shuffle(): TyneqSequence<TSource>;

    /**
     * Inserts elements from `other` into the sequence at `index`.
     *
     * @remarks
     * `index` is zero-based and counts from the end of the sequence.
     * Use `0` to append, `1` to insert one before the last element, etc.
     *
     * @throws {ArgumentOutOfRangeError} When `index` is negative.
     */
    backsert(index: number, other: Iterable<TSource>): TyneqSequence<TSource>;

    /** Returns the distinct elements from both this sequence and `otherValues`, using `===` equality. */
    union(otherValues: Iterable<TSource>): TyneqSequence<TSource>;

    /**
     * Returns the elements from both sequences whose keys are distinct.
     *
     * @throws {ArgumentNullError} When `keySelector` is null or undefined.
     */
    unionBy<TKey>(otherValues: Iterable<TSource>, keySelector: (item: TSource) => TKey): TyneqSequence<TSource>;

    // ========================================================================
    // PLUGIN
    // Advanced plugin API for custom operators.
    // ========================================================================

    /**
     * Passes this sequence through a custom `factory` function and wraps the result.
     *
     * @remarks
     * The returned sequence tracks a `"pipe"` node in the query plan, with `factory` recorded
     * as the argument. Use this for one-off operator compositions that do not need to be
     * registered via the plugin API.
     *
     * @throws {ArgumentNullError} When `factory` is null or undefined.
     */
    pipe<TResult>(factory: (source: Iterable<TSource>) => Enumerator<TResult> | IterableIterator<TResult>): TyneqSequence<TResult>;

    // ========================================================================
    // PLUGIN OPERATORS
    // Registered via the plugin API (@operator, createOperator,
    // createGeneratorOperator, @terminal, createTerminalOperator).
    // Requires importing 'tyneq/plugin' (or the plugin barrel)
    // to trigger side-effect registration before using these operators.
    // ========================================================================

    /**
     * Returns a sequence of running aggregates.
     *
     * @remarks
     * The first element of the output is `accumulator(seed, source[0])`. Returns an empty sequence when the source is empty.
     *
     * @throws {ArgumentNullError} When `accumulator` is null or undefined.
     */
    scan<TResult>(seed: TResult, accumulator: (acc: TResult, item: TSource) => TResult): TyneqSequence<TResult>;

    /**
     * Returns the minimum and maximum element in one pass.
     *
     * @remarks
     * Uses the natural `<` / `>` operators when no comparer is provided.
     *
     * @throws {SequenceContainsNoElementsError} When the sequence is empty.
     */
    minMax(comparer?: Comparer<TSource>): MinMaxResult<TSource>;
}

/**
 * A `TyneqSequence` with additional secondary sort keys applied.
 *
 * @remarks
 * Produced by `orderBy` / `orderByDescending`. Chain `thenBy` / `thenByDescending` to add secondary sort criteria.
 *
 * @typeParam TSource - Element type.
 * @group Interfaces
 */
export interface TyneqOrderedSequence<TSource> extends TyneqSequence<TSource> {
    /**
     * Adds an ascending secondary sort key.
     *
     * @throws {ArgumentNullError} When `keySelector` is null or undefined.
     */
    thenBy<TKey>(keySelector: (item: TSource) => TKey, comparer?: Comparer<TKey>): TyneqOrderedSequence<TSource>;

    /**
     * Adds a descending secondary sort key.
     *
     * @throws {ArgumentNullError} When `keySelector` is null or undefined.
     */
    thenByDescending<TKey>(keySelector: (item: TSource) => TKey, comparer?: Comparer<TKey>): TyneqOrderedSequence<TSource>;

    /** Sets the ordering to ascending according to the current sort keys. */
    asc(): TyneqOrderedSequence<TSource>;

    /** Sets the ordering to descending according to the current sort keys. */
    desc(): TyneqOrderedSequence<TSource>;
}

/**
 * A `TyneqSequence` that caches elements as they are iterated.
 *
 * @remarks
 * Produced by `memoize()`. Call `refresh()` to clear the cache and allow re-enumeration from the source.
 *
 * @typeParam TSource - Element type.
 * @group Interfaces
 */
export interface TyneqCachedSequence<TSource> extends TyneqSequence<TSource> {
    /**
     * Clears the element cache and returns a new `TyneqCachedSequence` that will re-enumerate from the source.
     */
    refresh(): TyneqCachedSequence<TSource>;
}

/**
 * Low-level interface for a sequence that supports incremental cache access.
 *
 * @typeParam TSource - Element type.
 * @group Interfaces
 * @internal
 */
export interface CachedEnumerable<TSource> extends Enumerable<TSource> {
    /**
     * Attempts to return the cached element at `index`.
     *
     * @returns `{ has: true, value }` if cached, `{ has: false }` otherwise.
     */
    tryGetAtFromCache(index: number): CacheResult<TSource>;
}

/** Result returned by the cache-lookup method on a memoized sequence. */
export type CacheResult<TSource> = { has: true, value: TSource } | { has: false };

/**
 * Low-level interface for a sequence that can produce a sort comparator.
 *
 * @remarks
 * Implemented by `TyneqOrderedEnumerable`. Consumed by the ordering infrastructure.
 *
 * @typeParam TSource - Element type.
 * @group Interfaces
 * @internal
 */
export interface OrderedEnumerable<TSource> extends Enumerable<TSource> {
    source: TyneqSequence<TSource>;

    /** The parent ordering level, or `null` for the primary sort. */
    parent: Nullable<OrderedEnumerable<TSource>>;

    /**
     * Produces a sorter chain that combines this level with any chained levels.
     *
     * @param next - The child sorter, or `null` if this is the innermost level.
     */
    getSorter(next: Nullable<BaseEnumerableSorter<TSource>>): BaseEnumerableSorter<TSource>;
}

/** Result of `minMax()`, containing both the minimum and maximum elements. */
export type MinMaxResult<T> = {
    readonly min: T;
    readonly max: T;
};

/** A key-value pair used by `toMap()` and `toRecord()` selectors. */
export type KeyValuePair<TKey, TValue> = {
    key: TKey;
    value: TValue;
};


/**
 * Structural interface used by registration machinery to call the protected factory methods
 * on sequence classes without exposing them publicly.
 *
 * The double-cast `(this as unknown as ISequenceFactory<T>)` is intentional:
 * these methods are `protected`, so the cast is the only way to call them from
 * outside the class hierarchy without changing their access modifier.
 *
 * @internal
 */
export interface ISequenceFactory<TSource> {
    readonly [tyneqQueryNode]: Nullable<QueryPlanNode>;
    createEnumerable(factory: { getEnumerator(): unknown }, node?: Nullable<QueryPlanNode>): unknown;
    createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: Comparer<TKey>,
        descending: boolean,
        node?: Nullable<QueryPlanNode>
    ): TyneqOrderedSequence<TSource>;
    createCachedEnumerable(source: TyneqSequence<TSource>, node?: Nullable<QueryPlanNode>): TyneqCachedSequence<TSource>;
}

/** A fully resolved operator entry: metadata plus the prototype-level implementation. */
export interface OperatorEntry {
    readonly metadata: OperatorMetadata;
    readonly impl: BoundMethod<TyneqEnumerableBase<unknown>>;
}

/** Source of an operator implementation, used internally to track where operators come from. */
export type OperatorSource = "internal" | "external";

/** Kind of an operator, used internally to categorize operators. Extends `OperatorCategory` with registry-only kinds. */
export type OperatorKind = OperatorCategory | "cache" | "extension" | "unknown";

/** Constructor type for a sequence class. */
export type SequenceConstructor = abstract new (...args: any[]) => TyneqEnumerableCore<unknown>;