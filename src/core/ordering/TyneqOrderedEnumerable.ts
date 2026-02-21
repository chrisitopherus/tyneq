import { Nullable } from "../../types/utility";
import { BaseEnumerableSorter } from "./BaseEnumerableSorter";
import { TyneqEnumerableSorter } from "./TyneqEnumerableSorter";
import type { IEnumerator, IEnumeratorFactory, IOrderedEnumerable, ITyneqCachedEnumerable, ITyneqEnumerable, ITyneqOrderedEnumerable } from '../../types/core';
import { TyneqEnumerable } from "../TyneqEnumerable";
import { OrderByEnumerator } from "../../enumerators/buffer/orderBy";
import { TyneqEnumerableBase } from "../TyneqEnumerableBase";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";
import { TyneqCachedEnumerable } from "../cache/TyneqCachedEnumerable";

/**
 * Represents an ordered (sorted) enumerable sequence with support for chained sorting.
 * 
 * @remarks
 * `TyneqOrderedEnumerable<TSource, TKey>` encapsulates a sequence that has been ordered
 * by one or more sort criteria. It implements both {@link ITyneqOrderedEnumerable} and
 * {@link IOrderedEnumerable<TSource>} to provide public sorting operators and internal
 * sorting infrastructure.
 * 
 * ## Multi-level Sorting via Chaining
 * 
 * Each instance represents a single sort criterion. When `thenBy()` or `thenByDescending()`
 * is called, a new `TyneqOrderedEnumerable` is created with the current instance passed
 * as the `parent`. This forms a linked chain:
 * 
 * ```
 * orderBy(x => x.age)           // TyneqOrderedEnumerable (parent=null)
 *   .thenBy(x => x.name)        // TyneqOrderedEnumerable (parent=first)
 *   .thenBy(x => x.id)          // TyneqOrderedEnumerable (parent=second)
 * ```
 * 
 * During enumeration, this chain is traversed in reverse (from child to parent),
 * creating a composite {@link BaseEnumerableSorter} that applies all criteria.
 * 
 * ## Lazy Evaluation
 * 
 * The sort is **not** performed until enumeration begins (via `for...of`, `toArray()`, etc.).
 * This lazy approach allows:
 * - Deferring expensive sorting operations
 * - Combining sorting with other lazy operators
 * - Short-circuiting via operators like `take()` (some elements may never be sorted)
 * 
 * ## Memory and Performance
 * 
 * When enumeration occurs:
 * - The source sequence is buffered entirely into memory (necessary for sorting)
 * - Sort keys are extracted and cached for efficient comparisons (O(n) extra space)
 * - Elements are sorted using the composite sorter (O(n log n) time)
 * - Results are yielded one by one
 * 
 * **Note**: Unlike some LINQ implementations, this library does not optimize for
 * taking only a few elements from a large sorted sequence. The entire sequence is
 * sorted regardless of how many elements are consumed.
 * 
 * ## Stability
 * 
 * The sort is **stable**: elements with equal keys at all levels maintain their
 * original relative order from the unordered sequence.
 * 
 * @typeParam TSource - The type of elements in the sequence.
 * @typeParam TKey - The type of the sort key for this particular sort criterion.
 * 
 * @example
 * ```typescript
 * import { Tyneq } from 'tyneq';
 * 
 * interface Person { id: number; name: string; age: number; }
 * const people: Person[] = [
 *   { id: 3, name: 'Alice', age: 30 },
 *   { id: 2, name: 'Bob', age: 25 },
 *   { id: 1, name: 'Alice', age: 28 }
 * ];
 * 
 * // Single criterion
 * const byName = Tyneq.from(people)
 *   .orderBy(p => p.name)
 *   .toArray();
 * // Result: Alice(id:3), Alice(id:1), Bob (maintains original order for equal names)
 * 
 * // Multi-level criteria
 * const byNameThenAge = Tyneq.from(people)
 *   .orderBy(p => p.name)
 *   .thenBy(p => p.age)
 *   .toArray();
 * // Result: Alice(age:28), Alice(age:30), Bob
 * 
 * // With custom comparator
 * const byNameDesc = Tyneq.from(people)
 *   .orderBy(p => p.name, (a, b) => b.localeCompare(a)  // custom descending
 *   .toArray();
 * // Result: Bob, Alice(id:3), Alice(id:1)
 * ```
 * 
 * @see {@link ITyneqOrderedEnumerable} for the public API.
 * @see {@link IOrderedEnumerable} for the internal infrastructure.
 * @see {@link TyneqEnumerableBase.orderBy} for how this is created.
 */
