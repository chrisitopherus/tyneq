import { TyneqCachedEnumerable } from "../../core/cache/TyneqCachedEnumerable";
import { IEnumerator } from '../../types/core';

export class MemoizeEnumerator<TSource> implements IEnumerator<TSource> {
    private readonly cachedEnumerable: TyneqCachedEnumerable<TSource>;
    private index = 0;

    public constructor(cachedEnumerable: TyneqCachedEnumerable<TSource>) {
        this.cachedEnumerable = cachedEnumerable;
    }

    public next(): IteratorResult<TSource> {
        const result = this.cachedEnumerable.tryGetAtFromCache(this.index);

        if (!result.has) {
            return { done: true, value: undefined };
        }

        this.index++;
        return { done: false, value: result.value };
    }

    public return(value?: unknown): IteratorResult<TSource> {
        return { done: true, value: undefined };
    }
}