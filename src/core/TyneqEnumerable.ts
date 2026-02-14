import { IEnumerable, IEnumerator, IEnumeratorFactory, IteratorFactory, ITyneqEnumerable, ITyneqOrderedEnumerable } from '../types/core';
import { TyneqOrderedEnumerable } from "./ordering/TyneqOrderedEnumerable";
import { TyneqEnumerableBase } from "./TyneqEnumerableBase";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";

export class TyneqEnumerable<TSource> extends TyneqEnumerableBase<TSource> {
    protected readonly enumeratorFactory: IEnumeratorFactory<TSource>;
    
    public constructor(enumeratorFactory: IEnumeratorFactory<TSource>) {
        super();
        ArgumentUtility.checkNotOptional(enumeratorFactory, nameof({ enumeratorFactory }));
        this.enumeratorFactory = enumeratorFactory;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return this.enumeratorFactory.getEnumerator();
    }

    protected override createEnumerable<TResult>(factory: IEnumeratorFactory<TResult>): ITyneqEnumerable<TResult> {
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