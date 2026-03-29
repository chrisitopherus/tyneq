import { Nullable } from "../../types/utility";
import { BaseEnumerableSorter } from "./BaseEnumerableSorter";
import { TyneqEnumerableSorter } from "./TyneqEnumerableSorter";
import type { Enumerator, EnumeratorFactory, OrderedEnumerable, TyneqCachedSequence, TyneqSequence, TyneqOrderedSequence } from "../../types/core";
import { tyneqQueryNode } from "../../types/queryplan";
import type { IQueryNode } from "../../types/queryplan";
import { QueryNode } from "../../queryplan/QueryNode";
import { TyneqEnumerable } from "../TyneqEnumerable";
import { OrderByEnumerator } from "../../enumerators/buffer/orderBy";
import { TyneqEnumerableBase } from "../TyneqEnumerableBase";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";
import { TyneqCachedEnumerable } from "../TyneqCachedEnumerable";

/**
 * Concrete implementation of {@link TyneqOrderedSequence}.
 *
 * @remarks
 * Created by `orderBy` and `orderByDescending`. Chains to a parent `TyneqOrderedEnumerable`
 * via `thenBy` / `thenByDescending` to build a multi-key sorter.
 *
 * @internal
 */
export class TyneqOrderedEnumerable<TSource, TKey> extends TyneqEnumerableBase<TSource> implements TyneqOrderedSequence<TSource> {
    private readonly keySelector: (item: TSource) => TKey;
    private readonly comparer: (a: TKey, b: TKey) => number;
    private readonly descending: boolean;

    public readonly source: TyneqSequence<TSource>;
    public readonly parent: Nullable<OrderedEnumerable<TSource>>;
    public readonly [tyneqQueryNode]: IQueryNode | null;

    
    public constructor(
        source: TyneqSequence<TSource>,
        keySelector: (item: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean,
        parent?: OrderedEnumerable<TSource>,
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

    public override getEnumerator(): Enumerator<TSource> {
        return new OrderByEnumerator<TSource, TKey>(this);
    }

    
    public getSorter(next: Nullable<BaseEnumerableSorter<TSource>>): BaseEnumerableSorter<TSource> {
        return new TyneqEnumerableSorter<TSource, TKey>(
            this.keySelector,
            this.comparer,
            this.descending,
            next ?? undefined
        );
    }

    
    public thenBy<UKey>(
        keySelector: (item: TSource) => UKey,
        comparer?: ((a: UKey, b: UKey) => number) | undefined
    ): TyneqOrderedSequence<TSource> {
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

    
    public thenByDescending<UKey>(
        keySelector: (item: TSource) => UKey,
        comparer?: ((a: UKey, b: UKey) => number) | undefined): TyneqOrderedSequence<TSource> {
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

    protected override createEnumerable<TResult>(factory: EnumeratorFactory<TResult>, node?: IQueryNode | null): TyneqSequence<TResult> {
        return new TyneqEnumerable<TResult>(factory, node);
    }

    protected override createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean,
        node?: IQueryNode | null
    ): TyneqOrderedSequence<TSource> {
        return new TyneqOrderedEnumerable<TSource, TKey>(
            this.source,
            keySelector,
            comparer,
            descending,
            this,
            node
        );
    }

    protected override createCachedEnumerable(source: TyneqSequence<TSource>, node?: IQueryNode | null): TyneqCachedSequence<TSource> {
        return new TyneqCachedEnumerable<TSource>(source, node);
    }
}
