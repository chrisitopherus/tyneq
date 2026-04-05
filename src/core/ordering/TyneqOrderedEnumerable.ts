import { Nullable } from "../../types/utility";
import { BaseEnumerableSorter } from "./BaseEnumerableSorter";
import { TyneqEnumerableSorter } from "./TyneqEnumerableSorter";
import type { Enumerator, EnumeratorFactory, OrderedEnumerable, TyneqCachedSequence, TyneqSequence, TyneqOrderedSequence, Comparer } from "../../types/core";
import { tyneqQueryNode } from "../../types/queryplan";
import type { QueryPlanNode } from "../../types/queryplan";
import { QueryNode } from "../../queryplan/QueryNode";
import { TyneqEnumerable } from "../TyneqEnumerable";
import { OrderByEnumerator } from "../../enumerators/buffer/orderBy";
import { TyneqEnumerableBase } from "../TyneqEnumerableBase";
import { TyneqComparer } from "../TyneqComparer";
import { ArgumentUtility } from "../../utility/ArgumentUtility";
import { nameof } from "../../utility/nameof";
import { TyneqCachedEnumerable } from "../TyneqCachedEnumerable";
import { sequence } from "../../plugin/decorators/sequence";
import { builtin } from "../../plugin/decorators/builtin";

/**
 * Concrete implementation of {@link TyneqOrderedSequence}.
 *
 * @remarks
 * Created by `orderBy` and `orderByDescending`. Chains to a parent `TyneqOrderedEnumerable`
 * via `thenBy` / `thenByDescending` to build a multi-key sorter.
 *
 * @internal
 */
@sequence
export class TyneqOrderedEnumerable<TSource, TKey> extends TyneqEnumerableBase<TSource> implements TyneqOrderedSequence<TSource> {
    private readonly keySelector: (item: TSource) => TKey;
    private readonly comparer: Comparer<TKey>;
    private readonly descending: boolean;

    public readonly source: TyneqSequence<TSource>;
    public readonly parent: Nullable<OrderedEnumerable<TSource>>;
    public readonly [tyneqQueryNode]: QueryPlanNode | null;

    
    public constructor(
        source: TyneqSequence<TSource>,
        keySelector: (item: TSource) => TKey,
        comparer: Comparer<TKey>,
        descending: boolean,
        parent?: OrderedEnumerable<TSource>,
        node?: QueryPlanNode | null
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

    @builtin({ kind: "buffer" })
    public thenBy<UKey>(
        keySelector: (item: TSource) => UKey,
        comparer?: Comparer<UKey>
    ): TyneqOrderedSequence<TSource> {
        const thenByArgs = comparer !== undefined ? [keySelector, comparer] : [keySelector];
        const node = new QueryNode("thenBy", thenByArgs, this[tyneqQueryNode], "buffer");
        return new TyneqOrderedEnumerable<TSource, UKey>(
            this.source,
            keySelector,
            comparer ?? TyneqComparer.defaultComparer,
            false,
            this,
            node
        );
    }

    @builtin({ kind: "buffer" })
    public thenByDescending<UKey>(
        keySelector: (item: TSource) => UKey,
        comparer?: Comparer<UKey>
    ): TyneqOrderedSequence<TSource> {
        const thenByDescArgs = comparer !== undefined ? [keySelector, comparer] : [keySelector];
        const node = new QueryNode("thenByDescending", thenByDescArgs, this[tyneqQueryNode], "buffer");
        return new TyneqOrderedEnumerable<TSource, UKey>(
            this.source,
            keySelector,
            comparer ?? TyneqComparer.defaultComparer,
            true,
            this,
            node
        );
    }

    protected override createEnumerable<TResult>(factory: EnumeratorFactory<TResult>, node?: QueryPlanNode | null): TyneqSequence<TResult> {
        return new TyneqEnumerable<TResult>(factory, node);
    }

    protected override createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: Comparer<TKey>,
        descending: boolean,
        node?: QueryPlanNode | null
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

    protected override createCachedEnumerable(source: TyneqSequence<TSource>, node?: QueryPlanNode | null): TyneqCachedSequence<TSource> {
        return new TyneqCachedEnumerable<TSource>(source, node);
    }
}
