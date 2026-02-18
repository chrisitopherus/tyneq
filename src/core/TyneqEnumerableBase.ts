import { DistinctOperatorEnumerable } from "../operators/buffer/distinct";
import { DistinctByOperatorEnumerable } from "../operators/buffer/distinctBy";
import { ExceptOperatorEnumerable } from "../operators/buffer/except";
import { ExceptByOperatorEnumerable } from "../operators/buffer/exceptBy";
import { GroupByOperatorEnumerable } from "../operators/buffer/groupBy";
import { GroupJoinOperatorEnumerable } from "../operators/buffer/groupJoin";
import { IntersectOperatorEnumerable } from "../operators/buffer/intersect";
import { IntersectByOperatorEnumerable } from "../operators/buffer/intersectBy";
import { JoinOperatorEnumerable } from "../operators/buffer/join";
import { ReverseOperatorEnumerable } from "../operators/buffer/reverse";
import { ShuffleOperatorEnumerable } from "../operators/buffer/shuffle";
import { UnionOperatorEnumerable } from "../operators/buffer/union";
import { UnionByOperatorEnumerable } from "../operators/buffer/unionBy";
import { AppendOperatorEnumerable } from "../operators/streaming/append";
import { ChunkOperatorEnumerable } from "../operators/streaming/chunk";
import { ConcatOperatorEnumerable } from "../operators/streaming/concat";
import { PrependOperatorEnumerable } from "../operators/streaming/prepend";
import { SelectOperatorEnumerable } from "../operators/streaming/select";
import { SelectManyOperatorEnumerable } from "../operators/streaming/selectMany";
import { SkipOperatorEnumerable } from "../operators/streaming/skip";
import { SkipLastOperatorEnumerable } from "../operators/streaming/skipLast";
import { SkipWhileOperatorEnumerable } from "../operators/streaming/skipWhile";
import { SplitOperatorEnumerable } from "../operators/streaming/split";
import { TakeOperatorEnumerable } from "../operators/streaming/take";
import { TakeWhileOperatorEnumerable } from "../operators/streaming/takeWhile";
import { TapOperatorEnumerable } from "../operators/streaming/tap";
import { TapIfOperatorEnumerable } from "../operators/streaming/tapIf";
import { ThrottleOperatorEnumerable } from "../operators/streaming/throttle";
import { WhereOperatorEnumerable } from "../operators/streaming/where";
import { ZipOperatorEnumerable } from "../operators/streaming/zip";
import { AllOperator } from "../operators/terminal/all";
import { AnyOperator } from "../operators/terminal/any";
import { ContainsOperator } from "../operators/terminal/contains";
import { CountOperator } from "../operators/terminal/count";
import { DefaultIfEmptyOperator } from "../operators/terminal/defaultIfEmpty";
import { ElementAtOperator } from "../operators/terminal/elementAt";
import { ElementAtOrDefaultOperator } from "../operators/terminal/elementAtOrDefault";
import { FirstOperator } from "../operators/terminal/first";
import { FirstOrDefaultOperator } from "../operators/terminal/firstOrDefault";
import { IndexOfOperator } from "../operators/terminal/indexOf";
import { LastOperator } from "../operators/terminal/last";
import { LastOrDefaultOperator } from "../operators/terminal/lastOrDefault";
import { MaxOperator } from "../operators/terminal/max";
import { MaxByOperator } from "../operators/terminal/maxBy";
import { MinOperator } from "../operators/terminal/min";
import { MinByOperator } from "../operators/terminal/minBy";
import { SequenceEqualOperator } from "../operators/terminal/sequenceEqual";
import { SingleOperator } from "../operators/terminal/single";
import { SingleOrDefaultOperator } from "../operators/terminal/singleOrDefault";
import { StartsWithOperator } from "../operators/terminal/startsWith";
import { SumOperator } from "../operators/terminal/sum";
import { ToArrayOperator } from "../operators/terminal/toArray";
import { ToMapOperator } from "../operators/terminal/toMap";
import { ToRecordOperator } from "../operators/terminal/toRecord";
import { ToSetOperator } from "../operators/terminal/toSet";
import { IEnumerable, IEnumerator, IEnumeratorFactory, IteratorFactory, ITyneqCachedEnumerable, ITyneqEnumerable, ITyneqOrderedEnumerable, KeyValuePair } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";

/**
 * Abstract base class providing LINQ-style query operators for enumerable sequences.
 * 
 * @remarks
 * `TyneqEnumerableBase<TSource>` defines the complete API surface for querying and
 * transforming sequences. It implements {@link ITyneqEnumerable} and provides three
 * categories of operators:
 * 
 * ## Operator Categories
 * 
 * - **Terminal Operators**: Execute the query and return a result (value, array, boolean, etc.)
 *   - Examples: `toArray()`, `count()`, `first()`, `sum()`, `any()`
 *   - Trigger immediate evaluation of the entire chain
 *   - Cannot be chained further (return non-enumerable values)
 * 
 * - **Streaming Operators**: Transform elements one-at-a-time without buffering
 *   - Examples: `select()`, `where()`, `take()`, `skip()`, `chunk()`
 *   - Maintain O(1) memory overhead (no internal buffer)
 *   - Preserve lazy evaluation; process elements on-demand during iteration
 * 
 * - **Buffering Operators**: Require materializing part or all of the sequence
 *   - Examples: `orderBy()`, `reverse()`, `distinct()`, `groupBy()`
 *   - Use O(n) memory to store elements for processing
 *   - Still return lazy sequences, but internally buffer during enumeration
 * 
 * ## Lazy Evaluation
 * 
 * Query operators do not execute immediately. Instead, they build a pipeline of
 * transformations that execute element-by-element when a terminal operator is called
 * or the sequence is enumerated (via `for...of`, `toArray()`, etc.).
 * 
 * ## Re-Iterability
 * 
 * Sequences can be enumerated multiple times. Each enumeration calls {@link getEnumerator}
 * to obtain a fresh iterator, ensuring independent iteration state. However, if the
 * underlying source is consumable (e.g., a generator function), re-iteration may
 * produce different results or fail.
 * 
 * ## Extensibility
 * 
 * Derived classes must implement:
 * - {@link getEnumerator}: Produces fresh iterators for each enumeration
 * - {@link createEnumerable}: Factory method for wrapping operators as new sequences
 * - {@link createOrderedEnumerable}: Factory method for ordered sequence support
 * 
 * The {@link pipe} method provides an escape hatch for custom transformations
 * not covered by built-in operators.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * 
 * @example
 * ```typescript
 * // Streaming pipeline (lazy, O(1) memory)
 * const evens = Tyneq.from([1, 2, 3, 4, 5, 6])
 *     .where(n => n % 2 === 0)  // streaming
 *     .select(n => n * n);       // streaming
 * 
 * // Not executed yet; execute with terminal operator
 * const result = evens.toArray(); // [4, 16, 36]
 * 
 * // Buffering pipeline (requires O(n) memory)
 * const sorted = Tyneq.from(['banana', 'apple', 'cherry'])
 *     .orderBy(s => s.length)     // buffering (sorts in memory)
 *     .thenBy(s => s)             // secondary sort
 *     .toArray();
 * // Result: ['apple', 'banana', 'cherry']
 * 
 * // Terminal operators (immediate evaluation)
 * const count = Tyneq.from([1, 2, 3]).count(); // 3
 * const sum = Tyneq.from([1, 2, 3]).sum(n => n); // 6
 * const hasAny = Tyneq.from([1, 2, 3]).any(n => n > 2); // true
 * ```
 * 
 * @see {@link TyneqEnumerable} for the standard concrete implementation.
 * @see {@link TyneqOrderedEnumerable} for ordered sequence support.
 */
export abstract class TyneqEnumerableBase<TSource> implements ITyneqEnumerable<TSource> {

