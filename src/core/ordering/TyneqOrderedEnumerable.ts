import { Nullable } from "../../types/utility";
import { BaseEnumerableSorter } from "./BaseEnumerableSorter";
import { TyneqEnumerableSorter } from "./TyneqEnumerableSorter";
import type { IEnumerator, IEnumeratorFactory, IOrderedEnumerable, ITyneqCachedEnumerable, ITyneqEnumerable, ITyneqOrderedEnumerable } from "../../types/core";
import { tyneqQueryNode } from "../../types/queryplan";
import type { IQueryNode } from "../../types/queryplan";
import { QueryNode } from "../../queryplan/QueryNode";
import { TyneqEnumerable } from "../TyneqEnumerable";
import { OrderByEnumerator } from "../../operators/buffer/orderBy";
import { TyneqEnumerableBase } from "../TyneqEnumerableBase";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";
import { TyneqCachedEnumerable } from "../cache/TyneqCachedEnumerable";

/**
 * Represents an ordered enumerable sequence with support for chained sorting criteria.
 *
 * @remarks
 * Encapsulates a single sort criterion. Calling `thenBy()` or `thenByDescending()` creates a
 * new instance with the current one as `parent`, forming a linked chain. During enumeration the
 * chain is traversed to build a composite sorter that applies all criteria in sequence.
 *
 * The sort is deferred to enumeration time. The entire source is buffered on first iteration.
 * The sort is stable: elements with equal keys at all levels preserve their original order.
 *
 * @typeParam TSource - The type of elements in the sequence.
 * @typeParam TKey - The type of the sort key for this sort criterion.
 *
 * @see {@link ITyneqOrderedEnumerable} for the public API.
 * @see {@link IOrderedEnumerable} for the internal infrastructure.
 * @see {@link TyneqEnumerableBase.orderBy} for how this is created.
 *
 * @group Classes
 * @internal
 */
export class TyneqOrderedEnumerable<TSource, TKey> extends TyneqEnumerableBase<TSource> implements ITyneqOrderedEnumerable<TSource> {
    private readonly keySelector: (item: TSource) => TKey;
    private readonly comparer: (a: TKey, b: TKey) => number;
    private readonly descending: boolean;

    public readonly source: ITyneqEnumerable<TSource>;
    public readonly parent: Nullable<IOrderedEnumerable<TSource>>;
    public readonly [tyneqQueryNode]: IQueryNode | null;

    /**
     * @param source - The sequence to order.
     * @param keySelector - Extracts the sort key from each element.
     * @param comparer - Compares two sort keys.
     * @param descending - Whether to sort in descending order.
     * @param parent - The parent ordering for multi-level sorts.
     * @param node - Optional query plan node.
     * @throws {ArgumentError} If `source`, `keySelector`, or `comparer` is undefined.
     */
    public constructor(
        source: ITyneqEnumerable<TSource>,
        keySelector: (item: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean,
        parent?: IOrderedEnumerable<TSource>,
        node?: IQueryNode | null
    ) {
        super();
        ArgumentUtility.checkNotOptional({ source });
        ArgumentUtility.checkNotOptional({ keySelector });
        ArgumentUtility.checkNotOptional({ comparer });

        this.source = source;
        this.keySelector = keySelector;
        this.comparer = comparer;
        this.descending = descending;
        this.parent = parent ?? null;
        this[tyneqQueryNode] = node ?? null;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new OrderByEnumerator<TSource, TKey>(this);
    }

    /**
     * Builds a sorter for this criterion and chains it to `next`.
     *
     * @param next - The next sorter in the chain, or null if this is the last.
     * @returns A sorter for this criterion linked to `next`.
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
     * Adds a secondary ascending sort criterion.
     *
     * @remarks
     * Deferred. Source is fully buffered on first iteration.
     *
     * @typeParam UKey - The type of the secondary sort key.
     *
     * @param keySelector - Extracts the secondary sort key from each element.
     * @param comparer - Compares two secondary keys; defaults to the natural order comparer.
     *
     * @throws {ArgumentError} If `keySelector` is undefined.
     *
     * @see {@link thenByDescending} for secondary descending sort.
     */
    public thenBy<UKey>(
        keySelector: (item: TSource) => UKey,
        comparer?: ((a: UKey, b: UKey) => number) | undefined
    ): ITyneqOrderedEnumerable<TSource> {
        const thenByArgs = comparer !== undefined ? [keySelector, comparer] : [keySelector];
        const node = new QueryNode("thenBy", thenByArgs, this[tyneqQueryNode], "buffer");
        return new TyneqOrderedEnumerable<TSource, UKey>(
            this.source,
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            false,
            this,
            node
        );
    }

    /**
     * Adds a secondary descending sort criterion.
     *
     * @remarks
     * Deferred. Source is fully buffered on first iteration.
     *
     * @typeParam UKey - The type of the secondary sort key.
     *
     * @param keySelector - Extracts the secondary sort key from each element.
     * @param comparer - Compares two secondary keys; defaults to the natural order comparer.
     *
     * @throws {ArgumentError} If `keySelector` is undefined.
     *
     * @see {@link thenBy} for secondary ascending sort.
     */
    public thenByDescending<UKey>(
        keySelector: (item: TSource) => UKey,
        comparer?: ((a: UKey, b: UKey) => number) | undefined): ITyneqOrderedEnumerable<TSource> {
        const thenByDescArgs = comparer !== undefined ? [keySelector, comparer] : [keySelector];
        const node = new QueryNode("thenByDescending", thenByDescArgs, this[tyneqQueryNode], "buffer");
        return new TyneqOrderedEnumerable<TSource, UKey>(
            this.source,
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            true,
            this,
            node
        );
    }

    protected override createEnumerable<TResult>(factory: IEnumeratorFactory<TResult>, node?: IQueryNode | null): ITyneqEnumerable<TResult> {
        return new TyneqEnumerable<TResult>(factory, node);
    }

    protected override createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean,
        node?: IQueryNode | null
    ): ITyneqOrderedEnumerable<TSource> {
        return new TyneqOrderedEnumerable<TSource, TKey>(
            this.source,
            keySelector,
            comparer,
            descending,
            this,
            node
        );
    }

    protected override createCachedEnumerable(source: ITyneqEnumerable<TSource>, node?: IQueryNode | null): ITyneqCachedEnumerable<TSource> {
        return new TyneqCachedEnumerable<TSource>(source, node);
    }
}
