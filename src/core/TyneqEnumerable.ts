import { AllOperator } from "../operators/terminal/all";
import { AnyOperator } from "../operators/terminal/any";
import { CountOperator } from "../operators/terminal/count";
import { IEnumerable, IEnumerator, IteratorFactory, ITyneqEnumerable, ITyneqOrderedEnumerable } from '../types/core';
import { TyneqOrderedEnumerable } from "./ordering/TyneqOrderedEnumerable";
import { WhereOperator } from "../operators/streaming/where";
import { AppendOperator } from "../operators/streaming/append";
import { ConcatOperator } from "../operators/streaming/concat";
import { SelectOperator } from "../operators/streaming/select";
import { PrependOperator } from "../operators/streaming/prepend";
import { SelectManyOperator } from "../operators/streaming/selectMany";
import { SkipOperator } from "../operators/streaming/skip";
import { SkipLastOperator } from "../operators/streaming/skipLast";
import { SkipWhileOperator } from "../operators/streaming/skipWhile";
import { TakeOperator } from "../operators/streaming/take";
import { TakeWhileOperator } from "../operators/streaming/takeWhile";
import { ZipOperator } from "../operators/streaming/zip";
import { DistinctOperator } from "../operators/buffer/distinct";
import { DistinctByOperator } from "../operators/buffer/distinctBy";
import { ExceptOperator } from "../operators/buffer/except";
import { ExceptByOperator } from "../operators/buffer/exceptBy";
import { IntersectOperator } from "../operators/buffer/intersect";
import { IntersectByOperator } from "../operators/buffer/intersectBy";
import { GroupByOperator } from "../operators/buffer/groupBy";
import { ReverseOperator } from "../operators/buffer/reverse";
import { UnionOperator } from "../operators/buffer/union";
import { UnionByOperator } from "../operators/buffer/unionBy";
import { ContainsOperator } from "../operators/terminal/contains";
import { DefaultIfEmptyOperator } from "../operators/terminal/defaultIfEmpty";
import { TyneqEnumerableBase } from "./TyneqEnumerableBase";

export class TyneqEnumerable<TSource> extends TyneqEnumerableBase<TSource> {
    public constructor(protected readonly iteratorFactory: IteratorFactory<TSource>) {
        super();
    }

    public override getSource(): IEnumerator<TSource> {
        return this.iteratorFactory();
    }

    protected override createEnumerable<TResult>(factory: IteratorFactory<TResult>): ITyneqEnumerable<TResult> {
        return new TyneqEnumerable<TResult>(factory);
    }

    protected createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean
    ): ITyneqOrderedEnumerable<TSource> {
        return new TyneqOrderedEnumerable<TSource, TKey>(
            this,
            keySelector,
            comparer,
            descending
        );
    }
}