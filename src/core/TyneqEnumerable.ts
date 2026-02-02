import { IEnumerator, IteratorFactory, ITyneqEnumerable, ITyneqOrderedEnumerable } from '../types/core';
import { TyneqOrderedEnumerable } from "./ordering/TyneqOrderedEnumerable";
import { TyneqEnumerableBase } from "./TyneqEnumerableBase";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";

export class TyneqEnumerable<TSource> extends TyneqEnumerableBase<TSource> {
    public constructor(protected readonly iteratorFactory: IteratorFactory<TSource>) {
        super();
        ArgumentUtility.checkNotOptional(iteratorFactory, nameof({ iteratorFactory }));
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