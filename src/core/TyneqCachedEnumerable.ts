import { MemoizeEnumerator } from "../enumerators/buffer/memoize";
import { CacheResult, CachedEnumerable, Enumerator, EnumeratorFactory, TyneqCachedSequence, TyneqSequence, TyneqOrderedSequence } from "../types/core";
import { tyneqQueryNode } from "../types/queryplan";
import type { IQueryNode } from "../types/queryplan";
import { Nullable } from "../types/utility";
import { TyneqOrderedEnumerable } from "./ordering/TyneqOrderedEnumerable";
import { TyneqEnumerable } from "./TyneqEnumerable";
import { TyneqEnumerableBase } from "./TyneqEnumerableBase";

/**
 * Concrete implementation of a memoizing enumerable that caches source elements on first access.
 *
 * @remarks
 * Returned by `memoize()`. Elements are fetched from the source lazily and stored in an
 * internal array. Any subsequent enumeration replays cached elements without re-evaluating
 * the source for the portion already fetched.
 *
 * A single source enumerator is shared across all concurrent enumerations of this instance.
 * Call `refresh()` to discard the cache and restart evaluation from the source.
 *
 * @typeParam TSource - Element type of the sequence.
 *
 * @see {@link TyneqCachedSequence} for the public interface.
 * @see {@link TyneqSequence.memoize} for the factory method.
 *
 * @group Classes
 * @internal
 */
export class TyneqCachedEnumerable<TSource> extends TyneqEnumerableBase<TSource> implements TyneqCachedSequence<TSource>, CachedEnumerable<TSource> {
    private source: TyneqSequence<TSource>;
    private cache: TSource[] = [];
    private done: boolean = false;
    private sourceEnumerator: Nullable<Enumerator<TSource>> = null;

    public constructor(source: TyneqSequence<TSource>, node?: IQueryNode | null) {
        super();
        this.source = source;
        this[tyneqQueryNode] = node ?? null;
    }

    public getEnumerator(): Enumerator<TSource> {
        return new MemoizeEnumerator(this);
    }

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

    public readonly [tyneqQueryNode]: IQueryNode | null;

    protected createEnumerable<TResult>(factory: EnumeratorFactory<TResult>, node?: IQueryNode | null): TyneqSequence<TResult> {
        return new TyneqEnumerable<TResult>(factory, node);
    }
    protected createOrderedEnumerable<TKey>(keySelector: (x: TSource) => TKey, comparer: (a: TKey, b: TKey) => number, descending: boolean): TyneqOrderedSequence<TSource> {
        return new TyneqOrderedEnumerable<TSource, TKey>(
            this,
            keySelector,
            comparer,
            descending
        );
    }

    protected createCachedEnumerable(source: TyneqSequence<TSource>, node?: IQueryNode | null): TyneqCachedSequence<TSource> {
        return new TyneqCachedEnumerable<TSource>(source, node);
    }
}
