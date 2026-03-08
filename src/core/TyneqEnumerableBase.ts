import { IEnumerator, IEnumeratorFactory, ITyneqCachedEnumerable, ITyneqEnumerable, ITyneqOrderedEnumerable, KeyValuePair, MinMaxResult } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";

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
 * - internal factory methods for wrapping operators and ordered sequences
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
 *
 * @group Classes
 * @internal
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
    * This method is called automatically by the iterable `Symbol.iterator` method and does not
     * need to be invoked directly in typical usage.
     *
     * @returns A fresh iterator positioned before the first element.
     */
    public abstract getEnumerator(): IEnumerator<TSource>;

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
    public pipe<TResult>(factory: (source: Iterable<TSource>) => IEnumerator<TResult> | IterableIterator<TResult>): ITyneqEnumerable<TResult> {
        ArgumentUtility.checkNotOptional({ factory });
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

    // ── Self-registered operator stubs ────────────────────────────────────────
    // These methods are NOT implemented here. They are injected onto the prototype
    // at module-load time by importing 'src/operators/extensions/index.ts'
    // (which happens via 'src/index.ts').
    //
    // The `declare` keyword tells TypeScript these members exist at runtime
    // without emitting any JavaScript.
    // ─────────────────────────────────────────────────────────────────────────

    // ── Terminal operators ────────────────────────────────────────────────────
    declare aggregate: <UAccumulate, VResult>(seed: UAccumulate, func: (accumulate: UAccumulate, item: TSource) => UAccumulate, resultSelector: (accumulate: UAccumulate) => VResult) => VResult;
    declare all: (predicate: (item: TSource) => boolean) => boolean;
    declare any: (predicate: (item: TSource) => boolean) => boolean;
    declare average: (selector: (item: TSource) => number) => number;
    declare consume: () => void;
    declare contains: (value: TSource) => boolean;
    declare count: () => number;
    declare countBy: (predicate: (item: TSource) => boolean) => number;
    declare defaultIfEmpty: (defaultValue: TSource) => ITyneqEnumerable<TSource>;
    declare elementAt: (index: number) => TSource;
    declare elementAtOrDefault: (index: number, defaultValue: TSource) => TSource;
    declare first: (predicate: (item: TSource) => boolean) => TSource;
    declare firstOrDefault: (predicate: (item: TSource) => boolean, defaultValue: TSource) => TSource;
    declare indexOf: (predicate: (item: TSource) => boolean, startIndex?: number) => number;
    declare isNullOrEmpty: () => boolean;
    declare last: (predicate: (item: TSource) => boolean) => TSource;
    declare lastOrDefault: (predicate: (item: TSource) => boolean, defaultValue: TSource) => TSource;
    declare max: (comparer?: (a: TSource, b: TSource) => number) => TSource;
    declare maxBy: <TKey>(keySelector: (element: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number) => TSource;
    declare min: (comparer?: (a: TSource, b: TSource) => number) => TSource;
    declare minBy: <TKey>(keySelector: (element: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number) => TSource;
    declare minMax: (comparer?: (a: TSource, b: TSource) => number) => MinMaxResult<TSource>;
    declare sequenceEqual: (other: Iterable<TSource>, equalityComparer?: (a: TSource, b: TSource) => boolean) => boolean;
    declare single: (predicate: (item: TSource) => boolean) => TSource;
    declare singleOrDefault: (predicate: (item: TSource) => boolean, defaultValue: TSource) => TSource;
    declare startsWith: (sequence: Iterable<TSource>) => boolean;
    declare sum: (selector: (item: TSource) => number) => number;
    declare toArray: () => TSource[];
    declare toMap: <TKey, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>) => Map<TKey, TValue>;
    declare toRecord: <TKey extends string | number | symbol, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>) => Record<TKey, TValue>;
    declare toSet: () => Set<TSource>;

    // ── Streaming operators ───────────────────────────────────────────────────
    declare append: (item: TSource) => ITyneqEnumerable<TSource>;
    declare chunk: (size: number) => ITyneqEnumerable<TSource[]>;
    declare concat: (other: Iterable<TSource>) => ITyneqEnumerable<TSource>;
    declare intersperse: (delimiter: TSource) => ITyneqEnumerable<TSource>;
    declare pairwise: () => ITyneqEnumerable<[TSource, TSource]>;
    declare populate: <TValue>(value: TValue) => ITyneqEnumerable<TValue>;
    declare prepend: (item: TSource) => ITyneqEnumerable<TSource>;
    declare scan: <TResult>(seed: TResult, accumulator: (acc: TResult, item: TSource) => TResult) => ITyneqEnumerable<TResult>;
    declare select: <TResult>(selector: (item: TSource) => TResult) => ITyneqEnumerable<TResult>;
    declare selectMany: <TResult>(selector: (item: TSource) => Iterable<TResult>) => ITyneqEnumerable<TResult>;
    declare skip: (count: number) => ITyneqEnumerable<TSource>;
    declare skipLast: (count: number) => ITyneqEnumerable<TSource>;
    declare skipWhile: (predicate: (item: TSource) => boolean) => ITyneqEnumerable<TSource>;
    declare split: (splitOn: (item: TSource) => boolean) => ITyneqEnumerable<TSource[]>;
    declare take: (count: number) => ITyneqEnumerable<TSource>;
    declare takeWhile: (predicate: (item: TSource) => boolean) => ITyneqEnumerable<TSource>;
    declare tap: (action: (item: TSource) => void) => ITyneqEnumerable<TSource>;
    declare tapIf: (action: (item: TSource) => void, predicate: () => boolean) => ITyneqEnumerable<TSource>;
    declare throttle: (count: number) => ITyneqEnumerable<TSource>;
    declare where: (predicate: (item: TSource) => boolean) => ITyneqEnumerable<TSource>;
    declare window: (size: number) => ITyneqEnumerable<TSource[]>;
    declare zip: <TOther, TResult>(other: Iterable<TOther>, selector: (first: TSource, second: TOther) => TResult) => ITyneqEnumerable<TResult>;

    // ── Buffer operators ──────────────────────────────────────────────────────
    declare backsert: (index: number, other: Iterable<TSource>) => ITyneqEnumerable<TSource>;
    declare distinct: () => ITyneqEnumerable<TSource>;
    declare distinctBy: <TKey>(keySelector: (item: TSource) => TKey) => ITyneqEnumerable<TSource>;
    declare except: (excludedValues: Iterable<TSource>) => ITyneqEnumerable<TSource>;
    declare exceptBy: <TKey>(excludedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey) => ITyneqEnumerable<TSource>;
    declare groupBy: <TKey, TValue, TResult>(keySelector: (item: TSource) => TKey, valueSelector: (item: TSource) => TValue, resultSelector: (key: TKey, values: ITyneqEnumerable<TValue>) => TResult) => ITyneqEnumerable<TResult>;
    declare groupJoin: <TInner, TKey, TResult>(inner: Iterable<TInner>, outerKeySelector: (outer: TSource) => TKey, innerKeySelector: (inner: TInner) => TKey, resultSelector: (outer: TSource, group: ITyneqEnumerable<TInner>) => TResult) => ITyneqEnumerable<TResult>;
    declare intersect: (intersectedValues: Iterable<TSource>) => ITyneqEnumerable<TSource>;
    declare intersectBy: <TKey>(intersectedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey) => ITyneqEnumerable<TSource>;
    declare join: <TInner, TKey, TResult>(inner: Iterable<TInner>, outerKeySelector: (outer: TSource) => TKey, innerKeySelector: (inner: TInner) => TKey, resultSelector: (outer: TSource, inner: TInner) => TResult) => ITyneqEnumerable<TResult>;
    declare reverse: () => ITyneqEnumerable<TSource>;
    declare shuffle: () => ITyneqEnumerable<TSource>;
    declare union: (otherValues: Iterable<TSource>) => ITyneqEnumerable<TSource>;
    declare unionBy: <TKey>(otherValues: Iterable<TSource>, keySelector: (item: TSource) => TKey) => ITyneqEnumerable<TSource>;
}
