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

export interface ITyneqBaseEnumerable<TSource> extends IEnumerable<TSource> {

    // conversion operators


    // terminal operators
    toArray(): TSource[];
    count(): number;
    any(predicate: (item: TSource) => boolean): boolean;
    all(predicate: (item: TSource) => boolean): boolean;

    // stream operators
    append(element: TSource): ITyneqEnumerable<TSource>;
    concat(other: IEnumerable<TSource>): ITyneqEnumerable<TSource>;
    where(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource>;
    select<U>(selector: (item: TSource) => U): ITyneqEnumerable<U>;
    selectMany<U>(selector: (item: TSource) => IEnumerable<U>): ITyneqEnumerable<U>;

    // buffering operators
    orderBy<TKey>(keySelector: (item: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): ITyneqOrderedEnumerable<TSource>;
    orderByDescending<TKey>(keySelector: (item: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): ITyneqOrderedEnumerable<TSource>;
}

export interface ITyneqEnumerable<TSource> extends ITyneqBaseEnumerable<TSource> {
    // may be extended later
}

export interface ITyneqOrderedEnumerable<TSource> extends ITyneqBaseEnumerable<TSource> {
    thenBy<TKey>(keySelector: (item: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): ITyneqOrderedEnumerable<TSource>;
    thenByDescending<TKey>(keySelector: (item: TSource) => TKey, comparer?: (a: TKey, b: TKey) => number): ITyneqOrderedEnumerable<TSource>;
}

export interface IOrderedEnumerable<TSource> extends IEnumerable<TSource> {
    source: ITyneqBaseEnumerable<TSource>;
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