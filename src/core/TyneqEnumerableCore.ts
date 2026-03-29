import { Enumerator, EnumeratorFactory, TyneqCachedSequence, TyneqSequence, TyneqOrderedSequence } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { tyneqQueryNode } from "../types/queryplan";
import type { IQueryNode } from "../types/queryplan";
import { QueryNode } from "../queryplan/QueryNode";

/**
 * Abstract base that adds `orderBy`, `orderByDescending`, `memoize`, and `pipe` to a sequence.
 *
 * @remarks
 * These four methods build `QueryNode`s and delegate to abstract factory methods, allowing
 * subclasses to control which concrete sequence types are produced.
 *
 * @internal
 */
export abstract class TyneqEnumerableCore<TSource> {

    public abstract readonly [tyneqQueryNode]: IQueryNode | null;

    public [Symbol.iterator](): Enumerator<TSource> {
        return this.getEnumerator();
    }

    public abstract getEnumerator(): Enumerator<TSource>;

    
    public orderBy<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: ((a: TKey, b: TKey) => number) | undefined
    ): TyneqOrderedSequence<TSource> {
        ArgumentUtility.checkNotOptional({ keySelector });
        const orderByArgs = comparer !== undefined ? [keySelector, comparer] : [keySelector];
        const node = new QueryNode("orderBy", orderByArgs, this[tyneqQueryNode], "buffer");
        return this.createOrderedEnumerable(
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            false,
            node
        );
    }

    
    public orderByDescending<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: ((a: TKey, b: TKey) => number) | undefined
    ): TyneqOrderedSequence<TSource> {
        ArgumentUtility.checkNotOptional({ keySelector });
        const orderByDescArgs = comparer !== undefined ? [keySelector, comparer] : [keySelector];
        const node = new QueryNode("orderByDescending", orderByDescArgs, this[tyneqQueryNode], "buffer");
        return this.createOrderedEnumerable(
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            true,
            node
        );
    }

    
    public memoize(): TyneqCachedSequence<TSource> {
        const node = new QueryNode("memoize", [], this[tyneqQueryNode], "buffer");
        return this.createCachedEnumerable(this as unknown as TyneqSequence<TSource>, node);
    }

    
    public pipe<TResult>(factory: (source: Iterable<TSource>) => Enumerator<TResult> | IterableIterator<TResult>): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ factory });
        const self = this;
        return this.createEnumerable({
            getEnumerator() {
                return factory(self as unknown as Iterable<TSource>);
            },
        } satisfies EnumeratorFactory<TResult>);
    }

    protected abstract createEnumerable<TResult>(factory: EnumeratorFactory<TResult>, node?: IQueryNode | null): TyneqSequence<TResult>;

    protected abstract createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean,
        node?: IQueryNode | null
    ): TyneqOrderedSequence<TSource>;

    protected abstract createCachedEnumerable(source: TyneqSequence<TSource>, node?: IQueryNode | null): TyneqCachedSequence<TSource>;
}
