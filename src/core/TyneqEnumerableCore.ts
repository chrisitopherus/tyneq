import { Enumerator, EnumeratorFactory, TyneqCachedSequence, TyneqSequence, TyneqOrderedSequence, Comparer } from "../types/core";
import { TyneqComparer } from "./TyneqComparer";
import { ArgumentUtility } from "../utility/ArgumentUtility";
import { tyneqQueryNode } from "../types/queryplan";
import type { QueryPlanNode } from "../types/queryplan";
import { QueryNode } from "../queryplan/QueryNode";
import { builtin } from "../plugin/decorators/builtin";
import { sequence } from "../plugin/decorators/sequence";

/**
 * Abstract base that adds `orderBy`, `orderByDescending`, `memoize`, and `pipe` to a sequence.
 *
 * @remarks
 * All four methods build `QueryNode`s and delegate to abstract factory methods, allowing
 * subclasses to control which concrete sequence types are produced.
 *
 * @internal
 */
@sequence
export abstract class TyneqEnumerableCore<TSource> {

    public abstract readonly [tyneqQueryNode]: QueryPlanNode | null;

    public [Symbol.iterator](): Enumerator<TSource> {
        return this.getEnumerator();
    }

    public abstract getEnumerator(): Enumerator<TSource>;

    @builtin({ kind: "buffer" })
    public orderBy<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: Comparer<TKey>
    ): TyneqOrderedSequence<TSource> {
        ArgumentUtility.checkNotOptional({ keySelector });
        const orderByArgs = comparer !== undefined ? [keySelector, comparer] : [keySelector];
        const node = new QueryNode("orderBy", orderByArgs, this[tyneqQueryNode], "buffer");
        return this.createOrderedEnumerable(
            keySelector,
            comparer ?? TyneqComparer.defaultComparer,
            false,
            node
        );
    }

    @builtin({ kind: "buffer" })
    public orderByDescending<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: Comparer<TKey>
    ): TyneqOrderedSequence<TSource> {
        ArgumentUtility.checkNotOptional({ keySelector });
        const orderByDescArgs = comparer !== undefined ? [keySelector, comparer] : [keySelector];
        const node = new QueryNode("orderByDescending", orderByDescArgs, this[tyneqQueryNode], "buffer");
        return this.createOrderedEnumerable(
            keySelector,
            comparer ?? TyneqComparer.defaultComparer,
            true,
            node
        );
    }

    @builtin({ kind: "cache" })
    public memoize(): TyneqCachedSequence<TSource> {
        const node = new QueryNode("memoize", [], this[tyneqQueryNode], "buffer");
        return this.createCachedEnumerable(this as unknown as TyneqSequence<TSource>, node);
    }

    @builtin({ kind: "extension" })
    public pipe<TResult>(factory: (source: Iterable<TSource>) => Enumerator<TResult> | IterableIterator<TResult>): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ factory });
        const node = new QueryNode("pipe", [factory], this[tyneqQueryNode], "streaming");
        const self = this;
        return this.createEnumerable({
            getEnumerator() {
                return factory(self as unknown as Iterable<TSource>);
            },
        } satisfies EnumeratorFactory<TResult>, node);
    }

    protected abstract createEnumerable<TResult>(factory: EnumeratorFactory<TResult>, node?: QueryPlanNode | null): TyneqSequence<TResult>;

    protected abstract createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: Comparer<TKey>,
        descending: boolean,
        node?: QueryPlanNode | null
    ): TyneqOrderedSequence<TSource>;

    protected abstract createCachedEnumerable(source: TyneqSequence<TSource>, node?: QueryPlanNode | null): TyneqCachedSequence<TSource>;
}
