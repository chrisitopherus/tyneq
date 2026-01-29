import { BaseEnumerableSorter } from "../core/ordering/BaseEnumerableSorter";
import { Nullable } from "./utility";

/**
 * An enumerator that iterates over a sequence of T.
 */
export type IEnumerator<T> = Iterator<T>;

/**
 * An enumerable sequence of T.
 * 
 * ~ Iterable<T>.
 */
export interface IEnumerable<T> extends Iterable<T> {
    /**
     * Returns an enumerator that iterates through the collection.
     * 
     * Like: GetEnumerator() in C#.
     */
    [Symbol.iterator](): IEnumerator<T>;
}

/**
 * A factory function that creates a new IEnumerator<T>.
 * 
 * This is used to ensure that IEnumerable<T> implementations are re-iterable, because `JS generators` are not.
 */
export type IteratorFactory<T> = () => IEnumerator<T>;

export interface ITyneqEnumerable<TSource> extends IEnumerable<TSource> {
    // conversion operators


    // terminal operators
    toArray(): TSource[];

    count(): number;

    any(predicate: (item: TSource) => boolean): boolean;

    all(predicate: (item: TSource) => boolean): boolean;

    // stream operators

    append(item: TSource): ITyneqEnumerable<TSource>;

    concat(other: IEnumerable<TSource>): ITyneqEnumerable<TSource>;

    prepend(item: TSource): ITyneqEnumerable<TSource>;

    select<TResult>(selector: (item: TSource) => TResult): ITyneqEnumerable<TResult>;

    selectMany<TResult>(selector: (item: TSource) => IEnumerable<TResult>): ITyneqEnumerable<TResult>;

    skip(count: number): ITyneqEnumerable<TSource>;

    skipLast(count: number): ITyneqEnumerable<TSource>;

    skipWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource>;

    take(count: number): ITyneqEnumerable<TSource>;

    takeWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource>;

    where(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource>;

    zip<TOther, TResult>(other: IEnumerable<TOther>, selector: (first: TSource, second: TOther) => TResult): ITyneqEnumerable<TResult>;

    // buffering operators

    distinct(): ITyneqEnumerable<TSource>;

    distinctBy<TKey>(keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource>;

    except(excludedValues: IEnumerable<TSource>): ITyneqEnumerable<TSource>;

    exceptBy<TKey>(excludedKeys: IEnumerable<TKey>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource>;

    groupBy<TKey, TValue, TResult>(
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: ITyneqEnumerable<TValue>) => TResult
    ): ITyneqEnumerable<TResult>;

    intersect(intersectedValues: IEnumerable<TSource>): ITyneqEnumerable<TSource>;

    intersectBy<TKey>(intersectedKeys: IEnumerable<TKey>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource>;

    orderBy<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: (a: TKey, b: TKey) => number
    ): ITyneqOrderedEnumerable<TSource>;

    orderByDescending<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: (a: TKey, b: TKey) => number
    ): ITyneqOrderedEnumerable<TSource>;

    reverse(): ITyneqEnumerable<TSource>;

    union(otherValues: IEnumerable<TSource>): ITyneqEnumerable<TSource>;

    unionBy<TKey>(otherValues: IEnumerable<TSource>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource>;
}

export interface ITyneqOrderedEnumerable<TSource> extends ITyneqEnumerable<TSource> {
    thenBy<TKey>(keySelector: (item: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): ITyneqOrderedEnumerable<TSource>;
    thenByDescending<TKey>(keySelector: (item: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): ITyneqOrderedEnumerable<TSource>;
}

export interface IOrderedEnumerable<TSource> extends IEnumerable<TSource> {
    source: ITyneqEnumerable<TSource>;
    parent: Nullable<IOrderedEnumerable<TSource>>;
    getSorter(next: Nullable<BaseEnumerableSorter<TSource>>): BaseEnumerableSorter<TSource>;
}

export enum EnumeratorResultKind {
    Yield = "yield",
    Complete = "complete",
}

export interface EnumeratorYieldResult<TYield> {
    kind: EnumeratorResultKind.Yield;
    value: TYield;
}

export interface EnumeratorCompleteResult<TReturn> {
    kind: EnumeratorResultKind.Complete;
    value: TReturn;
}

export type EnumeratorResult<TYield, TReturn = null> =
    | EnumeratorYieldResult<TYield>
    | EnumeratorCompleteResult<TReturn>;