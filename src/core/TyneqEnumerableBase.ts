import { IEnumerator, IEnumeratorFactory, ITyneqCachedEnumerable, ITyneqEnumerable, ITyneqOrderedEnumerable, KeyValuePair, MinMaxResult } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { tyneqQueryNode } from "../types/queryplan";
import type { IQueryNode } from "../types/queryplan";
import { QueryNode } from "../queryplan/QueryNode";

/**
 * Abstract base class providing the complete LINQ-style operator surface for enumerable sequences.
 *
 * @remarks
 * Implements {@link ITyneqEnumerable} and exposes three categories of operators: terminal
 * (immediate evaluation returning a value), streaming (deferred, O(1) memory), and buffering
 * (deferred, O(n) memory). Query pipelines are lazy — evaluation begins only when a terminal
 * operator or the `for...of` protocol is invoked.
 *
 * Sequences are re-iterable: each enumeration calls {@link getEnumerator} for a fresh iterator.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link TyneqEnumerable} for the standard concrete implementation.
 * @see {@link TyneqOrderedEnumerable} for ordered sequence support.
 *
 * @group Classes
 * @internal
 */
export abstract class TyneqEnumerableBase<TSource> implements ITyneqEnumerable<TSource> {

    public abstract readonly [tyneqQueryNode]: IQueryNode | null;

    public [Symbol.iterator](): IEnumerator<TSource> {
        return this.getEnumerator();
    }

    public abstract getEnumerator(): IEnumerator<TSource>;