    /**
     * Makes this sequence compatible with JavaScript's iteration protocol.
     * 
     * @remarks
     * Implements the `Iterable<TSource>` interface by delegating to {@link getEnumerator}.
     * This enables:
     * - `for...of` loops: `for (const item of sequence) { ... }`
     * - Spread operator: `const array = [...sequence];`
     * - Destructuring: `const [first, second] = sequence;`
     * - Any API accepting iterables (e.g., `new Set(sequence)`)
     * 
     * Each call to this method produces a fresh iterator, allowing the sequence
     * to be iterated multiple times independently.
     * 
     * @returns A fresh iterator positioned before the first element.
     */
    public [Symbol.iterator](): IEnumerator<TSource> {
        return this.getEnumerator();
    }

    /**
     * Obtains a fresh iterator for enumerating the sequence.
     * 
     * @remarks
     * This abstract method must be implemented by derived classes to provide
     * the actual iteration logic. Each call should return an independent iterator
     * with its own state, enabling the sequence to be enumerated multiple times.
     * 
     * The returned iterator follows the JavaScript iterator protocol:
     * - `next()`: Returns `{ value: T, done: false }` or `{ value: undefined, done: true }`
     * - Optional `return()`: Cleanup method for early termination
     * 
     * This method is called automatically by {@link [Symbol.iterator]} and does not
     * need to be invoked directly in typical usage.
     * 
     * @returns A fresh iterator positioned before the first element.
     */
    public abstract getEnumerator(): IEnumerator<TSource>;

    // terminal operators

    /**
     * Determines whether any element of a sequence satisfies a condition.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates the sequence and tests each element against the predicate.
     * Returns `true` as soon as a matching element is found, short-circuiting
     * the iteration. Returns `false` if no elements match or the sequence is empty.
     * 
     * Performance: O(n) time in worst case, O(1) if early match. Does not buffer elements.
     * 
     * @param predicate - Function to test each element. Returns `true` for a match.
     * 
     * @returns `true` if any element satisfies the predicate; otherwise, `false`.
     * 
     * @throws {@link ArgumentNullError} when `predicate` is null.
     * @throws {@link ArgumentError} when `predicate` is undefined.
     * 
     * @see {@link all} to check if all elements satisfy a condition.
     * @see {@link contains} to check if a specific value exists.
     */
    public any(predicate: (item: TSource) => boolean): boolean {
        return new AnyOperator<TSource>(this, predicate)
            .process();
    }

    /**
     * Determines whether all elements satisfy a condition.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates elements and tests each against the predicate. Returns `false`
     * immediately upon finding a non-matching element (short-circuits), or `true`
     * if all elements match or the sequence is empty (vacuous truth).
     * 
     * **Performance**: O(n) worst case, but typically short-circuits early on first mismatch.
     * 
     * @param predicate - Function to test each element. Returns `true` for all elements to match.
     * 
     * @returns `true` if all elements satisfy the predicate or sequence is empty; `false` otherwise.
     * 
     * @throws {InvalidOperationError} If the predicate throws during enumeration.
     */
    public all(predicate: (item: TSource) => boolean): boolean {
        return new AllOperator<TSource>(this, predicate)
            .process();
    }

    /**
     * Determines whether the sequence contains a specific value.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates elements and checks each for equality with the specified value.
     * Returns `true` immediately upon finding a match (short-circuits), or `false`
     * if no elements match. Uses strict equality (`===`).
     * 
     * **Performance**: O(n) worst case, but typically short-circuits on first match.
     * 
     * @param value - The value to locate. Can be any value, including null or undefined.
     * 
     * @returns `true` if the sequence contains the value; `false` otherwise.
     * 
     * @throws {InvalidOperationError} If enumeration raises an error.
     */
    public contains(value: TSource): boolean {
        return new ContainsOperator<TSource>(this, value)
            .process();
    }

    /**
     * Returns the number of elements in the sequence.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the entire sequence.
     * Enumerates all elements to count them. For arrays with a known `length` property,
     * may optimize by reading the property instead of iterating. O(1) memory overhead.
     * 
     * **Performance**: O(n) time in general case.
     * 
     * @returns The number of elements in the sequence. Returns 0 for empty sequences.
     * 
     * @throws {InvalidOperationError} If enumeration raises an error.
     */
    public count(): number {
        return new CountOperator<TSource>(this)
            .process();
    }

    /**
     * Returns the original sequence, or a single-element sequence containing a default value if empty.
     * 
     * @remarks
     * This is a streaming operator that yields all original elements if the sequence is not empty,
     * or yields the default value if the sequence is empty. Evaluation is deferred until enumeration.
     * 
     * **Performance**: O(1) memory overhead. O(n) time when enumerated.
     * 
     * @param defaultValue - The value to yield if the sequence is empty.
     * 
     * @returns A new sequence that yields all source elements, or the default value if empty.
     */
    public defaultIfEmpty(defaultValue: TSource): ITyneqEnumerable<TSource> {
        return new DefaultIfEmptyOperator<TSource>(this, defaultValue)
            .process();
    }

    /**
     * Returns the element at a specified index.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates from the beginning and returns the element at the specified zero-based index.
     * Throws if the index is out of range.
     * 
     * **Performance**: O(n) time. Sequence is enumerated up to the specified index.
     * 
     * @param index - The zero-based index of the element to retrieve. Must be within [0, length).
     * 
     * @returns The element at the specified index.
     * 
     * @throws {InvalidOperationError} If the index is out of range.
     */
    public elementAt(index: number): TSource {
        return new ElementAtOperator<TSource>(this, index)
            .process();
    }

    /**
     * Returns the element at a specified index, ordefault value if out of range.
     * 
     * @remarks
     * Enumerates the sequence from the beginning and returns the element at the
     * specified index. If the index is out of range (negative or beyond the
     * sequence length), returns the default value.
     * 
     * **Performance**: O(n) time. The sequence is enumerated up to the index.
     * 
     * @param index - The zero-based index of the element to retrieve.
     * @param defaultValue - The value to return if the index is out of range.
     * 
     * @returns The element at the specified index, or `defaultValue` if out of range.
     */
    public elementAtOrDefault(index: number, defaultValue: TSource): TSource {
        return new ElementAtOrDefaultOperator<TSource>(this, index, defaultValue)
            .process();
    }

    /**
     * Returns the first element that satisfies a condition.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates the sequence and returns the first element matching the predicate.
     * Throws an error if no elements match.
     * 
     * **Performance**: O(n) time worst case. Short-circuits when match is found.
     * 
     * @param predicate - Function to test each element. Cannot be null or undefined.
     * 
     * @returns The first element that satisfies the condition.
     * 
     * @throws {ArgumentNullError} when `predicate` is null.
     * @throws {ArgumentError} when `predicate` is undefined.
     * @throws {InvalidOperationError} when no element satisfies the condition.
     * 
     * @see {@link firstOrDefault} - Returns a default value instead of throwing.
     */
    public first(predicate: (item: TSource) => boolean): TSource {
        return new FirstOperator<TSource>(this, predicate)
            .process();
    }

