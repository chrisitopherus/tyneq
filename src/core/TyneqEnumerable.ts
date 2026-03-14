import { IEnumerator, IEnumeratorFactory, ITyneqCachedEnumerable, ITyneqEnumerable, ITyneqOrderedEnumerable } from '../types/core';
import { TyneqEnumerableBase } from "./TyneqEnumerableBase";
import { tyneqQueryNode } from '../types/queryplan';
import type { IQueryNode } from '../types/queryplan';
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";
import { TyneqCachedEnumerable } from './cache/TyneqCachedEnumerable';
import { TyneqOrderedEnumerable } from './ordering/TyneqOrderedEnumerable';

/**
 * Standard concrete implementation of a queryable enumerable sequence.
 *
 * @remarks
 * Wraps an {@link IEnumeratorFactory} that produces a fresh iterator on each enumeration,
 * enabling lazy evaluation and re-iteration. Returned by most Tyneq factory methods and
 * query operators.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link TyneqEnumerableBase} for inherited query operators.
 * @see {@link TyneqOrderedEnumerable} for ordered sequence support.
 * @see {@link Tyneq} for factory methods that create instances.
 *
 * @group Classes
 * @internal
 */
export class TyneqEnumerable<TSource> extends TyneqEnumerableBase<TSource> {
    protected readonly enumeratorFactory: IEnumeratorFactory<TSource>;

    public readonly [tyneqQueryNode]: IQueryNode | null;

    /**
     * @param enumeratorFactory - Factory that produces a fresh iterator on each enumeration.
     * @param node - Optional query plan node for this sequence.
     * @throws {ArgumentNullError} If `enumeratorFactory` is null.
     * @throws {ArgumentError} If `enumeratorFactory` is undefined.
     */
    public constructor(enumeratorFactory: IEnumeratorFactory<TSource>, node?: IQueryNode | null) {
        super();
        ArgumentUtility.checkNotOptional({ enumeratorFactory });
        this.enumeratorFactory = enumeratorFactory;
        this[tyneqQueryNode] = node ?? null;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return this.enumeratorFactory.getEnumerator();
    }

    protected override createEnumerable<TResult>(factory: IEnumeratorFactory<TResult>, node?: IQueryNode | null): ITyneqEnumerable<TResult> {
        return new TyneqEnumerable<TResult>(factory, node);
    }

    protected createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean,
        node?: IQueryNode | null
    ): ITyneqOrderedEnumerable<TSource> {
        return new TyneqOrderedEnumerable<TSource, TKey>(
            this,
            keySelector,
            comparer,
            descending,
            undefined,
            node
        );
    }

    protected createCachedEnumerable(source: ITyneqEnumerable<TSource>, node?: IQueryNode | null): ITyneqCachedEnumerable<TSource> {
        return new TyneqCachedEnumerable<TSource>(source, node);
    }
}