export class TyneqOrderedEnumerable<TSource, TKey> extends TyneqEnumerableBase<TSource> implements ITyneqOrderedEnumerable<TSource> {
    /**
     * Function to extract the sort key from each element.
     * 
     * @remarks
     * Stored for use by {@link getSorter} when creating the sorter for this level.
     * Called once per element during enumeration.
     */
    private readonly keySelector: (item: TSource) => TKey;

    /**
     * Function to compare two sort keys.
     * 
     * @remarks
     * Stored for use by {@link getSorter}. Should follow JavaScript comparator conventions.
     * Result is direction-adjusted (multiplied by -1 for descending) by the sorter.
     */
    private readonly comparer: (a: TKey, b: TKey) => number;

    /**
     * Whether to sort in descending order.
     * 
     * @remarks
     * Stored for use by {@link getSorter}. When true, the sorter inverts all comparisons.
     */
    private readonly descending: boolean;

    /**
     * The source sequence being ordered.
     * 
     * @remarks
     * This is the original enumerable, not a previous sort step.
     * When using `thenBy()`, subsequent `TyneqOrderedEnumerable` instances chain
     * via the `parent` property but all reference the same underlying `source`.
     */
    public readonly source: ITyneqEnumerable<TSource>;

    /**
     * The parent sort criterion in a multi-level sort chain, or null if this is primary.
     * 
     * @remarks
     * When `thenBy()` or `thenByDescending()` is called, a new instance is created
     * with this instance passed as `parent`. During enumeration, the parent chain is
     * traversed (via `getSorter()`) to build the complete composite sorter.
     */
    public readonly parent: Nullable<IOrderedEnumerable<TSource>>;

