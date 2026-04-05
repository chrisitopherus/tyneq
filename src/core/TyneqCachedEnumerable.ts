import { MemoizeEnumerator } from "../enumerators/buffer/memoize";
import { builtin } from "../plugin/decorators/builtin";
import { sequence } from "../plugin/decorators/sequence";
import { CacheResult, CachedEnumerable, Enumerator, EnumeratorFactory, TyneqCachedSequence, TyneqSequence, TyneqOrderedSequence, Comparer } from "../types/core";
import { tyneqQueryNode } from "../types/queryplan";
import type { QueryPlanNode } from "../types/queryplan";
import { Nullable } from "../types/utility";
import { TyneqOrderedEnumerable } from "./ordering/TyneqOrderedEnumerable";
import { TyneqEnumerable } from "./TyneqEnumerable";
import { TyneqEnumerableBase } from "./TyneqEnumerableBase";

/**
 * Concrete implementation of {@link TyneqCachedSequence} — caches elements incrementally.
 *
 * @remarks
 * Created by `memoize()`. On the first iteration the source is enumerated one element at a time
 * and each element is appended to an internal array. Subsequent iterations replay the cache;
 * the source is not re-enumerated. Call `refresh()` to clear the cache and start over.
 *
 * @internal
 */
@sequence
export class TyneqCachedEnumerable<TSource> extends TyneqEnumerableBase<TSource> implements TyneqCachedSequence<TSource>, CachedEnumerable<TSource> {
    private source: TyneqSequence<TSource>;
    private cache: TSource[] = [];
    private done: boolean = false;
    private sourceEnumerator: Nullable<Enumerator<TSource>> = null;

    public constructor(source: TyneqSequence<TSource>, node?: QueryPlanNode | null) {
        super();
        this.source = source;
        this[tyneqQueryNode] = node ?? null;
    }

    public getEnumerator(): Enumerator<TSource> {
        return new MemoizeEnumerator(this);
    }

    @builtin({ kind: "cache" })
    public refresh(): TyneqCachedSequence<TSource> {
        this.cache = [];
        this.done = false;
        this.sourceEnumerator?.return?.();
        this.sourceEnumerator = null;
        return this;
    }

    public tryGetAtFromCache(index: number): CacheResult<TSource> {
        if (index < this.cache.length) {
            return { has: true, value: this.cache[index] };
        }

        if (this.done) {
            return { has: false };
        }

        if (this.sourceEnumerator === null) {
            this.sourceEnumerator = this.source.getEnumerator();
        }

        const next = this.sourceEnumerator.next();

        if (!next.done) {
            const value = next.value;
            this.cache.push(value);
            return { has: true, value };
        }

        this.done = true;
        this.sourceEnumerator.return?.();
        this.sourceEnumerator = null;
        return { has: false };
    }

    public readonly [tyneqQueryNode]: QueryPlanNode | null;

    protected createEnumerable<TResult>(factory: EnumeratorFactory<TResult>, node?: QueryPlanNode | null): TyneqSequence<TResult> {
        return new TyneqEnumerable<TResult>(factory, node);
    }
    protected createOrderedEnumerable<TKey>(keySelector: (x: TSource) => TKey, comparer: Comparer<TKey>, descending: boolean): TyneqOrderedSequence<TSource> {
        return new TyneqOrderedEnumerable<TSource, TKey>(
            this,
            keySelector,
            comparer,
            descending
        );
    }

    protected createCachedEnumerable(source: TyneqSequence<TSource>, node?: QueryPlanNode | null): TyneqCachedSequence<TSource> {
        return new TyneqCachedEnumerable<TSource>(source, node);
    }
}
