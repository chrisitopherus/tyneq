import { Nullable } from "../../types/utility";
import { BaseEnumerableSorter } from "./BaseEnumerableSorter";
import { TyneqEnumerableSorter } from "./TyneqEnumerableSorter";
import type { IEnumerable, IEnumerator, IOrderedEnumerable, IteratorFactory, ITyneqEnumerable, ITyneqOrderedEnumerable } from '../../types/core';
import { TyneqEnumerable } from "../TyneqEnumerable";
import { OrderByEnumerator } from "../../enumerators/buffer/orderBy";
import { WhereEnumerator } from "../../enumerators/streaming/where";
import { WhereOperator } from "../../operators/streaming/where";
import { ConcatOperator } from "../../operators/streaming/concat";
import { AppendOperator } from "../../operators/streaming/append";
import { SelectOperator } from "../../operators/streaming/select";
import { PrependOperator } from "../../operators/streaming/prepend";
import { SelectManyOperator } from "../../operators/streaming/selectMany";
import { SkipOperator } from "../../operators/streaming/skip";
import { SkipLastOperator } from "../../operators/streaming/skipLast";
import { SkipWhileOperator } from "../../operators/streaming/skipWhile";
import { TakeOperator } from "../../operators/streaming/take";
import { TakeWhileOperator } from "../../operators/streaming/takeWhile";
import { ZipOperator } from "../../operators/streaming/zip";
import { DistinctOperator } from "../../operators/buffer/distinct";
import { DistinctByOperator } from "../../operators/buffer/distinctBy";
import { ExceptByOperator } from "../../operators/buffer/exceptBy";
import { ExceptOperator } from "../../operators/buffer/except";
import { IntersectByOperator } from "../../operators/buffer/intersectBy";
import { IntersectOperator } from "../../operators/buffer/intersect";
import { GroupByOperator } from "../../operators/buffer/groupBy";
import { UnionByOperator } from "../../operators/buffer/unionBy";
import { UnionOperator } from "../../operators/buffer/union";
import { ReverseOperator } from "../../operators/buffer/reverse";
import { AllOperator } from "../../operators/terminal/all";
import { AnyOperator } from "../../operators/terminal/any";
import { CountOperator } from "../../operators/terminal/count";
import { ContainsOperator } from "../../operators/terminal/contains";
import { DefaultIfEmptyOperator } from "../../operators/terminal/defaultIfEmpty";
import { TyneqEnumerableBase } from "../TyneqEnumerableBase";

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