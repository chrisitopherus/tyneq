import { Enumerator, EnumeratorFactory, TyneqCachedSequence, TyneqSequence, TyneqOrderedSequence } from "../types/core";
import { TyneqEnumerableBase } from "./TyneqEnumerableBase";
import { tyneqQueryNode } from "../types/queryplan";
import type { QueryPlanNode } from "../types/queryplan";
import { ArgumentUtility } from "../utility/argumentUtility";
import { TyneqCachedEnumerable } from "./TyneqCachedEnumerable";
import { TyneqOrderedEnumerable } from "./ordering/TyneqOrderedEnumerable";

/**
 * The standard concrete implementation of {@link TyneqSequence}.
 *
 * @remarks
 * Created by operator methods in {@link TyneqEnumerableBase} and by the `Tyneq` factory.
 * Delegates element production to the `EnumeratorFactory` passed at construction.
 *
 * @internal
 */
export class TyneqEnumerable<TSource> extends TyneqEnumerableBase<TSource> {
    protected readonly enumeratorFactory: EnumeratorFactory<TSource>;

    public readonly [tyneqQueryNode]: QueryPlanNode | null;

    
    public constructor(enumeratorFactory: EnumeratorFactory<TSource>, node?: QueryPlanNode | null) {
        super();
        ArgumentUtility.checkNotOptional({ enumeratorFactory });
        this.enumeratorFactory = enumeratorFactory;
        this[tyneqQueryNode] = node ?? null;
    }

    public override getEnumerator(): Enumerator<TSource> {
        return this.enumeratorFactory.getEnumerator();
    }

    protected override createEnumerable<TResult>(factory: EnumeratorFactory<TResult>, node?: QueryPlanNode | null): TyneqSequence<TResult> {
        return new TyneqEnumerable<TResult>(factory, node);
    }

    protected createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean,
        node?: QueryPlanNode | null
    ): TyneqOrderedSequence<TSource> {
        return new TyneqOrderedEnumerable<TSource, TKey>(
            this,
            keySelector,
            comparer,
            descending,
            undefined,
            node
        );
    }

    protected createCachedEnumerable(source: TyneqSequence<TSource>, node?: QueryPlanNode | null): TyneqCachedSequence<TSource> {
        return new TyneqCachedEnumerable<TSource>(source, node);
    }
}
