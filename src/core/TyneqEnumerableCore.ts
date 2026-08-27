import { Enumerator, EnumeratorFactory, TyneqCachedSequence, TyneqSequence, TyneqOrderedSequence, Comparer } from "../types/core";
import { TyneqComparer } from "./TyneqComparer";
import { ArgumentUtility } from "../utility/ArgumentUtility";
import { tyneqQueryNode } from "../types/queryplan";
import type { OperatorCategory, QueryPlanNode } from "../types/queryplan";
import { QueryNode } from "../queryplan/QueryNode";
import { builtin } from "../plugin/decorators/builtin";
import { sequence } from "../plugin/decorators/sequence";
import { Nullable } from "../types/utility";

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

    public abstract readonly [tyneqQueryNode]: Nullable<QueryPlanNode>;

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
        return this.createOrderedEnumerable(
            keySelector,
            comparer ?? TyneqComparer.defaultComparer,
            false,
            this.createNode("orderBy", "buffer", orderByArgs)
        );
    }

    @builtin({ kind: "buffer" })
    public orderByDescending<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: Comparer<TKey>
    ): TyneqOrderedSequence<TSource> {
        ArgumentUtility.checkNotOptional({ keySelector });
        const orderByDescArgs = comparer !== undefined ? [keySelector, comparer] : [keySelector];
        return this.createOrderedEnumerable(
            keySelector,
            comparer ?? TyneqComparer.defaultComparer,
            true,
            this.createNode("orderByDescending", "buffer", orderByDescArgs)
        );
    }

    @builtin({ kind: "cache" })
    public memoize(): TyneqCachedSequence<TSource> {
        return this.createCachedEnumerable(this as unknown as TyneqSequence<TSource>, this.createNode("memoize", "buffer"));
    }

    @builtin({ kind: "extension" })
    public pipe<TResult>(factory: (source: Iterable<TSource>) => Enumerator<TResult> | IterableIterator<TResult>): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ factory });
        return this.createSequence(
            () => factory(this),
            this.createNode("pipe", "streaming", [factory])
        );
    }

    /**
     * Helper that creates a new sequence with the provided enumerator factory and query node.
     * @param factory The factory function that produces an enumerator for the new sequence.
     * @param node The query plan node associated with the new sequence.
     * @returns A new TyneqSequence instance.
     */
    protected createSequence<TResult>(factory: () => Enumerator<TResult>, node: QueryPlanNode): TyneqSequence<TResult> {
        return this.createEnumerable({ getEnumerator: factory }, node);
    }

    /**
     * Helper for creating a query node with the current sequence's node as its parent.
     * @param name The name of the query node.
     * @param category The category of the operator.
     * @param args The arguments for the query node.
     * @returns A new QueryNode instance.
     */
    protected createNode(name: string, category: OperatorCategory, args: unknown[] = []): QueryNode {
        return new QueryNode(name, args, this[tyneqQueryNode], category);
    }

    protected abstract createEnumerable<TResult>(factory: EnumeratorFactory<TResult>, node: Nullable<QueryPlanNode>): TyneqSequence<TResult>;

    protected abstract createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: Comparer<TKey>,
        descending: boolean,
        node: Nullable<QueryPlanNode>
    ): TyneqOrderedSequence<TSource>;

    protected abstract createCachedEnumerable(source: TyneqSequence<TSource>, node: Nullable<QueryPlanNode>): TyneqCachedSequence<TSource>;
}