    /**
     * Returns the first element that satisfies a condition, or a default value if none found.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates the sequence and returns the first element matching the predicate.
     * If no elements match, returns the default value.
     * 
     * **Performance**: O(n) time worst case. Short-circuits when match is found.
     * 
     * @param predicate - Function to test each element. Cannot be null or undefined.
     * @param defaultValue - The value to return if no element satisfies the condition.
     * 
     * @returns The first matching element, or `defaultValue` if none found.
     * 
     * @throws {ArgumentNullError} when `predicate` is null.
     * @throws {ArgumentError} when `predicate` is undefined.
     * 
     * @see {@link first} - Throws if no element matches.
     */
    public firstOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        return new FirstOrDefaultOperator<TSource>(this, predicate, defaultValue)
            .process();
    }

    /**
     * Returns the zero-based index of the first element that satisfies a condition.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates the sequence starting at `startIndex` and returns the index of the first
     * element matching the predicate. Returns -1 if no elements match.
     * 
     * **Performance**: O(n) time worst case. Short-circuits when match is found.
     * 
     * @param predicate - Function to test each element. Cannot be null or undefined.
     * @param startIndex - The zero-based index at which to begin searching. Defaults to 0.
     * 
     * @returns The zero-based index of the first matching element, or -1 if not found.
     * 
     * @throws {ArgumentNullError} when `predicate` is null.
     * @throws {ArgumentError} when `predicate` is undefined.
     * 
     * @see {@link contains} - To check if a specific value exists.
     */
    public indexOf(predicate: (item: TSource) => boolean, startIndex: number = 0): number {
        return new IndexOfOperator<TSource>(this, predicate, startIndex)
            .process();
    }

    /**
     * Returns the last element that satisfies a condition.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates the entire sequence to find the last element matching the predicate.
     * Throws an error if no elements match.
     * 
     * **Performance**: O(n) time (must enumerate entire sequence to find last match).
     * Cannot short-circuit.
     * 
     * @param predicate - Function to test each element. Cannot be null or undefined.
     * 
     * @returns The last element that satisfies the condition.
     * 
     * @throws {ArgumentNullError} when `predicate` is null.
     * @throws {ArgumentError} when `predicate` is undefined.
     * @throws {InvalidOperationError} when no element satisfies the condition.
     * 
     * @see {@link lastOrDefault} - Returns a default value instead of throwing.
     * @see {@link first} - Gets the first matching element.
     */
    public last(predicate: (item: TSource) => boolean): TSource {
        return new LastOperator<TSource>(this, predicate)
            .process();
    }

    /**
     * Returns the last element that satisfies a condition, or a default value if none found.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates the entire sequence to find the last matching element.
     * Returns the default value if no elements match.
     * 
     * **Performance**: O(n) time (must enumerate entire sequence).
     * 
     * @param predicate - Function to test each element. Cannot be null or undefined.
     * @param defaultValue - The value to return if no element satisfies the condition.
     * 
     * @returns The last matching element, or `defaultValue` if none found.
     * 
     * @throws {ArgumentNullError} when `predicate` is null.
     * @throws {ArgumentError} when `predicate` is undefined.
     * 
     * @see {@link last} - Throws if no element matches.
     */
    public lastOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        return new LastOrDefaultOperator<TSource>(this, predicate, defaultValue)
            .process();
    }

    /**
     * Returns the maximum element in the sequence.
     * 
     * @remarks
     * Enumerates the entire sequence and returns the element with the maximum value
     * according to the optional comparer function.
     * 
     * If no comparer is provided, uses default comparison (< and > operators).
     * For numeric types, returns the largest value.
     * 
     * **Performance**: O(n) time, O(1) space. Must examine all elements.
     * 
     * @param comparer - Optional comparison function returning negative (a < b),
     *   zero (a === b), or positive (a > b). If omitted, uses default comparison.
     * 
     * @returns The maximum element.
     * 
     * @throws {InvalidOperationError} when the sequence is empty.
     */
    public max(comparer?: ((a: TSource, b: TSource) => number) | undefined): TSource {
        return new MaxOperator<TSource>(this, comparer)
            .process();
    }

    /**
     * Returns the element with the maximum key value.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates the entire sequence and returns the element with the maximum
     * key value (according to the optional comparer function).
     * 
     * The comparison is done on the extracted key, not on the elements themselves.
     * This is useful for finding an element with maximum value in a specific property.
     * 
     * **Performance**: O(n) time, O(1) space. Must examine all elements.
     * 
     * @typeParam TKey - The type of key to compare.
     * @param keySelector - Function to extract the comparison key from each element.
     *   Cannot be null or undefined.
     * @param comparer - Optional comparison function for keys. If omitted, uses default comparison.
     * 
     * @returns The element with the maximum key value.
     * 
     * @throws {InvalidOperationError} when the sequence is empty.
     * @throws {ArgumentNullError} when `keySelector` is null.
     * @throws {ArgumentError} when `keySelector` is undefined.
     * 
     * @see {@link max} - To find maximum element using full element comparison.
     * @see {@link minBy} - To find element with minimum key value.
     */
    public maxBy<TKey>(keySelector: (element: TSource) => TKey, comparer?: ((a: TKey, b: TKey) => number) | undefined): TSource {
        return new MaxByOperator<TSource, TKey>(this, keySelector, comparer)
            .process();
    }

    /**
     * Returns the minimum element in the sequence.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates the entire sequence and returns the element with the minimum value
     * according to the optional comparer function.
     * 
     * If no comparer is provided, uses default comparison (< and > operators).
     * For numeric types, returns the smallest value.
     * 
     * **Performance**: O(n) time, O(1) space. Must examine all elements.
     * 
     * @param comparer - Optional comparison function returning negative (a < b),
     *   zero (a === b), or positive (a > b). If omitted, uses default comparison.
     * 
     * @returns The minimum element.
     * 
     * @throws {InvalidOperationError} when the sequence is empty.
     * 
     * @see {@link minBy} - To get min element by a specific key.
     * @see {@link max} - To get the maximum element.
     */
    public min(comparer?: ((a: TSource, b: TSource) => number) | undefined): TSource {
        return new MinOperator<TSource>(this, comparer)
            .process();
    }

    /**
     * Returns the element with the minimum key value.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates the entire sequence and returns the element with the minimum
     * key value (according to the optional comparer function).
     * 
     * The comparison is done on the extracted key, not on the elements themselves.
     * This is useful for finding an element with minimum value in a specific property.
     * 
     * **Performance**: O(n) time, O(1) space. Must examine all elements.
     * 
     * @typeParam TKey - The type of key to compare.
     * @param keySelector - Function to extract the comparison key from each element.
     *   Cannot be null or undefined.
     * @param comparer - Optional comparison function for keys. If omitted, uses default comparison.
     * 
     * @returns The element with the minimum key value.
     * 
     * @throws {InvalidOperationError} when the sequence is empty.
     * @throws {ArgumentNullError} when `keySelector` is null.
     * @throws {ArgumentError} when `keySelector` is undefined.
     * 
     * @see {@link min} - To find minimum element using full element comparison.
     * @see {@link maxBy} - To find element with maximum key value.
     */
    public minBy<TKey>(keySelector: (element: TSource) => TKey, comparer?: ((a: TKey, b: TKey) => number) | undefined): TSource {
        return new MinByOperator<TSource, TKey>(this, keySelector, comparer)
            .process();
    }

    /**
     * Determines whether two sequences are equal by comparing elements pairwise.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of both sequences.
     * Enumerates both sequences and compares them element-by-element.
     * Returns `true` only if both sequences have the same length and all corresponding
     * elements compare as equal.
     * 
     * **Performance**: O(min(n, m)) time where n and m are the lengths.
     * Short-circuits on first mismatch. Does not buffer elements.
     * 
     * If no comparer is provided, uses default equality (`===` operator).
     * 
     * @param other - The other sequence to compare with.
     * @param equalityComparer - Optional function to compare elements. Should return `true`
     *   if elements are equal. If omitted, uses default equality.
     * 
     * @returns `true` if sequences have the same length and all corresponding elements are equal;
     *   `false` otherwise.
     * 
     * @see {@link contains} - To check if one element exists.
     */
    public sequenceEqual(other: IEnumerable<TSource>, equalityComparer?: ((a: TSource, b: TSource) => boolean) | undefined): boolean {
        return new SequenceEqualOperator<TSource>(this, other, equalityComparer)
            .process();
    }

    /**
     * Returns the only element that satisfies a condition.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates the sequence and returns the single element matching the predicate.
     * Throws an error if no elements match or if more than one element matches.
     * 
     * **Performance**: O(n) time worst case. May stop early if multiple matches found.
     * 
     * This is stricter than `first()` or `last()`, which return the first/last match
     * without checking for uniqueness. Use `single()` when exactly one match is required.
     * 
     * @param predicate - Function to test each element. Cannot be null or undefined.
     * 
     * @returns The single element that satisfies the condition.
     * 
     * @throws {ArgumentNullError} when `predicate` is null.
     * @throws {ArgumentError} when `predicate` is undefined.
     * @throws {InvalidOperationError} when no elements satisfy the condition,
     *   or when more than one element satisfies the condition.
     * 
     * @see {@link singleOrDefault} - Returns default instead of throwing if no match.
     * @see {@link first} - Returns first match (allows multiple matches).
     */
    public single(predicate: (item: TSource) => boolean): TSource {
        return new SingleOperator<TSource>(this, predicate)
            .process();
    }

    /**
     * Returns the only element that satisfies a condition, or a default value.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates the sequence and returns the single element matching the predicate.
     * Returns the default value if no elements match. Throws an error if more than one
     * element matches (uniqueness is still required).
     * 
     * **Performance**: O(n) time worst case. Stops early if multiple matches found.
     * 
     * Unlike `firstOrDefault()`, this method enforces that at most one element matches.
     * 
     * @param predicate - Function to test each element. Cannot be null or undefined.
     * @param defaultValue - The value to return if no element satisfies the condition.
     * 
     * @returns The single matching element, or `defaultValue` if no element matches.
     * 
     * @throws {ArgumentNullError} when `predicate` is null.
     * @throws {ArgumentError} when `predicate` is undefined.
     * @throws {InvalidOperationError} when more than one element satisfies the condition.
     * 
     * @see {@link single} - Throws if no element matches.
     * @see {@link firstOrDefault} - Returns first match (allows multiple matches).
     */
    public singleOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        return new SingleOrDefaultOperator<TSource>(this, predicate, defaultValue)
            .process();
    }

    /**
     * Determines whether the sequence starts with the elements of another sequence.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of both sequences.
     * Enumerates both sequences in parallel and checks if this sequence begins with all
     * elements from the other sequence, comparing elements pairwise.
     * 
     * Returns `true` if the other sequence is empty (empty prefix matches all sequences).
     * Returns `true` if both sequences are identical.
     * Returns `false` if this sequence is shorter than the other sequence.
     * 
     * **Performance**: O(min(n, m)) time where n is this sequence length and m is the
     * other sequence length. Short-circuits on first mismatch.
     * 
     * Uses default equality for comparison (`===` operator). For custom comparison,
     * use {@link take} with a custom comparison in the predicate.
     * 
     * @param sequence - The sequence to check for at the start.
     * 
     * @returns `true` if this sequence starts with all elements from `sequence`;
     *   `false` otherwise. Returns `true` if `sequence` is empty.
     * 
     * @see {@link concat} - To combine sequences.
     */
    public startsWith(sequence: IEnumerable<TSource>): boolean {
        return new StartsWithOperator<TSource>(this, sequence)
            .process();
    }

    /**
     * Computes the sum of values obtained by invoking a selector on each element.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the sequence.
     * Enumerates the entire sequence, applies the selector to each element,
     * and accumulates the numeric results into a sum. Returns 0 for empty sequences.
     * 
     * **Performance**: O(n) time, O(1) space. Must process all elements.
     * 
     * The selector function must return a numeric value. Non-numeric returns
     * (like `undefined` or `NaN`) may be treated as 0 in JavaScript's numeric context.
     * 
     * Useful for aggregations like totals, averages (when combined with count), etc.
     * 
     * @param selector - Function to extract a numeric value from each element.
     *   Cannot be null or undefined.
     * 
     * @returns The sum of all selected values. Returns 0 for empty sequences.
     * 
     * @throws {ArgumentNullError} when `selector` is null.
     * @throws {ArgumentError} when `selector` is undefined.
     * 
     * @see {@link count} - To count the number of elements.
     * @see {@link average} - To compute average value (if available).
     */
    public sum(selector: (item: TSource) => number): number {
        return new SumOperator<TSource>(this, selector)
            .process();
    }

    /**
     * Materializes the sequence into an array.
     * 
     * @remarks
     * Enumerates the entire sequence and collects all elements into a standard JavaScript
     * array. This is a terminal operator that triggers immediate evaluation of the
     * entire query pipeline.
     * 
     * The resulting array is a new instance; modifying it does not affect the original
     * sequence. If the sequence is re-iterable, calling `toArray()` again will produce
     * a fresh array.
     * 
     * Use this method when:
     * - You need random access to elements (indexing)
     * - You want to cache results for multiple iterations
     * - An API requires an array
     * - You need to determine the length efficiently
     * 
     * Performance: O(n) time and space. The entire sequence is buffered in memory.
     * 
     * @returns A new array containing all elements from the sequence.
     */
    public toArray(): TSource[] {
        return new ToArrayOperator<TSource>(this)
            .process();
    }

    /**
     * Converts the sequence to a Map by extracting key-value pairs from each element.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the entire sequence.
     * Enumerates all elements and applies the selector to extract key-value pairs.
     * If duplicate keys exist, later values overwrite earlier ones.
     * 
     * **Performance**: O(n) time and space. The entire sequence is buffered in memory.
     * 
     * @typeParam TKey - The type of keys in the resulting Map.
     * @typeParam TValue - The type of values in the resulting Map.
     * @param selector - Function to extract a key-value pair from each element.
     *   Cannot be null or undefined.
     * 
     * @returns A new Map containing all key-value pairs from the sequence.
     * 
     * @throws {@link ArgumentNullError} when `selector` is null.
     * @throws {@link ArgumentError} when `selector` is undefined.
     */
    public toMap<TKey, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>): Map<TKey, TValue> {
        return new ToMapOperator<TSource, TKey, TValue>(this, selector)
            .process();
    }

    /**
     * Converts the sequence to a Record object by extracting key-value pairs from each element.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the entire sequence.
     * Enumerates all elements and applies the selector to extract key-value pairs.
     * If duplicate keys exist, later values overwrite earlier ones.
     * 
     * **Performance**: O(n) time and space. The entire sequence is buffered in memory.
     * 
     * @typeParam TKey - The type of keys (must be string, number, or symbol).
     * @typeParam TValue - The type of values in the resulting Record.
     * @param selector - Function to extract a key-value pair from each element.
     *   Cannot be null or undefined.
     * 
     * @returns A new Record object containing all key-value pairs from the sequence.
     * 
     * @throws {@link ArgumentNullError} when `selector` is null.
     * @throws {@link ArgumentError} when `selector` is undefined.
     */
    public toRecord<TKey extends string | number | symbol, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>): Record<TKey, TValue> {
        return new ToRecordOperator<TSource, TKey, TValue>(this, selector)
            .process();
    }

    /**
     * Converts the sequence to a Set, removing duplicates.
     * 
     * @remarks
     * This is a terminal operator that forces evaluation of the entire sequence.
     * Enumerates all elements and collects unique values into a JavaScript Set.
     * Duplicate values are automatically removed by Set semantics.
     * 
     * **Performance**: O(n) time and space. The entire sequence is buffered in memory.
     * 
     * @returns A new Set containing all unique elements from the sequence.
     */
    public toSet(): Set<TSource> {
        return new ToSetOperator<TSource>(this)
            .process();
    }

    // stream operators

    /**
     * Appends a single element to the end of the sequence.
     * 
     * @remarks
     * This is a streaming operator that yields all elements from the source sequence,
     * followed by the single appended element. The source is not consumed until
     * enumeration begins.
     * 
     * **Performance**: O(1) space (streaming). O(n) time when enumerated.
     * 
     * **Laziness**: Both the source and the append operation are evaluated lazily.
     * 
     * @param item - The element to append to the end of the sequence.
     * 
     * @returns A new sequence with the appended element at the end.
     */
    public append(item: TSource): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new AppendOperatorEnumerable<TSource>(this, item)
        );
    }

    /**
     * Splits the sequence into chunks of a specified size.
     * 
     * @remarks
     * This is a buffering operator that groups consecutive elements into arrays
     * of the specified size. The last chunk may contain fewer elements if the
     * sequence length is not evenly divisible by the chunk size.
     * 
     * **Performance**: O(n) time, O(size) space. Buffers only the current chunk.
     * 
     * @param size - The maximum size of each chunk. Must be positive (> 0).
     * 
     * @returns A sequence of arrays, where each array contains up to `size` elements.
     */
    public chunk(size: number): ITyneqEnumerable<TSource[]> {
        return this.createEnumerable(
            new ChunkOperatorEnumerable<TSource>(this, size)
        );
    }

    /**
     * Concatenates two sequences.
     * 
     * @remarks
     * This is a streaming operator that yields all elements from the first sequence,
     * followed by all elements from the second sequence. Both sequences are evaluated
     * lazily as enumeration progresses.
     * 
     * **Performance**: O(1) space (streaming). O(n + m) time when enumerated, where
     * n is the length of this sequence and m is the length of the other sequence.
     * 
     * **Laziness**: Neither sequence is consumed until enumeration begins. The second
     * sequence is only enumerated after the first is exhausted.
     * 
     * **No deduplication**: Unlike {@link union}, duplicates are preserved.
     * 
     * @param other - The second sequence to concatenate.
     * Cannot be null.
     * 
     * @returns A sequence containing all elements from both sequences in order.
     */
    public concat(other: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new ConcatOperatorEnumerable<TSource>(this, other)
        );
    }

    /**
     * Prepends a single element to the beginning of the sequence.
     * 
     * @remarks
     * This is a streaming operator that yields the single prepended element first,
     * followed by all elements from the source sequence. The source is not consumed
     * until enumeration begins.
     * 
     * **Performance**: O(1) space (streaming). O(n) time when enumerated.
     * 
     * **Laziness**: Both the prepend and source are evaluated lazily.
     * 
     * @param item - The element to prepend to the beginning of the sequence.
     * 
     * @returns A new sequence with the prepended element at the start.
     */
    public prepend(item: TSource): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new PrependOperatorEnumerable<TSource>(this, item)
        );
    }

    /**
     * Projects each element into a new form.
     * 
     * @remarks
     * Applies a transformation function to each element of the sequence, producing
     * a new sequence with the transformed values. This is a streaming operator that
     * maintains lazy evaluation; elements are transformed on-demand during iteration.
     * 
     * The selector function is called once per element during enumeration, not when
     * `select()` is called. This enables efficient query composition and avoids
     * unnecessary computation for elements that are never consumed.
     * 
     * Common use cases:
     * - Extracting properties from objects (projection)
     * - Applying calculations or transformations
     * - Type conversions
     * - Creating new object shapes
     * 
     * Performance: O(1) time and space for the operator itself. O(n) total when
     * enumerated. Does not buffer elements.
     * 
     * @typeParam TResult - The type of elements in the resulting sequence.
     * 
     * @param selector - Function to transform each element. Called for each element
     *                   during iteration.
     * 
     * @returns A new sequence with transformed elements.
     * 
     * @throws {@link ArgumentNullError} when `selector` is null.
     * @throws {@link ArgumentError} when `selector` is undefined.
     */
    public select<TResult>(selector: (item: TSource) => TResult): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new SelectOperatorEnumerable<TSource, TResult>(this, selector)
        );
    }

    /**
     * Projects each element to a sequence and flattens the resulting sequences into one.
     * 
     * @remarks
     * This is a streaming operator that applies a transform function to each element,
     * obtaining an enumerable sequence for each element, and flattens all nested sequences
     * into a single flat sequence. Also known as "flatMap" in functional programming.
     * 
     * **Performance**: O(1) space (streaming). O(n + m) time when enumerated, where n is the
     * count of source elements and m is the total count of elements in all projected sequences.
     * 
     * **Laziness**: The source and inner sequences are evaluated lazily. Each inner sequence
     * is enumerated as needed during iteration.
     * 
     * **Order**: Results appear in the order of the source sequence, with all elements from
     * each projected sequence appearing before elements from the next source element.
     * 
     * @typeParam TResult - The type of elements in the result sequence.
     * @param selector - A transform function that returns an enumerable sequence for each
     *   source element. Cannot be null or undefined.
     * 
     * @returns A sequence containing all elements from all projected inner sequences.
     * 
     * @throws {@link ArgumentNullError} when `selector` is null.
     * @throws {@link ArgumentError} when `selector` is undefined.
     */
    public selectMany<TResult>(selector: (item: TSource) => IEnumerable<TResult>): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new SelectManyOperatorEnumerable<TSource, TResult>(this, selector)
        );
    }

    /**
     * Bypasses a specified number of elements from the beginning and returns the remaining elements.
     * 
     * @remarks
     * This is a streaming operator that skips the first `count` elements and yields all
     * subsequent elements. If `count` is greater than or equal to the sequence length,
     * returns an empty sequence.
     * 
     * **Performance**: O(1) space (streaming). O(n) time when enumerated.
     * 
     * @param count - The number of elements to skip from the beginning.
     *   Can be 0 or negative (skips nothing).
     * 
     * @returns A sequence containing all elements after skipping the first `count` elements.
     */
    public skip(count: number): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new SkipOperatorEnumerable<TSource>(this, count)
        );
    }

    /**
     * Bypasses a specified number of elements from the end and returns the remaining elements.
     * 
     * @remarks
     * This is a buffering operator that must examine the entire sequence to determine
     * which elements are in the last `count` positions. Returns all elements except those.
     * 
     * **Performance**: O(n) time, O(count) space. Uses a sliding window of size `count`.
     * 
     * **Buffering**: Unlike {@link skip}, this must materialize elements as it scans.
     * The entire sequence must be examined.
     * 
     * @param count - The number of elements to skip from the end.
     * Can be 0 or negative (skips nothing).
     * 
     * @returns A sequence containing all elements except the last `count` elements.
     */
    public skipLast(count: number): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new SkipLastOperatorEnumerable<TSource>(this, count)
        );
    }

    /**
     * Bypasses elements while a condition is true and returns the remaining elements.
     * 
     * @remarks
     * This is a streaming operator that skips leading elements that satisfy the predicate.
     * Once an element fails the predicate, that element and all remaining elements are yielded,
     * regardless of whether they would satisfy the predicate.
     * 
     * **Performance**: O(1) space (streaming). O(n) time when enumerated. Can short-circuit
     * on the first element that doesn't match the predicate.
     * 
     * **Semantics**: Only elements at the beginning are skipped. Once the predicate fails,
     * enumeration continues including all subsequent elements.
     * 
     * @param predicate - A function to test each element.
     * Cannot be null or undefined.
     * 
     * @returns A sequence containing elements starting from the first element that does not
     *   satisfy the condition, plus all subsequent elements.
     */
    public skipWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new SkipWhileOperatorEnumerable<TSource>(this, predicate)
        );
    }

    /**
     * Splits the sequence into sub-sequences based on a predicate.
     * 
     * @remarks
     * This is a buffering operator that groups consecutive elements into arrays, using the
     * predicate to identify split points. Elements that cause the predicate to return true
     * (the "split points") are excluded from the results.
     * 
     * **Performance**: O(n) time, O(n) space. Must buffer all elements.
     * 
     * **Semantics**: Consecutive elements that don't match the predicate are collected into
     * an array. When an element matches the predicate, the current array is yielded (if
     * non-empty) and a new group begins.
     * 
     * @param splitOn - A function that identifies elements to use as split points.
     *   Cannot be null or undefined. Elements where this returns true are excluded.
     * 
     * @returns A sequence of arrays, where each array contains consecutive elements between
     *   split points.
     */
    public split(splitOn: (item: TSource) => boolean): ITyneqEnumerable<TSource[]> {
        return this.createEnumerable(
            new SplitOperatorEnumerable<TSource>(this, splitOn)
        );
    }

    /**
     * Returns a specified number of elements from the beginning of the sequence.
     * 
     * @remarks
     * This is a streaming operator that yields at most `count` elements from the start
     * of the sequence. If the sequence contains fewer than `count` elements, all elements
     * are returned. Enumeration stops after `count` elements (short-circuits).
     * 
     * **Performance**: O(1) space (streaming). O(min(count, n)) time when enumerated.
     * 
     * @param count - The maximum number of elements to return.
     *   Can be 0 or negative (returns empty sequence).
     * 
     * @returns A sequence containing at most `count` elements from the beginning.
     */
    public take(count: number): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new TakeOperatorEnumerable<TSource>(this, count)
        );
    }

    /**
     * Returns elements while a condition is true and skips the remaining elements.
     * 
     * @remarks
     * This is a streaming operator that yields elements as long as they satisfy the predicate.
     * Once an element fails the predicate, enumeration stops immediately, and remaining
     * elements are never consumed.
     * 
     * **Performance**: O(1) space (streaming). O(k) time where k is the count of elements
     * yielded. Can short-circuit as soon as the predicate fails.
     * 
     * **Semantics**: Only elements at the beginning are included. Once the predicate fails,
     * enumeration ends, even if later elements would satisfy the condition.
     * 
     * @param predicate - A function to test each element.
     * Cannot be null or undefined.
     * 
     * @returns A sequence containing elements starting from the beginning while the predicate
     *   returns true, stopping at the first element that doesn't satisfy the condition.
     */
    public takeWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new TakeWhileOperatorEnumerable<TSource>(this, predicate)
        );
    }

    /**
     * Performs a side effect on each element without modifying the sequence.
     * 
     * @remarks
     * This is a streaming operator that passes elements through unchanged while executing
     * an action on each element. Useful for debugging, logging, or side effects during
     * pipeline execution.
     * 
     * **Performance**: O(1) space (streaming). O(n) time when enumerated.
     * 
     * **Laziness**: The action is not invoked until the sequence is enumerated.
     * 
     * **Return value**: Returns the original sequence (this) unchanged. The action is
     * executed for side effects only and does not affect the elements.
     * 
     * @param action - An action to perform on each element. Cannot be null.
     *   Even if the action throws, elements are still yielded.
     * 
     * @returns The original sequence unchanged, with the action executed during enumeration.
     * 
     * @throws {@link ArgumentNullError} when `action` is null.
     * @throws {@link ArgumentError} when `action` is undefined.
     * 
     * @see {@link tapIf} - To perform conditional side effects.
     */
    public tap(action: (item: TSource) => void): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new TapOperatorEnumerable<TSource>(this, action)
        );
    }

    /**
     * Performs a side effect on each element matching a condition, without modifying the sequence.
     * 
     * @remarks
     * This is a debugging and introspection operator that passes elements through unchanged
     * while conditionally executing an action on matching elements. Useful for conditional
     * logging, conditional debugging, or conditional side effects during pipeline execution.
     * 
     * **Performance**: O(1) space (streaming). O(n) time when enumerated.
     * 
     * **Laziness**: The action is not invoked until the sequence is enumerated. The predicate
     * is evaluated on every enumeration.
     * 
     * **Return value**: Returns the original sequence (this) unchanged. The action is executed
     * for side effects only.
     * 
     * **Predicate evaluation**: The predicate is called once per enumeration to determine
     * whether side effects should occur. This is different from {@link tap}, which always
     * executes for every element.
     * 
     * @param action - An action to perform on each element if the predicate returns true.
     *   Cannot be null. Even if the action throws, elements are still yielded.
     * @param predicate - A function that determines whether to execute the action.
     *   Cannot be null.
     * 
     * @returns The original sequence unchanged, with the conditional action executed during enumeration.
     */
    public tapIf(action: (item: TSource) => void, predicate: () => boolean): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new TapIfOperatorEnumerable<TSource>(this, action, predicate)
        );
    }

    public throttle(count: number): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new ThrottleOperatorEnumerable<TSource>(this, count)
        );
    }

    /**
     * Filters the sequence to include only elements that satisfy a condition.
     * 
     * @remarks
     * Applies a predicate function to each element and includes only those for which
     * the predicate returns `true`. This is a streaming operator that maintains lazy
     * evaluation; elements are tested on-demand during iteration.
     * 
     * The predicate is called once per source element during enumeration. Elements
     * that fail the test are skipped without allocating memory.
     * 
     * Multiple `where()` calls can be chained; they are equivalent to a single call
     * with a combined predicate using `&&`.
     * 
     * Performance: O(1) time and space for the operator itself. O(n) total when
     * enumerated. Does not buffer elements.
     * 
     * @param predicate - Function to test each element. Returns `true` to include
     *                    the element, `false` to exclude it.
     * 
     * @returns A new sequence containing only elements that satisfy the predicate.
     * 
     * @throws {@link ArgumentNullError} when `predicate` is null.
     * @throws {@link ArgumentError} when `predicate` is undefined.
     */
    public where(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new WhereOperatorEnumerable<TSource>(this, predicate)
        );
    }

    /**
     * Combines elements from two sequences according to a selector function.
     * 
     * @remarks
     * This is a streaming operator that pairs corresponding elements from two sequences
     * using the selector function. The resulting sequence length is the minimum of the
     * two input sequence lengths. Both sequences are enumerated lazily.
     * 
     * **Performance**: O(1) space (streaming). O(min(n, m)) time when enumerated, where
     * n is the length of this sequence and m is the length of the other.
     * 
     * **Laziness**: Both sequences are evaluated on-demand during iteration.
     * 
     * **Pairing**: Position-based matching. The first element of this sequence is paired
     * with the first element of the other, and so on. Enumeration stops when either
     * sequence is exhausted.
     * 
     * @typeParam TOther - The type of elements in the other sequence.
     * @typeParam TResult - The type of elements in the result sequence (result of selector).
     * @param other - The second sequence to zip with. Cannot be null.
     * @param selector - A function that combines corresponding elements from both sequences.
     *   Receives the current element from this sequence and the corresponding element from
     *   the other sequence. Cannot be null or undefined.
     * 
     * @returns A sequence of combined elements from both sequences.
     */
    public zip<TOther, TResult>(other: IEnumerable<TOther>, selector: (first: TSource, second: TOther) => TResult): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new ZipOperatorEnumerable<TSource, TOther, TResult>(this, other, selector)
        );
    }

    // buffering operators

    /**
     * Returns distinct elements from the sequence.
     * 
     * @remarks
     * This is a buffering operator that filters out duplicate elements, keeping only
     * the first occurrence of each value. Uses element equality (===) for comparison.
     * 
     * **Performance**: O(n) time, O(n) space. Must buffer all elements and maintain
     * a hash set of seen values.
     * 
     * **Order**: Results appear in the order elements are first encountered.
     * 
     * @returns A sequence containing only the first occurrence of each unique element.
     * 
     * @see {@link distinctBy} - To remove duplicates based on a key selector.
     */
    public distinct(): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new DistinctOperatorEnumerable<TSource>(this)
        );
    }

    /**
     * Returns distinct elements based on a key selector.
     * 
     * @remarks
     * This is a buffering operator that filters out elements whose extracted keys
     * are duplicates, keeping only the first occurrence of each key value.
     * 
     * **Performance**: O(n) time, O(n) space. Must buffer all elements and maintain
     * a hash set of seen keys.
     * 
     * **Order**: Results appear in the order elements are first encountered.
     * 
     * **Semantics**: For each element, a key is extracted via `keySelector`. If this
     * is the first occurrence of this key value, the element is included; otherwise, it is skipped.
     * 
     * @typeParam TKey - The type of key used for duplicate comparison.
     * @param keySelector - Function to extract the comparison key from each element.
     *   Cannot be null or undefined.
     * 
     * @returns A sequence with distinct elements (by key), preserving first occurrences.
     */
    public distinctBy<TKey>(keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new DistinctByOperatorEnumerable<TSource, TKey>(this, keySelector)
        );
    }

    /**
     * Produces the set difference of two sequences.
     * 
     * @remarks
     * This is a buffering operator that returns distinct elements from this sequence
     * that do not appear in the other sequence. Uses element equality for comparison.
     * 
     * **Performance**: O(n + m) time where n is this sequence length and m is the other.
     * O(m) space to index the other sequence using a hash set.
     * 
     * **Semantics**: Returns distinct elements from this sequence that have no equal
     * in the other sequence. Duplicates within this sequence are also removed.
     * 
     * **Order**: Results appear in the order they first appear in this sequence.
     * 
     * @param excludedValues - A sequence whose elements to exclude from the result.
     *   Cannot be null.
     * 
     * @returns A sequence containing distinct elements from this sequence that do not
     *   appear in `excludedValues`.
     */
    public except(excludedValues: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new ExceptOperatorEnumerable<TSource>(this, excludedValues)
        );
    }
    
    /**
     * Produces the set difference of two sequences based on a key selector.
     * 
     * @remarks
     * This is a buffering operator that excludes elements based on key comparison
     * rather than full element equality. Returns elements from this sequence whose
     * keys do not appear in the excluded keys sequence.
     * 
     * **Performance**: O(n + m) time where n is this sequence length and m is the
     * excluded keys sequence. O(m) space to index the excluded keys.
     * 
     * **Semantics**: For each element in this sequence, a key is extracted. If this
     * key appears in the excluded keys, the element is excluded. All matches are
     * excluded (not just first occurrence).
     * 
     * **Order**: Results appear in the order they appear in this sequence.
     * 
     * @typeParam TKey - The type of key used for comparison.
     * @param excludedKeys - A sequence of keys to exclude.
     *   Cannot be null or undefined.
     * @param keySelector - A function to extract keys from elements of this sequence.
     *   Cannot be null or undefined.
     * 
     * @returns A sequence containing elements whose extracted keys do not appear in
     *   `excludedKeys`.
     */
    public exceptBy<TKey>(excludedKeys: IEnumerable<TKey>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new ExceptByOperatorEnumerable<TSource, TKey>(this, excludedKeys, keySelector)
        );
    }

    /**
     * Groups elements by key and projects the results.
     * 
     * @remarks
     * This is a buffering operator that groups elements by the value returned from `keySelector`,
     * projects each element using `valueSelector`, and then applies `resultSelector` to create
     * the final result for each group. See {@link ITyneqEnumerable.groupBy} for examples.
     * 
     * **Performance**: O(n) time, O(n) space. Must buffer all elements to form groups.
     */
    public groupBy<TKey, TValue, TResult>(
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: ITyneqEnumerable<TValue>) => TResult
    ): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new GroupByOperatorEnumerable<TSource, TKey, TValue, TResult>(this, keySelector, valueSelector, resultSelector)
        );
    }

    /**
     * Correlates elements of two sequences based on key equality and groups the results.
     * 
     * @remarks
     * This is a buffering operator that correlates elements from two sequences using the
     * key selectors. For each element in this sequence, all matching elements from the
     * inner sequence (by key) are grouped together. See {@link ITyneqEnumerable.groupJoin} for examples.
     * 
     * **Performance**: O(n + m) time where n is this sequence length and m is the inner sequence length.
     * O(m) space to index the inner sequence keys.
     */
    public groupJoin<TInner, TKey, TResult>(
        inner: IEnumerable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, group: ITyneqEnumerable<TInner>) => TResult
    ): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new GroupJoinOperatorEnumerable<TSource, TInner, TKey, TResult>(this, inner, outerKeySelector, innerKeySelector, resultSelector)
        );
    }

    /**
     * Produces the set intersection of two sequences.
     * 
     * @remarks
     * This is a buffering operator that returns distinct elements that appear in both
     * sequences. Uses element equality (===) for comparison.
     * 
     * **Performance**: O(n + m) time where n is this sequence length and m is the other.
     * O(m) space to index the other sequence using a hash set.
     * 
     * **Semantics**: Returns distinct elements that appear in both sequences.
     * Duplicates are automatically removed.
     * 
     * **Order**: Results appear in the order they first appear in this sequence.
     * 
     * @param intersectedValues - A sequence whose elements also appear in the result.
     *   Cannot be null.
     * 
     * @returns A sequence containing distinct elements that appear in both sequences.
     * 
     * @see {@link intersectBy} - To intersect based on a key selector.
     * @see {@link except} - To find elements only in this sequence.
     */
    public intersect(intersectedValues: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new IntersectOperatorEnumerable<TSource>(this, intersectedValues)
        )
    }

    /**
     * Produces the set intersection of two sequences based on a key selector.
     * 
     * @remarks
     * This is a buffering operator that returns elements from this sequence based on
     * whether their keys appear in another key sequence. Uses key comparison rather
     * than full element equality.
     * 
     * **Performance**: O(n + m) time where n is this sequence and m is the keys sequence.
     * O(m) space to index the key sequence.
     * 
     * **Semantics**: For each element in this sequence, extracts a key. If this key
     * appears in the intersected keys sequence, the element is included. All such
     * elements are included (includes duplicates by key).
     * 
     * **Order**: Results appear in the order they appear in this sequence.
     * 
     * @typeParam TKey - The type of key used for intersection.
     * @param intersectedKeys - A sequence of keys to intersect with.
     *   Cannot be null or undefined.
     * @param keySelector - A function to extract keys from elements of this sequence.
     *   Cannot be null or undefined.
     * 
     * @returns A sequence containing elements whose keys appear in `intersectedKeys`.
     */
    public intersectBy<TKey>(intersectedKeys: IEnumerable<TKey>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new IntersectByOperatorEnumerable<TSource, TKey>(this, intersectedKeys, keySelector)
        );
    }

    /**
     * Correlates elements of two sequences based on matching keys.
     * 
     * @remarks
     * This is a buffering operator that performs an inner join between two sequences.
     * For each element in this sequence, finds all matching elements in the inner sequence
     * (by key) and applies the result selector to produce the output.
     * 
     * **Performance**: O(n + m) time where n is this sequence length and m is the inner
     * sequence length. O(m) space to index the inner sequence by key.
     * 
     * **Semantics**: For each outer element, extracts a key. For each inner element with
     * a matching key, the result selector is invoked to produce an output element.
     * Elements with no matches are excluded (inner join semantics).
     * 
     * @typeParam TInner - The type of elements in the inner sequence.
     * @typeParam TKey - The type of key used for correlation.
     * @typeParam TResult - The type of result elements.
     * @param inner - The sequence to join with. Cannot be null.
     * @param outerKeySelector - Function to extract keys from elements of this sequence.
     *   Cannot be null or undefined.
     * @param innerKeySelector - Function to extract keys from elements of the inner sequence.
     *   Cannot be null or undefined.
     * @param resultSelector - Function to create result elements from matching pairs.
     *   Cannot be null or undefined.
     * 
     * @returns A sequence containing correlated elements from both sequences.
     * 
     * @see {@link groupJoin} - For left outer join semantics with grouping.
     */
    public join<TInner, TKey, TResult>(
        inner: IEnumerable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, inner: TInner) => TResult
    ): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new JoinOperatorEnumerable<TSource, TInner, TKey, TResult>(this, inner, outerKeySelector, innerKeySelector, resultSelector)
        );
    }

    /**
     * Sorts the sequence in ascending order according to a key.
     * 
     * @remarks
     * Produces an {@link ITyneqOrderedEnumerable} that sorts elements based on keys
     * extracted by the `keySelector` function. The returned ordered enumerable supports
     * multi-level sorting via `thenBy()` and `thenByDescending()` methods.
     * 
     * This is a buffering operator that materializes the entire sequence into memory
     * during the first enumeration to perform the sort. The sort is **stable**, meaning
     * elements with equal keys maintain their original relative order.
     * 
     * The `comparer` function follows JavaScript's standard comparator convention:
     * - Return negative if `a < b`
     * - Return zero if `a == b`
     * - Return positive if `a > b`
     * 
     * If no comparer is provided, uses JavaScript's built-in `<` and `>` operators,
     * which work for primitives (numbers, strings, dates) but may not work as expected
     * for objects.
     * 
     * Performance: O(n log n) time, O(n) space. The entire sequence is buffered.
     * 
     * @typeParam TKey - The type of the sort key.
     * 
     * @param keySelector - Function to extract the sort key from each element.
     * @param comparer - Optional function to compare two keys. If omitted, uses default comparison.
     * 
     * @returns An ordered enumerable that sorts elements by the specified key.
     * 
     * @throws {@link ArgumentNullError} when `keySelector` is null.
     * @throws {@link ArgumentError} when `keySelector` is undefined.
     */
    public orderBy<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: ((a: TKey, b: TKey) => number) | undefined
    ): ITyneqOrderedEnumerable<TSource> {
        return this.createOrderedEnumerable(
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            false
        );
    }

    /**
     * Sorts the sequence in descending order according to a key.
     * 
     * @remarks
     * This is a buffering operator that produces an {@link ITyneqOrderedEnumerable}
     * with elements sorted in descending order based on keys extracted by the `keySelector`.
     * The returned ordered enumerable supports multi-level sorting via `thenBy()` and
     * `thenByDescending()` methods.
     * 
     * The sort is **stable**, meaning elements with equal keys maintain their original
     * relative order. The entire sequence is materialized into memory during the first
     * enumeration to perform the sort.
     * 
     * **Performance**: O(n log n) time, O(n) space. The entire sequence is buffered.
     * 
     * @typeParam TKey - The type of the sort key.
     * @param keySelector - Function to extract the sort key from each element.
     *   Cannot be null or undefined.
     * @param comparer - Optional function to compare two keys. If omitted, uses default comparison.
     * 
     * @returns An ordered enumerable that sorts elements in descending order.
     * 
     * @throws {@link ArgumentNullError} when `keySelector` is null.
     * @throws {@link ArgumentError} when `keySelector` is undefined.
     * 
     * @see {@link orderBy} - For ascending sort.
     */
    public orderByDescending<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: ((a: TKey, b: TKey) => number) | undefined
    ): ITyneqOrderedEnumerable<TSource> {
        return this.createOrderedEnumerable(
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            true
        );
    }

    public memoize(): ITyneqCachedEnumerable<TSource> {
        return this.createCachedEnumerable(this);
    }

    /**
     * Reverses the order of elements in the sequence.
     * 
     * @remarks
     * This is a buffering operator that inverts the element order. The entire sequence
     * must be materialized to determine the reverse order.
     * 
     * **Performance**: O(n) time, O(n) space. Must buffer all elements.
     * 
     * @returns A sequence with elements in reverse order.
     * 
     * @see {@link orderBy} - For sorting with custom criteria.
     */
    public reverse(): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new ReverseOperatorEnumerable<TSource>(this)
        );
    }

    /**
     * Returns the elements in a random order.
     * 
     * @remarks
     * This is a buffering operator that randomizes the element order using the
     * Fisher-Yates shuffle algorithm. The entire sequence must be materialized
     * to perform the shuffle.
     * 
     * **Performance**: O(n) time, O(n) space. Must buffer all elements.
     * 
     * **Randomness**: Each enumeration produces a new random order. The shuffle
     * uses `Math.random()` for randomness.
     * 
     * @returns A sequence with elements in random order.
     */
    public shuffle(): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new ShuffleOperatorEnumerable<TSource>(this)
        );
    }

    /**
     * Produces the set union of two sequences.
     * 
     * @remarks
     * This is a buffering operator that returns distinct elements from both sequences.
     * Duplicates are removed (each unique element appears once), and the result contains
     * all unique elements from both sources.
     * 
     * **Performance**: O(n + m) time where n is this sequence and m is the other sequence.
     * O(n + m) space to buffer and deduplicate using a hash set.
     * 
     * **Semantics**: Returns distinct elements from the union of both sequences.
     * Uses element equality (===, default equality) to determine uniqueness.
     * 
     * **Order**: Elements from this sequence come before elements from the other
     * sequence (for elements not in both).
     * 
     * @param otherValues - The second sequence to union with this sequence.
     *   Cannot be null.
     * 
     * @returns A sequence containing unique elements from both sequences.
     */
    public union(otherValues: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new UnionOperatorEnumerable<TSource>(this, otherValues)
        );
    }

    /**
     * Produces the set union of two sequences based on a key selector.
     * 
     * @remarks
     * This is a buffering operator that returns distinct elements from both sequences,
     * where distinctness is determined by comparing keys rather than full elements.
     * For each unique key value, only the first occurrence is included.
     * 
     * **Performance**: O(n + m) time where n is this sequence and m is the other sequence.
     * O(n + m) space to buffer and deduplicate by key.
     * 
     * **Semantics**: Elements are compared by their extracted keys. Only one element
     * per unique key is included. If both sequences have elements with the same key,
     * the element from this sequence is used.
     * 
     * **Order**: Elements from this sequence come before elements from the other
     * sequence (for unique keys).
     * 
     * @typeParam TKey - The type of key used for equality comparison.
     * @param otherValues - The second sequence to union with this sequence.
     *   Cannot be null.
     * @param keySelector - A function to extract keys from elements.
     *   Cannot be null or undefined.
     * 
     * @returns A sequence containing elements with unique keys from both sequences.
     */
    public unionBy<TKey>(otherValues: IEnumerable<TSource>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new UnionByOperatorEnumerable<TSource, TKey>(this, otherValues, keySelector)
        );
    }

    // extensions

    /**
     * Applies a custom transformation to the sequence using a factory function.
     * 
     * @remarks
     * Provides an escape hatch for custom operators or transformations not covered
     * by built-in methods. The factory receives the current sequence and returns
     * an iterator or iterable iterator that produces transformed elements.
     * 
     * The factory is invoked each time the resulting sequence is enumerated,
     * ensuring lazy evaluation and re-iterability.
     * 
     * Use this method to:
     * - Integrate third-party iterator libraries
     * - Implement custom stateful transformations
     * - Bridge to generator functions for complex logic
     * 
     * Performance: Depends on the factory implementation.
     * 
     * @typeParam TResult - The type of elements produced by the factory.
     * 
     * @param factory - Function that receives the source sequence and returns an iterator.
     *                  Called on each enumeration. Must not be null or undefined.
     * 
     * @returns A new sequence that applies the factory transformation.
     * 
     * @throws {@link ArgumentNullError} when `factory` is null.
     * @throws {@link ArgumentError} when `factory` is undefined.
     */
    public pipe<TResult>(factory: (source: IEnumerable<TSource>) => IEnumerator<TResult> | IterableIterator<TResult>): ITyneqEnumerable<TResult> {
        ArgumentUtility.checkNotOptional(factory, nameof({ factory }));
        const self = this;
        return this.createEnumerable({
            getEnumerator() {
                return factory(self);
            },
        } satisfies IEnumeratorFactory<TResult>);
    }

    /**
     * Creates a new enumerable sequence from an enumerator factory.
     * 
     * @remarks
     * This abstract factory method is called by query operators to wrap their
     * result iterators as new enumerable sequences. Derived classes must implement
     * this to return instances of their specific enumerable type.
     * 
     * The method enables proper type propagation through operator chains, ensuring
     * that operators return sequences with the same capabilities as the original.
     * 
     * @typeParam TResult - The element type of the new sequence.
     * 
     * @param factory - Factory that produces iterators for the new sequence.
     * 
     * @returns A new enumerable wrapping the factory.
     */
    protected abstract createEnumerable<TResult>(factory: IEnumeratorFactory<TResult>): ITyneqEnumerable<TResult>;

    /**
     * Creates an ordered enumerable for multi-level sorting.
     * 
     * @remarks
     * This abstract factory method is called by `orderBy()` and `orderByDescending()`
     * operators to create {@link ITyneqOrderedEnumerable} instances, which support
     * `thenBy()` and `thenByDescending()` for chaining secondary sort criteria.
     * 
     * Derived classes must implement this to return instances of {@link TyneqOrderedEnumerable}
     * configured with the specified sort criterion.
     * 
     * @typeParam TKey - The type of the sort key.
     * 
     * @param keySelector - Function to extract the sort key from each element.
     * @param comparer - Function to compare two keys.
     * @param descending - Whether to sort in descending order.
     * 
     * @returns An ordered enumerable configured with the sort criterion.
     */
    protected abstract createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean
    ): ITyneqOrderedEnumerable<TSource>;

    protected abstract createCachedEnumerable(source: ITyneqEnumerable<TSource>): ITyneqCachedEnumerable<TSource>;
}