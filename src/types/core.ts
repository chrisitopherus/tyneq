import { BaseEnumerableSorter } from "../core/ordering/BaseEnumerableSorter";
import { Nullable } from "./utility";
import type { IQueryNode } from '../queryplan/IQueryNode';

/**
 * Represents an iterator that traverses a sequence of elements.
 * 
 * @remarks
 * Extends the standard JavaScript `Iterator<T>` interface with optional `return` and `throw` methods.
 * This interface is the foundation for enumerable sequences, providing the mechanism to iterate
 * over elements one at a time.
 * 
 * Unlike one-time-use generators, enumerators created from {@link IEnumeratorFactory}
 * can support re-iteration by creating fresh enumerator instances.
 * 
 * The enumerator follows the standard iterator protocol:
 * - Call `next()` to advance and retrieve the next value
 * - When exhausted, `next()` returns `{ done: true, value: undefined }`
 * - Optional `return()` allows early termination
 * - Optional `throw()` allows injecting errors into iteration
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
     * Signals early termination of iteration.
     * 
     * @param value - Optional value to return.
     * @returns An iterator result indicating completion.
     */
    return?(value?: unknown): IteratorResult<T>;

    /**
     * Throws an exception into the iterator.
     * 
     * @param e - The exception to throw.
     * @returns An iterator result.
     */
    throw?(e?: unknown): IteratorResult<T>;
}

/**
 * Provides a factory method for creating enumerators.
 * 
 * @remarks
 * This interface enables re-iterability by providing a method that creates fresh enumerators
 * on demand. Each call to `getEnumerator()` returns a new enumerator instance starting from
 * the beginning of the sequence.
 * 
 * This pattern solves the limitation of JavaScript generators, which are single-use and
 * cannot be reset or re-iterated after exhaustion.
 * 
 * Implementations must ensure that multiple calls to `getEnumerator()` produce independent
 * enumerators that do not share iteration state.
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
     * Creates a new enumerator that iterates through the sequence.
     * 
     * @returns A new {@link IEnumerator} positioned before the first element.
     */
    getEnumerator(): IEnumerator<T>;
}

/**
 * Represents a re-iterable sequence of elements.
 * 
 * @remarks
 * Combines the standard JavaScript `Iterable<T>` protocol with the {@link IEnumeratorFactory}
 * pattern to provide sequences that can be enumerated multiple times. Each iteration obtains
 * a fresh enumerator via `Symbol.iterator`, ensuring independent iteration state.
 * 
 * This interface serves as the base for {@link ITyneqEnumerable}, which extends it with
 * LINQ-style query operators.
 * 
 * Unlike raw generators or one-time iterators, `IEnumerable<T>` sequences are designed to be:
 * - **Re-iterable**: Can be enumerated multiple times
 * - **Lazy**: Elements are typically computed on-demand during iteration
 * - **Composable**: Can be transformed and combined using query operators
 * 
 * The `Symbol.iterator` method must return a fresh enumerator on each call, allowing
 * constructs like `for...of` loops, spread operators, and `Array.from()` to work correctly
 * across multiple enumerations.
 * 
 * @typeParam T - The type of elements in the sequence.
 * 
 * @example
 * ```typescript
 * const enumerable: IEnumerable<number> = ...
 * 
 * // Can enumerate multiple times
 * for (const item of enumerable) { console.log(item); }
 * for (const item of enumerable) { console.log(item); } // Works again
 * 
 * // Works with standard JavaScript iteration protocols
 * const array = [...enumerable];
 * const set = new Set(enumerable);
 * ```
 * 
 * @see {@link IEnumerator} for the iterator type.
 * @see {@link IEnumeratorFactory} for the factory pattern.
 * @see {@link ITyneqEnumerable} for the full query operator interface.
 *
 * @group Interfaces
 */
export interface IEnumerable<T> extends Iterable<T>, IEnumeratorFactory<T> {
    /**
     * Returns an enumerator that iterates through the sequence.
     * 
     * @remarks
     * This method implements the JavaScript iterator protocol (`Symbol.iterator`).
     * Each call must return a fresh enumerator instance, enabling re-iteration.
     * 
     * Equivalent to `GetEnumerator()` in C# LINQ.
     * 
     * @returns A new {@link IEnumerator} positioned before the first element.
     */
    [Symbol.iterator](): IEnumerator<T>;
}

