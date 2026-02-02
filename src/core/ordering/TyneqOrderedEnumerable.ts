import { Nullable } from "../../types/utility";
import { BaseEnumerableSorter } from "./BaseEnumerableSorter";
import { TyneqEnumerableSorter } from "./TyneqEnumerableSorter";
import type { IEnumerator, IOrderedEnumerable, IteratorFactory, ITyneqEnumerable, ITyneqOrderedEnumerable } from '../../types/core';
import { TyneqEnumerable } from "../TyneqEnumerable";
import { OrderByEnumerator } from "../../enumerators/buffer/orderBy";
import { TyneqEnumerableBase } from "../TyneqEnumerableBase";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class TyneqOrderedEnumerable<TSource, TKey> extends TyneqEnumerableBase<TSource> implements ITyneqOrderedEnumerable<TSource> {
    private readonly keySelector: (item: TSource) => TKey;
    private readonly comparer: (a: TKey, b: TKey) => number;
    private readonly descending: boolean;
    public parent: Nullable<IOrderedEnumerable<TSource>>;
    public readonly source: ITyneqEnumerable<TSource>;
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

    public override getSource(): IEnumerator<TSource> {
        return new OrderByEnumerator<TSource, TKey>(this.source[Symbol.iterator](), this);
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
    ): ITyneqOrderedEnumerable<TSource> {
        return new TyneqOrderedEnumerable<TSource, UKey>(
            this.source,
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            false,
            this
        );
    }

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

    protected override createEnumerable<TResult>(factory: IteratorFactory<TResult>): ITyneqEnumerable<TResult> {
        return new TyneqEnumerable<TResult>(factory);
    }

    protected override createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean
    ): ITyneqOrderedEnumerable<TSource>{
        return new TyneqOrderedEnumerable<TSource, TKey>(
            this.source,
            keySelector,
            comparer,
            descending,
            this
        );
    }
}