import { Nullable } from "../../types/utility";
import { BaseEnumerableSorter } from "./BaseEnumerableSorter";
import { TyneqEnumerableSorter } from "./TyneqEnumerableSorter";
import type { IEnumerable, IEnumerator, IOrderedEnumerable, IteratorFactory, ITyneqBaseEnumerable, ITyneqEnumerable, ITyneqOrderedEnumerable } from '../../types/core';
import { TyneqEnumerable } from "../TyneqEnumerable";
import { OrderByEnumerator } from "../../enumerators/buffer/orderBy";
import { WhereEnumerator } from "../../enumerators/streaming/where";
import { WhereOperator } from "../../operators/streaming/where";
import { ConcatOperator } from "../../operators/streaming/concat";
import { AppendOperator } from "../../operators/streaming/append";
import { SelectOperator } from "../../operators/streaming/select";

export class TyneqOrderedEnumerable<TSource, TKey> implements ITyneqOrderedEnumerable<TSource> {
    private readonly keySelector: (item: TSource) => TKey;
    private readonly comparer: (a: TKey, b: TKey) => number;
    private readonly descending: boolean;
    public parent: Nullable<IOrderedEnumerable<TSource>>;
    public readonly source: ITyneqBaseEnumerable<TSource>;
    public constructor(
        source: ITyneqBaseEnumerable<TSource>,
        keySelector: (item: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean,
        parent?: IOrderedEnumerable<TSource>
    ) {
        this.source = source;
        this.keySelector = keySelector;
        this.comparer = comparer;
        this.descending = descending;
        this.parent = parent ?? null;
    }

    public [Symbol.iterator](): IEnumerator<TSource> {
        return this.getSource();
    }

    public getSource(): IEnumerator<TSource> {
        return new OrderByEnumerator<TSource, TKey>(this.source[Symbol.iterator](), this);
    }

    public getSorter(next: Nullable<BaseEnumerableSorter<TSource>>): BaseEnumerableSorter<TSource> {
        return new TyneqEnumerableSorter<TSource, TKey>(
            this.keySelector,
            this.comparer,
            this.descending,
            next ?? undefined
        );
    }

    public toArray(): TSource[] {
        throw new Error("Method not implemented.");
    }

    public count(): number {
        throw new Error("Method not implemented.");
    }

    public any(predicate: (item: TSource) => boolean): boolean {
        throw new Error("Method not implemented.");
    }

    public all(predicate: (item: TSource) => boolean): boolean {
        throw new Error("Method not implemented.");
    }

    // stream operators
    
    public append(element: TSource): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(new AppendOperator<TSource>(this, element).getFactory());
    }

    public concat(other: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(new ConcatOperator<TSource>(this, other).getFactory());
    }

    public where(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(new WhereOperator<TSource>(this, predicate).getFactory());
    }

    public select<TResult>(selector: (item: TSource) => TResult): ITyneqEnumerable<TResult> {
        return new TyneqEnumerable<TResult>(new SelectOperator<TSource, TResult>(this, selector).getFactory());
    }

    public selectMany<U>(selector: (item: TSource) => IEnumerable<U>): ITyneqEnumerable<U> {
        throw new Error("Method not implemented.");
    }

    public orderBy<TKey>(keySelector: (item: TSource) => TKey, comparer?: ((a: TKey, b: TKey) => number) | undefined): ITyneqOrderedEnumerable<TSource> {
        throw new Error("Method not implemented.");
    }

    public orderByDescending<TKey>(keySelector: (item: TSource) => TKey, comparer?: ((a: TKey, b: TKey) => number) | undefined): ITyneqOrderedEnumerable<TSource> {
        throw new Error("Method not implemented.");
    }

    public thenBy<UKey>(
        keySelector: (item: TSource) => UKey,
        comparer?: ((a: UKey, b: UKey) => number) | undefined
    ): ITyneqOrderedEnumerable<TSource> {
        return new TyneqOrderedEnumerable<TSource, UKey>(
            this.source,
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            false,
            this
        );
    }
    public thenByDescending<UKey>(
        keySelector: (item: TSource) => UKey,
        comparer?: ((a: UKey, b: UKey) => number) | undefined): ITyneqOrderedEnumerable<TSource> {
        return new TyneqOrderedEnumerable<TSource, UKey>(
            this.source,
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            true,
            this
        );
    }
}