    /**
     * Sorts the sequence in ascending order by a key.
     *
     * @remarks
     * Deferred. Source is fully buffered on first iteration.
     *
     * The sort is stable. Supports multi-level sorting via `thenBy()` and `thenByDescending()`.
     *
     * @typeParam TKey - The type of the sort key.
     *
     * @param keySelector - Extracts the sort key from each element.
     * @param comparer - Compares two keys; defaults to the natural order comparer.
     *
     * @throws {ArgumentNullError} If `keySelector` is null.
     * @throws {ArgumentError} If `keySelector` is undefined.
     */
    public orderBy<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: ((a: TKey, b: TKey) => number) | undefined
    ): ITyneqOrderedEnumerable<TSource> {
        const orderByArgs = comparer !== undefined ? [keySelector, comparer] : [keySelector];
        const node = new QueryNode("orderBy", orderByArgs, this[tyneqQueryNode], "buffer");
        return this.createOrderedEnumerable(
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            false,
            node
        );
    }

    /**
     * Sorts the sequence in descending order by a key.
     *
     * @remarks
     * Deferred. Source is fully buffered on first iteration.
     *
     * The sort is stable. Supports multi-level sorting via `thenBy()` and `thenByDescending()`.
     *
     * @typeParam TKey - The type of the sort key.
     *
     * @param keySelector - Extracts the sort key from each element.
     * @param comparer - Compares two keys; defaults to the natural order comparer.
     *
     * @throws {ArgumentNullError} If `keySelector` is null.
     * @throws {ArgumentError} If `keySelector` is undefined.
     *
     * @see {@link orderBy} for ascending sort.
     */
    public orderByDescending<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: ((a: TKey, b: TKey) => number) | undefined
    ): ITyneqOrderedEnumerable<TSource> {
        const orderByDescArgs = comparer !== undefined ? [keySelector, comparer] : [keySelector];
        const node = new QueryNode("orderByDescending", orderByDescArgs, this[tyneqQueryNode], "buffer");
        return this.createOrderedEnumerable(
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            true,
            node
        );
    }

    public memoize(): ITyneqCachedEnumerable<TSource> {
        const node = new QueryNode("memoize", [], this[tyneqQueryNode], "buffer");
        return this.createCachedEnumerable(this, node);
    }

    /**
     * Applies a custom transformation to the sequence using a factory function.
     *
     * @remarks
     * Deferred. Source is not enumerated until the returned sequence is iterated.
     *
     * The `factory` is invoked on each enumeration, ensuring re-iterability. Use this as an
     * escape hatch for transformations not covered by built-in operators.
     *
     * The returned sequence does not participate in query plan tracking — its
     * `{@link tyneqQueryNode}` is `null`.
     *
     * @typeParam TResult - The type of elements produced by the factory.
     *
     * @param factory - Receives the source sequence and returns an iterator; called on each enumeration.
     *
     * @throws {ArgumentNullError} If `factory` is null.
     * @throws {ArgumentError} If `factory` is undefined.
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

    protected abstract createEnumerable<TResult>(factory: IEnumeratorFactory<TResult>, node?: IQueryNode | null): ITyneqEnumerable<TResult>;

    protected abstract createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean,
        node?: IQueryNode | null
    ): ITyneqOrderedEnumerable<TSource>;

    protected abstract createCachedEnumerable(source: ITyneqEnumerable<TSource>, node?: IQueryNode | null): ITyneqCachedEnumerable<TSource>;

    // ── Self-registered operator stubs ────────────────────────────────────────
    // These methods are NOT implemented here. They are injected onto the prototype
    // at module-load time by importing 'src/operators/extensions/index.ts'
    // (which happens via 'src/index.ts').
    //
    // The `declare` keyword tells TypeScript these members exist at runtime
    // without emitting any JavaScript.
    // ─────────────────────────────────────────────────────────────────────────

    // ── Terminal operators ────────────────────────────────────────────────────
    public declare aggregate: <UAccumulate, VResult>(seed: UAccumulate, func: (accumulate: UAccumulate, item: TSource) => UAccumulate, resultSelector: (accumulate: UAccumulate) => VResult) => VResult;
    public declare all: (predicate: (item: TSource) => boolean) => boolean;
    public declare any: (predicate: (item: TSource) => boolean) => boolean;
    public declare average: (selector: (item: TSource) => number) => number;
    public declare consume: () => void;
    public declare contains: (value: TSource) => boolean;
    public declare count: () => number;
    public declare countBy: (predicate: (item: TSource) => boolean) => number;
    public declare elementAt: (index: number) => TSource;
    public declare elementAtOrDefault: (index: number, defaultValue: TSource) => TSource;
    public declare first: (predicate: (item: TSource) => boolean) => TSource;
    public declare firstOrDefault: (predicate: (item: TSource) => boolean, defaultValue: TSource) => TSource;
    public declare indexOf: (predicate: (item: TSource) => boolean, startIndex?: number) => number;
    public declare isNullOrEmpty: () => boolean;
    public declare last: (predicate: (item: TSource) => boolean) => TSource;
    public declare lastOrDefault: (predicate: (item: TSource) => boolean, defaultValue: TSource) => TSource;
    public declare max: (comparer?: (a: TSource, b: TSource) => number) => TSource;
    public declare maxBy: <TKey>(keySelector: (element: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number) => TSource;
    public declare min: (comparer?: (a: TSource, b: TSource) => number) => TSource;
    public declare minBy: <TKey>(keySelector: (element: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number) => TSource;
    public declare minMax: (comparer?: (a: TSource, b: TSource) => number) => MinMaxResult<TSource>;
    public declare sequenceEqual: (other: Iterable<TSource>, equalityComparer?: (a: TSource, b: TSource) => boolean) => boolean;
    public declare single: (predicate: (item: TSource) => boolean) => TSource;
    public declare singleOrDefault: (predicate: (item: TSource) => boolean, defaultValue: TSource) => TSource;
    public declare startsWith: (sequence: Iterable<TSource>) => boolean;
    public declare sum: (selector: (item: TSource) => number) => number;
    public declare toArray: () => TSource[];
    public declare toAsync: () => AsyncIterable<TSource>;
    public declare toMap: <TKey, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>) => Map<TKey, TValue>;
    public declare toRecord: <TKey extends string | number | symbol, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>) => Record<TKey, TValue>;
    public declare toSet: () => Set<TSource>;

    // ── Streaming operators ───────────────────────────────────────────────────
    public declare cast: <U>() => ITyneqEnumerable<U>;
    public declare ofType: <U extends TSource>(guard: (value: TSource) => value is U) => ITyneqEnumerable<U>;
    public declare append: (item: TSource) => ITyneqEnumerable<TSource>;
    public declare chunk: (size: number) => ITyneqEnumerable<TSource[]>;
    public declare concat: (other: Iterable<TSource>) => ITyneqEnumerable<TSource>;
    public declare defaultIfEmpty: (defaultValue: TSource) => ITyneqEnumerable<TSource>;
    public declare intersperse: (delimiter: TSource) => ITyneqEnumerable<TSource>;
    public declare pairwise: () => ITyneqEnumerable<[TSource, TSource]>;
    public declare populate: <TValue>(value: TValue) => ITyneqEnumerable<TValue>;
    public declare prepend: (item: TSource) => ITyneqEnumerable<TSource>;
    public declare scan: <TResult>(seed: TResult, accumulator: (acc: TResult, item: TSource) => TResult) => ITyneqEnumerable<TResult>;
    public declare select: <TResult>(selector: (item: TSource) => TResult) => ITyneqEnumerable<TResult>;
    public declare selectMany: <TResult>(selector: (item: TSource) => Iterable<TResult>) => ITyneqEnumerable<TResult>;
    public declare skip: (count: number) => ITyneqEnumerable<TSource>;
    public declare skipLast: (count: number) => ITyneqEnumerable<TSource>;
    public declare skipWhile: (predicate: (item: TSource) => boolean) => ITyneqEnumerable<TSource>;
    public declare split: (splitOn: (item: TSource) => boolean) => ITyneqEnumerable<TSource[]>;
    public declare take: (count: number) => ITyneqEnumerable<TSource>;
    public declare takeWhile: (predicate: (item: TSource) => boolean) => ITyneqEnumerable<TSource>;
    public declare tap: (action: (item: TSource) => void) => ITyneqEnumerable<TSource>;
    public declare tapIf: (action: (item: TSource) => void, predicate: () => boolean) => ITyneqEnumerable<TSource>;
    public declare throttle: (count: number) => ITyneqEnumerable<TSource>;
    public declare where: (predicate: (item: TSource) => boolean) => ITyneqEnumerable<TSource>;
    public declare window: (size: number) => ITyneqEnumerable<TSource[]>;
    public declare zip: <TOther, TResult>(other: Iterable<TOther>, selector: (first: TSource, second: TOther) => TResult) => ITyneqEnumerable<TResult>;

    // ── Buffer operators ──────────────────────────────────────────────────────
    public declare backsert: (index: number, other: Iterable<TSource>) => ITyneqEnumerable<TSource>;
    public declare distinct: () => ITyneqEnumerable<TSource>;
    public declare distinctBy: <TKey>(keySelector: (item: TSource) => TKey) => ITyneqEnumerable<TSource>;
    public declare except: (excludedValues: Iterable<TSource>) => ITyneqEnumerable<TSource>;
    public declare exceptBy: <TKey>(excludedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey) => ITyneqEnumerable<TSource>;
    public declare groupBy: <TKey, TValue, TResult>(keySelector: (item: TSource) => TKey, valueSelector: (item: TSource) => TValue, resultSelector: (key: TKey, values: ITyneqEnumerable<TValue>) => TResult) => ITyneqEnumerable<TResult>;
    public declare groupJoin: <TInner, TKey, TResult>(inner: Iterable<TInner>, outerKeySelector: (outer: TSource) => TKey, innerKeySelector: (inner: TInner) => TKey, resultSelector: (outer: TSource, group: ITyneqEnumerable<TInner>) => TResult) => ITyneqEnumerable<TResult>;
    public declare intersect: (intersectedValues: Iterable<TSource>) => ITyneqEnumerable<TSource>;
    public declare intersectBy: <TKey>(intersectedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey) => ITyneqEnumerable<TSource>;
    public declare join: <TInner, TKey, TResult>(inner: Iterable<TInner>, outerKeySelector: (outer: TSource) => TKey, innerKeySelector: (inner: TInner) => TKey, resultSelector: (outer: TSource, inner: TInner) => TResult) => ITyneqEnumerable<TResult>;
    public declare reverse: () => ITyneqEnumerable<TSource>;
    public declare shuffle: () => ITyneqEnumerable<TSource>;
    public declare union: (otherValues: Iterable<TSource>) => ITyneqEnumerable<TSource>;
    public declare unionBy: <TKey>(otherValues: Iterable<TSource>, keySelector: (item: TSource) => TKey) => ITyneqEnumerable<TSource>;
}
