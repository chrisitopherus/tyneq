import { MemoizeEnumerator } from "../enumerators/buffer/memoize";
import { builtin } from "../plugin/decorators/builtin";
import { sequence } from "../plugin/decorators/sequence";
import { CacheResult, CachedEnumerable, Enumerator, EnumeratorFactory, TyneqCachedSequence, TyneqSequence, TyneqOrderedSequence, Comparer } from "../types/core";
import { tyneqQueryNode } from "../types/queryplan";
import type { QueryPlanNode } from "../types/queryplan";
import type { Nullable } from "../types/utility";
import { EnumeratorUtility } from "../utility/EnumeratorUtility";
import { TyneqOrderedEnumerable } from "./ordering/TyneqOrderedEnumerable";
import { TyneqEnumerable } from "./TyneqEnumerable";
import { TyneqEnumerableBase } from "./TyneqEnumerableBase";

/**
 * Concrete implementation of {@link TyneqCachedSequence} - caches elements incrementally.
 *
 * @remarks
 * Created by `memoize()`. On the first iteration the source is enumerated one element at a time
 * and each element is appended to an internal array. Subsequent iterations replay the cache;
 * the source is not re-enumerated. Call `refresh()` to clear the cache and start over.
 *
 * If the source throws mid-enumeration, the error is cached alongside the successfully cached
 * prefix: every read past the cached prefix rethrows the same error object (by reference) until
 * `refresh()` is called. This treats an error as a legitimate (if unfortunate) first-computation
 * outcome that a cache must replay consistently, rather than silently retrying the source - or
 * worse, certifying the truncated prefix as the complete, successful sequence.
 *
 * @internal
 */
@sequence
export class TyneqCachedEnumerable<TSource> extends TyneqEnumerableBase<TSource> implements TyneqCachedSequence<TSource>, CachedEnumerable<TSource> {
    private source: TyneqSequence<TSource>;
    private cache: TSource[] = [];
    private done: boolean = false;
    private sourceEnumerator: Nullable<Enumerator<TSource>> = null;
    private cachedError: { has: true; error: unknown } | { has: false } = { has: false };

    public readonly [tyneqQueryNode]: Nullable<QueryPlanNode>;

    public constructor(source: TyneqSequence<TSource>, node?: Nullable<QueryPlanNode>) {
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
        this.cachedError = { has: false };
        EnumeratorUtility.tryDispose(this.sourceEnumerator);
        this.sourceEnumerator = null;
        return this;
    }

    public tryGetAtFromCache(index: number): CacheResult<TSource> {
        if (index < this.cache.length) {
            return { has: true, value: this.cache[index] };
        }

        if (this.cachedError.has) {
            throw this.cachedError.error;
        }

        if (this.done) {
            return { has: false };
        }

        if (this.sourceEnumerator === null) {
            this.sourceEnumerator = this.source.getEnumerator();
        }

        let next: IteratorResult<TSource>;
        try {
            next = this.sourceEnumerator.next();
        } catch (error) {
            this.cachedError = { has: true, error };
            EnumeratorUtility.tryDispose(this.sourceEnumerator);
            this.sourceEnumerator = null;
            throw error;
        }

        if (!next.done) {
            const value = next.value;
            this.cache.push(value);
            return { has: true, value };
        }

        this.done = true;
        EnumeratorUtility.tryDispose(this.sourceEnumerator);
        this.sourceEnumerator = null;
        return { has: false };
    }

    protected createEnumerable<TResult>(factory: EnumeratorFactory<TResult>, node: Nullable<QueryPlanNode>): TyneqSequence<TResult> {
        return new TyneqEnumerable<TResult>(factory, node);
    }
    protected createOrderedEnumerable<TKey>(keySelector: (x: TSource) => TKey, comparer: Comparer<TKey>, descending: boolean, node: Nullable<QueryPlanNode>): TyneqOrderedSequence<TSource> {
        return new TyneqOrderedEnumerable<TSource, TKey>(
            this,
            keySelector,
            comparer,
            descending,
            undefined,
            node
        );
    }

    protected createCachedEnumerable(source: TyneqSequence<TSource>, node: Nullable<QueryPlanNode>): TyneqCachedSequence<TSource> {
        return new TyneqCachedEnumerable<TSource>(source, node);
    }
}
