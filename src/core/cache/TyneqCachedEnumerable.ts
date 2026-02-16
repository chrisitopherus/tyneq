import { IEnumerator, IEnumeratorFactory, ITyneqCachedEnumerable, ITyneqEnumerable, ITyneqOrderedEnumerable } from "../../types/core";
import { TyneqOrderedEnumerable } from "../ordering/TyneqOrderedEnumerable";
import { TyneqEnumerable } from "../TyneqEnumerable";
import { TyneqEnumerableBase } from "../TyneqEnumerableBase";

export class TyneqCachedEnumerable<TSource> extends TyneqEnumerableBase<TSource> implements ITyneqCachedEnumerable<TSource> {
    public getEnumerator(): IEnumerator<TSource> {
        // create memoize enumerator and return it
        throw new Error("Method not implemented.");
    }

    public rememoize(): ITyneqCachedEnumerable<TSource> {
        throw new Error("Method not implemented.");
    }

    protected createEnumerable<TResult>(factory: IEnumeratorFactory<TResult>): ITyneqEnumerable<TResult> {
        return new TyneqEnumerable<TResult>(factory);
    }
    protected createOrderedEnumerable<TKey>(keySelector: (x: TSource) => TKey, comparer: (a: TKey, b: TKey) => number, descending: boolean): ITyneqOrderedEnumerable<TSource> {
        return new TyneqOrderedEnumerable<TSource, TKey>(
            this,
            keySelector,
            comparer,
            descending
        );
    }

    protected createCachedEnumerable(): ITyneqCachedEnumerable<TSource> {
        return new TyneqCachedEnumerable<TSource>();
    }
}