    /**
     * Creates a new TyneqOrderedEnumerable.
     * 
     * @remarks
     * Initializes a new instance representing a single sort criterion. When created via
     * {@link TyneqEnumerableBase.orderBy} or {@link TyneqEnumerableBase.orderByDescending},
     * the parent is null, making this the primary sort. When created via {@link thenBy}
     * or {@link thenByDescending}, the parent references the previous ordering, forming
     * a chain for multi-level sorting.
     * 
     * All parameters are validated to ensure they are not null or undefined.
     * 
     * @param source - The sequence to order. Must not be null or undefined.
     * @param keySelector - Function to extract the sort key. Must not be null or undefined.
     * @param comparer - Function to compare keys. Must not be null or undefined.
     * @param descending - Whether to sort in descending order.
     * @param parent - Optional parent ordering for multi-level sorts.
     *                 When provided, this determines the secondary sort criterion.
     * 
     * @throws {@link ArgumentError} when `source`, `keySelector`, or `comparer` is undefined.
     */
    public constructor(
        source: ITyneqEnumerable<TSource>,
        keySelector: (item: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean,
        parent?: IOrderedEnumerable<TSource>
    ) {
        super();
        ArgumentUtility.checkNotOptional(source, nameof({ source }));
        ArgumentUtility.checkNotOptional(keySelector, nameof({ keySelector }));
        ArgumentUtility.checkNotOptional(comparer, nameof({ comparer }));

        this.source = source;
        this.keySelector = keySelector;
        this.comparer = comparer;
        this.descending = descending;
        this.parent = parent ?? null;
    }

    /**
     * Returns an enumerator that iterates through the sorted sequence.
     * 
     * @remarks
     * Creates an {@link OrderByEnumerator} that:
     * 1. Buffers all elements from the source into an array
     * 2. Creates a composite sorter using {@link getSorter} and the parent chain
     * 3. Sorts the buffered elements according to all sort criteria
     * 4. Yields elements in sorted order
     * 
     * The sorting is deferred to enumeration time, not construction time.
     * Each enumeration produces a fresh enumerator, allowing re-iteration.
     * 
     * **Performance**: O(n log n) time for sorting, O(n) space for buffering.
     * Each enumeration performs a fresh sort operation.
     * 
     * @returns A new {@link OrderByEnumerator} positioned before the first element.
     */
    public override getEnumerator(): IEnumerator<TSource> {
        return new OrderByEnumerator<TSource, TKey>(this.source[Symbol.iterator](), this);
    }

    /**
     * Creates a sorter for this sort criterion and chains it to the next.
     * 
     * @remarks
     * This method is called by {@link OrderByEnumerator} to build the composite sorter.
     * It creates a {@link TyneqEnumerableSorter} for this level and attaches the next
     * sorter, enabling multi-level comparisons.
     * 
     * During sorting, comparisons flow through the sorter chain:
     * 1. This sorter compares by its criterion
     * 2. If equal, delegates to the next sorter
     * 3. If no next, applies stability (original order)
     * 
     * @param next - The next sorter in the chain (from a parent ordering), or null if last.
     *               Usually provided by the parent's {@link getSorter} call.
     * @returns A new {@link TyneqEnumerableSorter} for this criterion, linked to `next`.
     * 
     * @remarks
     * Implementation detail: This method is part of the internal {@link IOrderedEnumerable}
     * interface. It's not intended to be called directly by library consumers.
     * 
     * The sorter chain is built in reverse order (from child to parent) during enumeration.
     * Each sorter delegates to the next when keys are equal, enabling stable multi-level sorting.
     */
    public getSorter(next: Nullable<BaseEnumerableSorter<TSource>>): BaseEnumerableSorter<TSource> {
        return new TyneqEnumerableSorter<TSource, TKey>(
            this.keySelector,
            this.comparer,
            this.descending,
            next ?? undefined
        );
    }

    /**
     * Performs a secondary ordering in ascending order.
     * 
     * @remarks
     * Creates a new `TyneqOrderedEnumerable` for the secondary sort criterion,
     * with this instance passed as the parent. This enables multi-level sorting.
     * 
     * The returned sequence will sort primarily by this ordering's keys, and
     * secondarily by the new key when elements are equal.
     * 
     * The sort is still lazy and deferred to enumeration time. All established
     * sort criteria are applied when the sequence is enumerated.
     * 
     * ## Comparator Default
     * 
     * If no comparator is provided, a default comparator using `<` and `>` operators
     * is used: `(a, b) => (a < b ? -1 : a > b ? 1 : 0)`. This works correctly for
     * numbers, strings, and any type supporting comparison operators. For complex types,
     * provide a custom comparator.
     * 
     * @typeParam UKey - The type of the secondary sort key.
     * @param keySelector - Function to extract the secondary sort key from each element.
     *                      Must not be null or undefined.
     * @param comparer - Optional comparator function for the secondary key.
     *                   If omitted, uses default comparison via operators.
     * @returns A new {@link ITyneqOrderedEnumerable} with the secondary criterion added.
     * 
     * @throws {@link ArgumentError} when `keySelector` is undefined.
     * 
     * @see {@link thenByDescending} - For secondary descending sort.
     * @see {@link TyneqEnumerableBase.orderBy} - For primary ascending sort.
     */
    public thenBy<UKey>(
        keySelector: (item: TSource) => UKey,
        comparer?: ((a: UKey, b: UKey) => number) | undefined
    ): ITyneqOrderedEnumerable<TSource> {
        return new TyneqOrderedEnumerable<TSource, UKey>(
            this.source,
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            false,
            this
        );
    }

    /**
     * Performs a secondary ordering in descending order.
     * 
     * @remarks
     * Creates a new `TyneqOrderedEnumerable` for the secondary sort criterion in
     * descending order, with this instance passed as the parent.
     * 
     * The returned sequence will sort primarily by this ordering's keys (in the
     * established direction), and secondarily by the new key in **descending** order
     * when elements are equal.
     * 
     * All established sort criteria are applied when the sequence is enumerated.
     * 
     * ## Comparator Default
     * 
     * If no comparator is provided, a default comparator is used:
     * `(a, b) => (a < b ? -1 : a > b ? 1 : 0)`, and then inverted by `descending=true`.
     * For custom inverse comparisons, provide a custom comparator.
     * 
     * @typeParam UKey - The type of the secondary sort key.
     * @param keySelector - Function to extract the secondary sort key from each element.
     *                      Must not be null or undefined.
     * @param comparer - Optional comparator function for the secondary key.
     *                   If omitted, uses default comparison via operators.
     * @returns A new {@link ITyneqOrderedEnumerable} with the descending criterion added.
     * 
     * @throws {@link ArgumentError} when `keySelector` is undefined.
     * 
     * @see {@link thenBy} - For secondary ascending sort.
     * @see {@link TyneqEnumerableBase.orderByDescending} - For primary descending sort.
     */
    public thenByDescending<UKey>(
        keySelector: (item: TSource) => UKey,
        comparer?: ((a: UKey, b: UKey) => number) | undefined): ITyneqOrderedEnumerable<TSource> {
        return new TyneqOrderedEnumerable<TSource, UKey>(
            this.source,
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            true,
            this
        );
    }

    /**
     * Creates a regular enumerable from an iterator factory.
     * 
     * @remarks
     * This protected method is part of the factory pattern infrastructure used by query operators.
     * It returns a {@link TyneqEnumerable} (non-ordered) rather than preserving the ordered type.
     * This is intentional: operators like `select()`, `where()`, and `take()` applied to an ordered
     * sequence do not preserve ordering semantics.
     * 
     * The returned enumerable is lazy-evaluated and re-iterable. Each enumeration creates a fresh
     * enumerator by calling the factory function.
     * 
     * @typeParam TResult - The element type of the result enumerable.
     * 
     * @param factory - An iterator factory that produces fresh {@link IEnumerator} instances.
     *                  Must support being called multiple times to create independent enumerators.
     * 
     * @returns A {@link TyneqEnumerable} wrapping the factory.
     * 
     * @see {@link createOrderedEnumerable} for creating new ordered enumerables.
     * @see {@link TyneqEnumerableBase} for the base class defining this pattern.
     */
    protected override createEnumerable<TResult>(factory: IEnumeratorFactory<TResult>): ITyneqEnumerable<TResult> {
        return new TyneqEnumerable<TResult>(factory);
    }

    /**
     * Creates a new ordered enumerable with a new primary sort criterion.
     * 
     * @remarks
     * This method is part of the underlying factory pattern infrastructure.
     * It's called when an operation (like `orderBy`) needs to create a new
     * ordered enumerable while chaining from this one.
     * 
     * It's not typically called directly by library consumers; instead, methods like
     * {@link thenBy} and {@link thenByDescending} are used for secondary criteria.
     * 
     * @typeParam TKey - The type of the new primary sort key.
     * @param keySelector - Function to extract the new sort key.
     * @param comparer - Function to compare the new sort keys.
     * @param descending - Whether to sort in descending order.
     * @returns A new {@link ITyneqOrderedEnumerable} with the new primary criterion.
     */
    protected override createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean
    ): ITyneqOrderedEnumerable<TSource> {
        return new TyneqOrderedEnumerable<TSource, TKey>(
            this.source,
            keySelector,
            comparer,
            descending,
            this
        );
    }

    protected override createCachedEnumerable(source: ITyneqEnumerable<TSource>): ITyneqCachedEnumerable<TSource> {
        return new TyneqCachedEnumerable<TSource>(source);
    }
}