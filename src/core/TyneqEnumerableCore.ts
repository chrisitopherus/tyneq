import { Enumerator, EnumeratorFactory, TyneqCachedSequence, TyneqSequence, TyneqOrderedSequence } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { tyneqQueryNode } from "../types/queryplan";
import type { IQueryNode } from "../types/queryplan";
import { QueryNode } from "../queryplan/QueryNode";

/**
 * Abstract base class providing the infrastructure kernel for all enumerable sequences.
 *
 * @remarks
 * Owns the abstract factory methods ({@link createEnumerable}, {@link createOrderedEnumerable},
 * {@link createCachedEnumerable}) and the four operators that depend only on those factories
 * (`orderBy`, `orderByDescending`, `memoize`, `pipe`). All operator method implementations
 * live in the concrete subclass {@link TyneqEnumerableBase}.
 *
 * This split exists to avoid circular imports: {@link TyneqEnumerableBase} must import
 * all enumerator/operator classes, some of which transitively reference
 * `TyneqEnumerable`, which extends `TyneqEnumerableBase`. Placing the infrastructure
 * in a separate class (`TyneqEnumerableCore`) breaks that cycle because the operator
 * files never need to import from here.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @group Classes
 * @internal
 */
export abstract class TyneqEnumerableCore<TSource> {

    public abstract readonly [tyneqQueryNode]: IQueryNode | null;

    public [Symbol.iterator](): Enumerator<TSource> {
        return this.getEnumerator();
    }

    public abstract getEnumerator(): Enumerator<TSource>;

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
    ): TyneqOrderedSequence<TSource> {
        ArgumentUtility.checkNotOptional({ keySelector });
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
    ): TyneqOrderedSequence<TSource> {
        ArgumentUtility.checkNotOptional({ keySelector });
        const orderByDescArgs = comparer !== undefined ? [keySelector, comparer] : [keySelector];
        const node = new QueryNode("orderByDescending", orderByDescArgs, this[tyneqQueryNode], "buffer");
        return this.createOrderedEnumerable(
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            true,
            node
        );
    }

    /**
     * Caches the results of this sequence so repeated enumeration avoids re-executing the pipeline.
     *
     * @remarks
     * Deferred. Source is not enumerated until the returned sequence is iterated for the first time.
     *
     * Results are cached incrementally as each element is produced. Subsequent enumerations
     * replay from the cache without re-executing upstream operators. The cache is shared across
     * all enumerations of the returned sequence — it is not per-caller.
     *
     * Call `refresh()` on the returned {@link TyneqCachedSequence} to clear the cache and
     * force re-execution of the pipeline on the next enumeration.
     *
     * @returns An {@link TyneqCachedSequence} that exposes `refresh()` in addition to the
     *   standard enumerable operators.
     */
    public memoize(): TyneqCachedSequence<TSource> {
        const node = new QueryNode("memoize", [], this[tyneqQueryNode], "buffer");
        return this.createCachedEnumerable(this as unknown as TyneqSequence<TSource>, node);
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
    public pipe<TResult>(factory: (source: Iterable<TSource>) => Enumerator<TResult> | IterableIterator<TResult>): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ factory });
        const self = this;
        return this.createEnumerable({
            getEnumerator() {
                return factory(self as unknown as Iterable<TSource>);
            },
        } satisfies EnumeratorFactory<TResult>);
    }

    protected abstract createEnumerable<TResult>(factory: EnumeratorFactory<TResult>, node?: IQueryNode | null): TyneqSequence<TResult>;

    protected abstract createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean,
        node?: IQueryNode | null
    ): TyneqOrderedSequence<TSource>;

    protected abstract createCachedEnumerable(source: TyneqSequence<TSource>, node?: IQueryNode | null): TyneqCachedSequence<TSource>;
}
