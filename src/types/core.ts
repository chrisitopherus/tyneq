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
    any(predicate: (item: TSource) => boolean): boolean;

    all(predicate: (item: TSource) => boolean): boolean;

    contains(value: TSource): boolean;

    count(): number;

    defaultIfEmpty(defaultValue: TSource): ITyneqEnumerable<TSource>;

    elementAt(index: number): TSource;

    elementAtOrDefault(index: number, defaultValue: TSource): TSource;

    first(predicate: (item: TSource) => boolean): TSource;

    firstOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource;

    last(predicate: (item: TSource) => boolean): TSource;

    lastOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource;

    max(comparer?: (a: TSource, b: TSource) => number): TSource;

    maxBy<TKey>(keySelector: (element: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): TSource;

    min(comparer?: (a: TSource, b: TSource) => number): TSource;

    minBy<TKey>(keySelector: (element: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): TSource;

    sequenceEqual(other: IEnumerable<TSource>, equalityComparer?: (a: TSource, b: TSource) => boolean): boolean;

    single(predicate: (item: TSource) => boolean): TSource;

    singleOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource;

    sum(selector: (item: TSource) => number): number;

    toArray(): TSource[];

    toMap<TKey, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>): Map<TKey, TValue>;

    toRecord<TKey extends string | number | symbol, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>): Record<TKey, TValue>;

    toSet(): Set<TSource>;

    // stream operators

    append(item: TSource): ITyneqEnumerable<TSource>;

    chunk(size: number): ITyneqEnumerable<TSource[]>;

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

    join<TInner, TKey, TResult>(
        inner: IEnumerable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, inner: TInner) => TResult
    ): ITyneqEnumerable<TResult>;

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

    // extension/plugin
    pipe<TResult>(factory: (source: IEnumerator<TSource>) => IEnumerator<TResult>): ITyneqEnumerable<TResult>;
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

export type KeyValuePair<TKey, TValue> = {
    key: TKey;
    value: TValue;
};