/**
 * A factory function that creates a new enumerator.
 * 
 * @remarks
 * This function type provides a lightweight alternative to {@link IEnumeratorFactory}
 * for creating re-iterable sequences. Each invocation produces a fresh enumerator
 * starting from the beginning of the sequence.
 * 
 * This pattern is essential for enabling re-iterability in the library, as JavaScript
 * generators are single-use and cannot be reset after exhaustion.
 * 
 * Functions of this type must be pure with respect to iteration state—each call
 * should produce an independent enumerator with no shared mutable state.
 * 
 * @typeParam T - The type of elements produced by the enumerator.
 * 
 * @example
 * ```typescript
 * const factory: IteratorFactory<number> = () => {
 *     let i = 0;
 *     return {
 *         next: () => i < 5 
 *             ? { value: i++, done: false }
 *             : { value: undefined, done: true }
 *     };
 * };
 * 
 * // Create independent enumerators
 * const enum1 = factory();
 * const enum2 = factory();
 * ```
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
 * This type represents a higher-order function used internally to construct
 * specific {@link ITyneqEnumerable} implementations from iterator factories.
 * It enables query operators to create sequences of the same concrete type
 * as the source sequence, preserving type-specific behavior and extensions.
 * 
 * This pattern supports derived enumerable types (like ordered enumerables)
 * that need to preserve their specific type through query operator chains.
 * 
 * @typeParam TSource - The element type of the sequence.
 * @typeParam TEnumerable - The specific enumerable implementation type.
 * 
 * @param iteratorFactory - A factory function that creates enumerators for the sequence.
 * @returns A new enumerable instance of type `TEnumerable`.
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
 * This is the primary interface for working with enumerable sequences in this library.
 * It extends {@link IEnumerable} with a comprehensive set of query operators inspired by
 * .NET LINQ, enabling functional composition of data transformations.
 * 
 * ## Operator Categories
 * 
 * ### Terminal Operators
 * Execute the query and return a single value or materialize the sequence.
 * Examples: `toArray()`, `count()`, `first()`, `any()`, `sum()`.
 * These operators enumerate the sequence and do not return another enumerable.
 * 
 * ### Streaming Operators  
 * Transform or filter elements one-at-a-time as they flow through.
 * Examples: `select()`, `where()`, `take()`, `skip()`.
 * These operators are lazy and do not enumerate until a terminal operator is applied.
 * 
 * ### Buffering Operators
 * Must buffer or cache elements before producing results.
 * Examples: `distinct()`, `orderBy()`, `reverse()`, `groupBy()`.
 * These operators enumerate part or all of the source sequence during execution.
 * 
 * ## Laziness and Deferred Execution
 * 
 * Most query operators use deferred execution—they do not process elements until
 * the sequence is enumerated (typically by a terminal operator or iteration).
 * This allows:
 * - Efficient query composition without intermediate collections
 * - Processing infinite or very large sequences
 * - Short-circuiting when only partial results are needed
 * 
 * ## Re-iterability
 * 
 * Sequences implementing this interface are re-iterable. Each enumeration creates
 * a fresh iterator and re-executes the query pipeline. For operators that perform
 * side effects (like `tap()`), these effects will occur on every enumeration.
 * 
 * ## Performance Characteristics
 * 
 * - **Streaming operators**: O(1) space overhead, O(n) time when enumerated
 * - **Buffering operators**: O(n) space, O(n) or O(n log n) time depending on operation
 * - **Terminal operators**: Varies by operation; documented per method in implementations
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
     * The query plan node representing this step in the operator chain.
     *
     * @remarks
     * Each operator that produces a new `ITyneqEnumerable` attaches a `QueryNode`
     * describing itself (name, args, category) and linking to the previous node via
     * `queryNode.source`. The root node (from `Tyneq.from`, `Tyneq.range`, etc.)
     * has `source === null`.
     *
     * Use this property with an {@link IQueryPlanVisitor} to inspect, print, or
     * transform the query plan without executing the sequence:
     *
     * ```ts
     * const seq = Tyneq.from([1, 2, 3]).where(x => x > 0).select(x => x * 2);
     * console.log(seq.queryNode?.operatorName); // 'select'
     * console.log(seq.queryNode?.source?.operatorName); // 'where'
     * ```
     *
     * `null` is returned for sequences created without query-plan support (e.g.,
     * sequences produced by `pipe()` or sequences constructed directly without
     * passing a node to `createEnumerable`).
     */
    readonly queryNode: IQueryNode | null;

    // ========================================================================
    // TERMINAL OPERATORS
    // These operators execute the query and return a concrete value.
    // ========================================================================

    /**
     * Determines whether any element satisfies a condition.
     * 
     * @param predicate - Function that returns `true` if the element matches.
     * @returns `true` if at least one element matches the condition; otherwise, `false`.
     */
    any(predicate: (item: TSource) => boolean): boolean;

    /**
     * Determines whether all elements satisfy a condition.
     * 
     * @param predicate - Function that returns `true` if the element matches.
     * @returns `true` if all elements match (or sequence is empty); otherwise, `false`.
     */
    all(predicate: (item: TSource) => boolean): boolean;

    /**
     * Determines whether the sequence contains a specific value.
     * 
     * @param value - The value to search for.
     * @returns `true` if the value is found; otherwise, `false`.
     */
    contains(value: TSource): boolean;

    /**
     * Returns the number of elements in the sequence.
     * 
     * @returns The number of elements in the sequence.
     */
    count(): number;

    /**
     * Returns the number of elements that satisfy a condition.
     *
     * @param predicate - Function that returns `true` when an element should be counted.
     * @returns The number of elements that satisfy the predicate.
     */
    countBy(predicate: (item: TSource) => boolean): number;

    /**
     * Forces immediate evaluation by fully consuming the sequence.
     */
    consume(): void;

    /**
     * Determines whether the sequence contains no elements.
     *
     * @returns `true` if the sequence is empty; otherwise, `false`.
     */
    isNullOrEmpty(): boolean;

    /**
     * Returns the sequence or a default sequence containing a single element if empty.
     * 
     * @param defaultValue - The value to return if the sequence is empty.
     * @returns The original sequence or a sequence containing only `defaultValue`.
     */
    defaultIfEmpty(defaultValue: TSource): ITyneqEnumerable<TSource>;

    /**
     * Returns the element at a specified index.
     * 
     * @param index - The zero-based index of the element to retrieve.
     * @returns The element at the specified index.
     * @throws {InvalidOperationError} when the index is out of range.
     */
    elementAt(index: number): TSource;

    /**
     * Returns the element at a specified index, or a default value if the index is out of range.
     * 
     * @param index - The zero-based index of the element to retrieve.
     * @param defaultValue - The value to return if the index is out of range.
     * @returns The element at the specified index, or `defaultValue` if the index is negative or beyond the sequence length.
     */
    elementAtOrDefault(index: number, defaultValue: TSource): TSource;

    /**
     * Returns the first element that satisfies a condition.
     * 
     * @param predicate - Function that returns `true` if the element matches.
     * @returns The first matching element.
     * @throws {InvalidOperationError} when no element matches the condition.
     */
    first(predicate: (item: TSource) => boolean): TSource;

    /**
     * Returns the first element that satisfies a condition, or a default value if none found.
     * 
     * @param predicate - Function that returns `true` if the element matches.
     * @param defaultValue - The value to return if no element matches.
     * @returns The first matching element, or `defaultValue` if none found.
     */
    firstOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource;

    /**
     * Returns the zero-based index of the first element that satisfies a condition.
     * 
     * @param predicate - Function to test each element. Cannot be null or undefined.
     * @param startIndex - The zero-based index at which to begin searching. Defaults to 0.
     * @returns The zero-based index of the first matching element, or -1 if not found.
     * @throws {ArgumentNullError} when `predicate` is null.
     * @throws {ArgumentError} when `predicate` is undefined.
     */
    indexOf(predicate: (item: TSource) => boolean, startIndex?: number): number;

    /**
     * Returns the last element that satisfies a condition.
     * 
     * @param predicate - Function that returns `true` if the element matches.
     * @returns The last matching element.
     * @throws {InvalidOperationError} when no element matches the condition.
     */
    last(predicate: (item: TSource) => boolean): TSource;

    /**
     * Returns the last element that satisfies a condition, or a default value if none found.
     * 
     * @param predicate - Function to test each element. Cannot be null or undefined.
     * @param defaultValue - The value to return if no element satisfies the condition.
     * @returns The last matching element, or `defaultValue` if none found.
     * @throws {ArgumentNullError} when `predicate` is null.
     * @throws {ArgumentError} when `predicate` is undefined.
     */
    lastOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource;

    /**
     * Returns the maximum element in the sequence.
     * 
     * @param comparer - Optional comparison function. If omitted, uses default comparison.
     * @returns The maximum element.
     * @throws {InvalidOperationError} when the sequence is empty.
     */
    max(comparer?: (a: TSource, b: TSource) => number): TSource;

    /**
     * Returns the element with the maximum key value.
     * 
     * @typeParam TKey - The type of key to compare.
     * @param keySelector - A function to extract the comparison key.
     * @param comparer - Optional comparison function for keys. If omitted, uses default comparison.
     * @returns The element with the maximum key value.
     * @throws When the sequence is empty.
     */
    maxBy<TKey>(keySelector: (element: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): TSource;

    /**
     * Returns the minimum element in the sequence.
     * 
     * @param comparer - Optional comparison function. If omitted, uses default comparison.
     * @returns The minimum element.
     * @throws {InvalidOperationError} when the sequence is empty.
     */
    min(comparer?: (a: TSource, b: TSource) => number): TSource;

    /**
     * Returns the element with the minimum key value.
     * 
     * @typeParam TKey - The type of key to compare.
     * @param keySelector - A function to extract the comparison key.
     * @param comparer - Optional comparison function for keys. If omitted, uses default comparison.
     * @returns The element with the minimum key value.
     * @throws When the sequence is empty.
     */
    minBy<TKey>(keySelector: (element: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): TSource;

    /**
     * Determines whether two sequences are equal by comparing elements pairwise.
     * 
     * @param other - The sequence to compare to.
     * @param equalityComparer - Optional equality comparison function. If omitted, uses default equality.
     * @returns `true` if sequences have the same length and corresponding elements are equal; otherwise, `false`.
     */
    sequenceEqual(other: Iterable<TSource>, equalityComparer?: (a: TSource, b: TSource) => boolean): boolean;

    /**
     * Returns the only element that satisfies a condition.
     * 
     * @param predicate - A function to test each element.
     * @returns The single element that satisfies the condition.
     * @throws When no elements satisfy the condition or more than one element satisfies it.
     */
    single(predicate: (item: TSource) => boolean): TSource;

    /**
     * Returns the only element that satisfies a condition, or a default value.
     * 
     * @param predicate - A function to test each element.
     * @param defaultValue - The value to return if no element satisfies the condition.
     * @returns The single matching element, or `defaultValue` if none found.
     * @throws When more than one element satisfies the condition.
     */
    singleOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource;

    /**
     * Determines whether the sequence starts with the elements of another sequence.
     * 
     * @param sequence - The sequence to compare.
     * @returns `true` if this sequence starts with all elements of the specified sequence; otherwise, `false`.
     */
    startsWith(sequence: Iterable<TSource>): boolean;

    /**
     * Computes the sum of values obtained by invoking a selector on each element.
     * 
     * @param selector - Function to extract a numeric value from each element. Cannot be null or undefined.
     * @returns The sum of all selected values. Returns 0 for empty sequences.
     * @throws {ArgumentNullError} when `selector` is null.
     * @throws {ArgumentError} when `selector` is undefined.
     */
    sum(selector: (item: TSource) => number): number;

    /**
     * Materializes the sequence into an array.
     * 
     * @returns A new array containing all elements from the sequence.
     */
    toArray(): TSource[];

    /**
     * Creates a Map from the sequence using a key-value selector.
     * 
     * @typeParam TKey - The type of keys in the resulting map.
     * @typeParam TValue - The type of values in the resulting map.
     * @param selector - A function that returns a key-value pair for each element.
     * @returns A Map containing the selected key-value pairs.
     */
    toMap<TKey, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>): Map<TKey, TValue>;

    /**
     * Creates a record object from the sequence using a key-value selector.
     * 
     * @typeParam TKey - The type of keys (must be string, number, or symbol).
     * @typeParam TValue - The type of values in the resulting record.
     * @param selector - A function that returns a key-value pair for each element.
     * @returns A record object containing the selected key-value pairs.
     */
    toRecord<TKey extends string | number | symbol, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>): Record<TKey, TValue>;

    /**
     * Creates a Set from the sequence.
     *
     * @returns A Set containing all unique elements from the sequence.
     */
    toSet(): Set<TSource>;

    /**
     * Computes the arithmetic mean of numeric values extracted from each element.
     *
     * @param selector - Function to extract a numeric value from each element. Cannot be null or undefined.
     * @returns The average of all selected values. Returns 0 for empty sequences.
     * @throws {ArgumentNullError} when `selector` is null.
     * @throws {ArgumentError} when `selector` is undefined.
     */
    average(selector: (item: TSource) => number): number;

    /**
     * Applies an accumulator function over a sequence, returning a final result.
     *
     * @typeParam UAccumulate - The type of the accumulator value.
     * @typeParam VResult - The type of the final result.
     * @param seed - Initial accumulator value.
     * @param func - Function applied to each element with the current accumulator. Cannot be null or undefined.
     * @param resultSelector - Function to transform the final accumulator value. Cannot be null or undefined.
     * @returns The final result after applying the accumulator to all elements.
     * @throws {ArgumentNullError} when `func` or `resultSelector` is null.
     * @throws {ArgumentError} when `func` or `resultSelector` is undefined.
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
     * Appends a single element to the end of the sequence.
     * 
     * @param item - The element to append.
     * @returns A new sequence with the appended element.
     */
    append(item: TSource): ITyneqEnumerable<TSource>;

    /**
     * Splits the sequence into chunks of a specified size.
     * 
     * @param size - The maximum size of each chunk.
     * @returns A sequence of arrays, where each array contains up to `size` elements.
     */
    chunk(size: number): ITyneqEnumerable<TSource[]>;

    /**
     * Concatenates two sequences.
     * 
     * @param other - The sequence to concatenate to the end of this sequence.
     * @returns A sequence containing all elements from both sequences.
     */
    concat(other: Iterable<TSource>): ITyneqEnumerable<TSource>;

    /**
     * Returns adjacent element pairs as tuples of [previous, current].
     *
     * @returns A sequence of tuples from adjacent elements.
     */
    pairwise(): ITyneqEnumerable<[TSource, TSource]>;

    /**
     * Prepends a single element to the beginning of the sequence.
     * 
     * @param item - The element to prepend.
     * @returns A new sequence with the prepended element.
     */
    prepend(item: TSource): ITyneqEnumerable<TSource>;

    /**
     * Replaces every element in the sequence with a constant value, preserving cardinality.
     *
     * @typeParam TValue - The type of the replacement value.
     * @param value - The value to yield for each source element.
     * @returns A new sequence of the same length, with every element replaced by `value`.
     */
    populate<TValue>(value: TValue): ITyneqEnumerable<TValue>;

    /**
     * Projects each element into a new form using a transform function.
     * 
     * @typeParam TResult - The type of elements in the result sequence.
     * @param selector - A function to apply to each element to transform it.
     * @returns A new sequence containing the transformed elements.
     * @throws {ArgumentNullError} when `selector` is null.
     */
    select<TResult>(selector: (item: TSource) => TResult): ITyneqEnumerable<TResult>;

    /**
     * Projects each element to a sequence and flattens the resulting sequences into one.
     * 
     * @typeParam TResult - The type of elements in the result sequence.
     * @param selector - A function to transform each source element into an enumerable sequence. Cannot be null or undefined.
     * @returns A sequence containing all elements from all projected inner sequences, flattened into a single sequence.
     * @throws {ArgumentNullError} when `selector` is null.
     * @throws {ArgumentError} when `selector` is undefined.
     */
    selectMany<TResult>(selector: (item: TSource) => Iterable<TResult>): ITyneqEnumerable<TResult>;

    /**
     * Bypasses a specified number of elements and returns the remaining elements.
     * 
     * @param count - The number of elements to skip. Can be 0 or negative (skips nothing).
     * @returns A new sequence containing elements after the specified position.
     */
    skip(count: number): ITyneqEnumerable<TSource>;

    /**
     * Bypasses a specified number of elements from the end and returns the remaining elements.
     * 
     * @param count - The number of elements to skip from the end. Can be 0 or negative (skips nothing).
     * @returns A sequence containing all elements except the last `count` elements.
     */
    skipLast(count: number): ITyneqEnumerable<TSource>;

    /**
     * Bypasses elements while a condition is true and returns the remaining elements.
     * 
     * @param predicate - A function to test each element. Cannot be null or undefined.
     * @returns A sequence containing elements starting from the first element that does not satisfy the condition, plus all subsequent elements.
     * @throws {ArgumentNullError} when `predicate` is null.
     * @throws {ArgumentError} when `predicate` is undefined.
     */
    skipWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource>;

    /**
     * Splits the sequence into sub-sequences based on a predicate.
     * 
     * @param splitOn - A function that identifies elements to use as split points. Cannot be null or undefined. Elements where this returns true are excluded.
     * @returns A sequence of arrays, where each array contains consecutive elements between split points.
     * @throws {ArgumentNullError} when `splitOn` is null.
     * @throws {ArgumentError} when `splitOn` is undefined.
     */
    split(splitOn: (item: TSource) => boolean): ITyneqEnumerable<TSource[]>;

    /**
     * Returns a specified number of contiguous elements from the start of a sequence.
     * 
     * @param count - The number of elements to return. Can be 0 or negative (returns empty).
     * @returns A new sequence containing the first `count` elements.
     */
    take(count: number): ITyneqEnumerable<TSource>;

    /**
     * Returns elements while a condition is true and skips the remaining elements.
     * 
     * @param predicate - A function to test each element. Cannot be null or undefined.
     * @returns A sequence containing elements starting from the beginning while the predicate returns true, stopping at the first element that doesn't satisfy the condition.
     * @throws {ArgumentNullError} when `predicate` is null.
     * @throws {ArgumentError} when `predicate` is undefined.
     */
    takeWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource>;

    /**
     * Performs a side effect on each element without modifying the sequence.
     * 
     * @param action - A function to invoke on each element (may perform side effects).
     * @returns The original sequence, unchanged.
     * @throws {ArgumentNullError} when `action` is null.
     */
    tap(action: (item: TSource) => void): ITyneqEnumerable<TSource>;

    /**
     * Conditionally performs a side effect on each element without modifying the sequence.
     * 
     * @param action - A function to invoke on each element if the condition is met.
     * @param predicate - A function that returns `true` if the action should execute, `false` otherwise.
     * @returns The original sequence, unchanged.
     * @throws {ArgumentNullError} when `action` or `predicate` is null.
     */
    tapIf(action: (item: TSource) => void, predicate: () => boolean): ITyneqEnumerable<TSource>;

    /**
     * Returns every `count`-th element, discarding the elements in between.
     *
     * @param count - Sampling interval. Must be a positive integer. A value of 1 returns every element.
     * @returns A new sequence containing only elements at positions that are multiples of `count`.
     */
    throttle(count: number): ITyneqEnumerable<TSource>;

    /**
     * Filters the sequence based on a predicate function.
     * 
     * @param predicate - A function to test each element for a condition. Returns `true` to include the element, `false` to exclude it.
     * @returns A new sequence containing only elements that satisfy the condition.
     * @throws {ArgumentNullError} when `predicate` is null.
     */
    where(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource>;

    /**
     * Pairs elements from two sequences using a selector function.
     * 
     * @typeParam TOther - The type of elements in the second sequence.
     * @typeParam TResult - The type of elements in the result sequence.
     * @param other - The second sequence to zip with.
     * @param selector - A function that combines paired elements.
     * @returns A sequence of combined elements. Stops when either sequence is exhausted.
     */
    zip<TOther, TResult>(other: Iterable<TOther>, selector: (first: TSource, second: TOther) => TResult): ITyneqEnumerable<TResult>;

    // ========================================================================
    // BUFFERING OPERATORS
    // These operators must buffer or cache elements before producing results.
    // They enumerate part or all of the source during execution.
    // ========================================================================

    /**
     * Returns distinct elements from the sequence.
     * 
     * @returns A sequence containing only unique elements, preserving order of first occurrence.
     */
    distinct(): ITyneqEnumerable<TSource>;

    /**
     * Returns distinct elements from the sequence based on a key selector.
     * 
     * @typeParam TKey - The type of key used for uniqueness comparison.
     * @param keySelector - A function to extract comparison keys from elements. Cannot be null or undefined. Elements with equal keys are considered duplicates.
     * @returns A sequence containing elements with unique keys, in order of first occurrence.
     * @throws {ArgumentNullError} when `keySelector` is null.
     * @throws {ArgumentError} when `keySelector` is undefined.
     */
    distinctBy<TKey>(keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource>;

    /**
     * Produces the set difference of two sequences.
     * 
     * @param excludedValues - A sequence whose elements to exclude from the result. Cannot be null.
     * @returns A sequence containing distinct elements from this sequence that do not appear in `excludedValues`.
     */
    except(excludedValues: Iterable<TSource>): ITyneqEnumerable<TSource>;

    /**
     * Produces the set difference of two sequences based on a key selector.
     * 
     * @typeParam TKey - The type of key used for comparison.
     * @param excludedKeys - A sequence of keys to exclude. Cannot be null or undefined.
     * @param keySelector - A function to extract keys from elements of this sequence. Cannot be null or undefined.
     * @returns A sequence containing elements whose extracted keys do not appear in `excludedKeys`.
     */
    exceptBy<TKey>(excludedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource>;

    /**
     * Groups elements by key and projects the results.
     * 
     * @typeParam TKey - The type of grouping key.
     * @typeParam TValue - The type of projected element values.
     * @typeParam TResult - The type of result elements (returned by resultSelector).
     * @param keySelector - Function to extract the grouping key from each element. Cannot be null or undefined.
     * @param valueSelector - Function to project each element before adding to its group. Cannot be null or undefined.
     * @param resultSelector - Function called once per group. Receives the key and an enumerable of values for that group. Returns the result for the group. Cannot be null or undefined.
     * @returns A sequence of result elements, one per group.
     * @throws {ArgumentNullError} when any parameter is null.
     * @throws {ArgumentError} when any parameter is undefined.
     */
    groupBy<TKey, TValue, TResult>(
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: ITyneqEnumerable<TValue>) => TResult
    ): ITyneqEnumerable<TResult>;

    /**
     * Correlates elements of two sequences based on key equality and groups the results.
     * 
     * @typeParam TInner - The type of elements in the inner sequence.
     * @typeParam TKey - The type of key used for correlation.
     * @typeParam TResult - The type of result elements.
     * @param inner - The inner sequence to join.
     * @param outerKeySelector - A function to extract keys from outer elements.
     * @param innerKeySelector - A function to extract keys from inner elements.
     * @param resultSelector - A function to create a result from an outer element and its matching inner elements.
     * @returns A sequence of join results where each outer element is paired with all matching inner elements.
     */
    groupJoin<TInner, TKey, TResult>(
        inner: Iterable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, group: ITyneqEnumerable<TInner>) => TResult
    ): ITyneqEnumerable<TResult>;

    /**
     * Produces the set intersection of two sequences.
     * 
     * @param intersectedValues - A sequence to intersect with this sequence. Cannot be null.
     * @returns A sequence containing distinct elements that appear in both sequences.
     */
    intersect(intersectedValues: Iterable<TSource>): ITyneqEnumerable<TSource>;

    /**
     * Produces the set intersection of two sequences based on a key selector.
     * 
     * @typeParam TKey - The type of key used for intersection.
     * @param intersectedKeys - A sequence of keys to intersect with. Cannot be null or undefined.
     * @param keySelector - A function to extract keys from elements of this sequence. Cannot be null or undefined.
     * @returns A sequence containing elements whose keys appear in `intersectedKeys`.
     */
    intersectBy<TKey>(intersectedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource>;

    /**
     * Correlates elements of two sequences based on matching keys.
     * 
     * @typeParam TInner - The type of elements in the inner (right) sequence.
     * @typeParam TKey - The type of key used for matching.
     * @typeParam TResult - The type of result elements.
     * @param inner - The inner sequence to join with. Cannot be null.
     * @param outerKeySelector - Function to extract keys from this sequence elements. Cannot be null or undefined.
     * @param innerKeySelector - Function to extract keys from inner sequence elements. Cannot be null or undefined.
     * @param resultSelector - Function called for each outer-inner match. Returns the result. Cannot be null or undefined.
     * @returns A sequence of joined results. Only includes pairs where both outer element and at least one inner element with matching keys exist.
     * @throws {ArgumentNullError} when any function parameter is null.
     * @throws {ArgumentError} when any function parameter is undefined.
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
     * This method uses deferred execution. The source sequence is not enumerated until the
     * returned sequence is iterated.
     *
     * Elements are cached incrementally: only the elements that have been iterated so far are held
     * in memory. Subsequent enumerations reuse the cached values for the portion already evaluated
     * and continue from the source for the remainder.
     *
    * @returns A cached enumerable that caches source elements on first access.
    * Use `refresh()` on the returned value to invalidate the cache.
     */
    memoize(): ITyneqCachedEnumerable<TSource>;

    /**
     * Sorts elements in ascending order according to a key.
     * 
     * @typeParam TKey - The type of key used for sorting.
     * @param keySelector - Function to extract the sort key from each element. Cannot be null or undefined.
     * @param comparer - Optional comparison function returning negative (a < b), zero (a === b), or positive (a > b). If omitted, uses default comparison.
     * @returns An ordered sequence sorted by the specified key in ascending order. Can be further sorted with `thenBy()` or `thenByDescending()`.
     * @throws {ArgumentNullError} when `keySelector` is null.
     * @throws {ArgumentError} when `keySelector` is undefined.
     */
    orderBy<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: (a: TKey, b: TKey) => number
    ): ITyneqOrderedEnumerable<TSource>;

    /**
     * Sorts elements in descending order according to a key.
     * 
     * @typeParam TKey - The type of key used for sorting.
     * @param keySelector - Function to extract the sort key from each element. Cannot be null or undefined.
     * @param comparer - Optional comparison function returning negative (a < b), zero (a === b), or positive (a > b). If omitted, uses default comparison.
     * @returns An ordered sequence sorted by the specified key in descending order. Can be further sorted with `thenBy()` or `thenByDescending()`.
     * @throws {ArgumentNullError} when `keySelector` is null.
     * @throws {ArgumentError} when `keySelector` is undefined.
     */
    orderByDescending<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: (a: TKey, b: TKey) => number
    ): ITyneqOrderedEnumerable<TSource>;

    /**
     * Inverts the order of elements in the sequence.
     * 
     * @returns A new sequence with elements in reverse order.
     */
    reverse(): ITyneqEnumerable<TSource>;

    /**
     * Returns the elements in a random order.
     * 
     * @returns A new sequence containing all elements in a randomized order.
     */
    shuffle(): ITyneqEnumerable<TSource>;

    /**
     * Inserts another sequence using an index counted from the end.
     *
     * @param index - Back index where 0 represents the last position.
     * @param other - Sequence to insert.
     * @returns A sequence with `other` inserted from the end-based index.
     */
    backsert(index: number, other: Iterable<TSource>): ITyneqEnumerable<TSource>;

    /**
     * Produces the set union of two sequences.
     * 
     * @param otherValues - The second sequence to union with this sequence. Cannot be null.
     * @returns A sequence containing unique elements from both sequences.
     */
    union(otherValues: Iterable<TSource>): ITyneqEnumerable<TSource>;

    /**
     * Produces the set union of two sequences based on a key selector.
     * 
     * @typeParam TKey - The type of key used for equality comparison.
     * @param otherValues - The second sequence to union with this sequence. Cannot be null.
     * @param keySelector - A function to extract keys from elements. Cannot be null or undefined.
     * @returns A sequence containing elements with unique keys from both sequences.
     */
    unionBy<TKey>(otherValues: Iterable<TSource>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource>;

    // ========================================================================
    // EXTENSION / PLUGIN
    // Advanced extensibility for custom operators.
    // ========================================================================

    /**
     * Allows custom transformation by providing a factory function.
     * 
     * @typeParam TResult - The type of elements in the result sequence.
     * @param factory - A function that receives the source and returns an enumerator.
     * @returns A new queryable sequence of the transformed elements.
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
     * Unlike `reduce()`/`aggregate()`, `scan()` yields every intermediate value
     * rather than only the final result, making it useful for running totals,
     * moving-window computations, and state-machine outputs.
     *
     * The seed is **not** yielded; the first emitted value is `accumulator(seed, element[0])`.
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
     * Only complete windows are emitted; trailing elements that do not fill a
     * full window are discarded. The sequence must have at least `size` elements
     * for any output to be produced.
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
     * The delimiter is only inserted **between** existing elements — it is never
     * prepended or appended. An empty or single-element sequence passes through
     * unchanged (no delimiter is inserted).
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
     * Returns both the minimum and maximum elements in a **single** enumeration pass.
     *
     * @remarks
     * Calling `min()` and `max()` separately requires two full passes over the source
     * sequence. `minMax()` fuses them into one O(n) pass with O(1) space overhead,
     * which is beneficial for large sequences or expensive iterators.
     *
     * @param comparer - Optional comparison function. If omitted, uses default
     *   JavaScript relational comparison (works for numbers and strings).
     * @returns An object containing both `min` and `max` elements.
     * @throws {SequenceContainsNoElementsError} when the sequence is empty.
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
 * Returned by `orderBy()` and `orderByDescending()` operators, this interface extends
 * {@link ITyneqEnumerable} with `thenBy()` and `thenByDescending()` methods for
 * multi-level sorting.
 * 
 * Ordered enumerables maintain a chain of sort criteria that are applied in sequence
 * when the sequence is enumerated. Each `thenBy` operation adds a secondary sort
 * criterion without replacing the primary ordering.
 * 
 * The sort is stable—elements that compare as equal maintain their relative order
 * from the source sequence.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @see {@link ITyneqEnumerable} for the base enumerable interface.
 * See internal ordered-enumerable infrastructure for implementation details.
 *
 * @group Interfaces
 */
export interface ITyneqOrderedEnumerable<TSource> extends ITyneqEnumerable<TSource> {
    /**
     * Performs a subsequent ordering in ascending order.
     * 
     * @typeParam TKey - The type of the sort key.
     * @param keySelector - A function to extract the sort key from each element. Cannot be null or undefined.
     * @param comparer - Optional comparison function. If omitted, uses default comparison.
     * @returns A new ordered enumerable with the additional sort criterion.
     */
    thenBy<TKey>(keySelector: (item: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): ITyneqOrderedEnumerable<TSource>;

    /**
     * Performs a subsequent ordering in descending order.
     * 
     * @typeParam TKey - The type of the sort key.
     * @param keySelector - A function to extract the sort key from each element. Cannot be null or undefined.
     * @param comparer - Optional comparison function. If omitted, uses default comparison.
     * @returns A new ordered enumerable with the additional descending sort criterion.
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
 * Internal interface for ordered enumerable implementations.
 * 
 * @remarks
 * This interface defines the internal contract for implementing ordered sequences.
 * It maintains a reference to the source sequence, an optional parent ordering
 * for chained `thenBy` operations, and a method to construct the composite sorter.
 * 
 * Implementations use this interface to build a chain of {@link BaseEnumerableSorter}
 * instances that collectively define the multi-level sort behavior.
 * 
 * This is an internal interface not typically used directly by library consumers.
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
    /**
     * The source sequence being ordered.
     */
    source: ITyneqEnumerable<TSource>;

    /**
     * The parent ordering in a multi-level sort chain, or null for primary ordering.
     */
    parent: Nullable<IOrderedEnumerable<TSource>>;

    /**
     * Creates a sorter that applies this ordering and all parent orderings.
     * 
     * @param next - The next sorter in the chain, or null if this is the last.
     * @returns A composite sorter implementing the full sort behavior.
     */
    getSorter(next: Nullable<BaseEnumerableSorter<TSource>>): BaseEnumerableSorter<TSource>;
}



/**
 * The result of a `minMax()` operation: both the minimum and maximum element.
 *
 * @remarks
 * Returned by the `minMax()` extension operator, which computes both values in
 * a single O(n) pass instead of requiring two separate `min()` / `max()` calls.
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
 * Used by operators like `toMap()` and `toRecord()` to specify both the key and value
 * when materializing sequences into dictionaries or records.
 * 
 * This type provides a simple, strongly-typed structure for returning paired data
 * from selector functions.
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
    /**
     * The key of the pair.
     */
    key: TKey;

    /**
     * The value of the pair.
     */
    value: TValue;
};