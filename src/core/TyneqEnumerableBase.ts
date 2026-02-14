import { DistinctOperatorEnumerable } from "../operators/buffer/distinct";
import { DistinctByOperatorEnumerable } from "../operators/buffer/distinctBy";
import { ExceptOperatorEnumerable } from "../operators/buffer/except";
import { ExceptByOperatorEnumerable } from "../operators/buffer/exceptBy";
import { GroupByOperatorEnumerable } from "../operators/buffer/groupBy";
import { GroupJoinOperatorEnumerable } from "../operators/buffer/groupJoin";
import { IntersectOperatorEnumerable } from "../operators/buffer/intersect";
import { IntersectByOperatorEnumerable } from "../operators/buffer/intersectBy";
import { JoinOperatorEnumerable } from "../operators/buffer/join";
import { ReverseOperatorEnumerable } from "../operators/buffer/reverse";
import { ShuffleOperatorEnumerable } from "../operators/buffer/shuffle";
import { UnionOperatorEnumerable } from "../operators/buffer/union";
import { UnionByOperatorEnumerable } from "../operators/buffer/unionBy";
import { AppendOperatorEnumerable } from "../operators/streaming/append";
import { ChunkOperatorEnumerable } from "../operators/streaming/chunk";
import { ConcatOperatorEnumerable } from "../operators/streaming/concat";
import { PrependOperatorEnumerable } from "../operators/streaming/prepend";
import { SelectOperatorEnumerable } from "../operators/streaming/select";
import { SelectManyOperatorEnumerable } from "../operators/streaming/selectMany";
import { SkipOperatorEnumerable } from "../operators/streaming/skip";
import { SkipLastOperatorEnumerable } from "../operators/streaming/skipLast";
import { SkipWhileOperatorEnumerable } from "../operators/streaming/skipWhile";
import { SplitOperatorEnumerable } from "../operators/streaming/split";
import { TakeOperatorEnumerable } from "../operators/streaming/take";
import { TakeWhileOperatorEnumerable } from "../operators/streaming/takeWhile";
import { TapOperatorEnumerable } from "../operators/streaming/tap";
import { TapIfOperatorEnumerable } from "../operators/streaming/tapIf";
import { WhereOperatorEnumerable } from "../operators/streaming/where";
import { ZipOperatorEnumerable } from "../operators/streaming/zip";
import { AllOperator } from "../operators/terminal/all";
import { AnyOperator } from "../operators/terminal/any";
import { ContainsOperator } from "../operators/terminal/contains";
import { CountOperator } from "../operators/terminal/count";
import { DefaultIfEmptyOperator } from "../operators/terminal/defaultIfEmpty";
import { ElementAtOperator } from "../operators/terminal/elementAt";
import { ElementAtOrDefaultOperator } from "../operators/terminal/elementAtOrDefault";
import { FirstOperator } from "../operators/terminal/first";
import { FirstOrDefaultOperator } from "../operators/terminal/firstOrDefault";
import { IndexOfOperator } from "../operators/terminal/indexOf";
import { LastOperator } from "../operators/terminal/last";
import { LastOrDefaultOperator } from "../operators/terminal/lastOrDefault";
import { MaxOperator } from "../operators/terminal/max";
import { MaxByOperator } from "../operators/terminal/maxBy";
import { MinOperator } from "../operators/terminal/min";
import { MinByOperator } from "../operators/terminal/minBy";
import { SequenceEqualOperator } from "../operators/terminal/sequenceEqual";
import { SingleOperator } from "../operators/terminal/single";
import { SingleOrDefaultOperator } from "../operators/terminal/singleOrDefault";
import { StartsWithOperator } from "../operators/terminal/startsWith";
import { SumOperator } from "../operators/terminal/sum";
import { ToArrayOperator } from "../operators/terminal/toArray";
import { ToMapOperator } from "../operators/terminal/toMap";
import { ToRecordOperator } from "../operators/terminal/toRecord";
import { ToSetOperator } from "../operators/terminal/toSet";
import { IEnumerable, IEnumerator, IEnumeratorFactory, IteratorFactory, ITyneqEnumerable, ITyneqOrderedEnumerable, KeyValuePair } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";

export abstract class TyneqEnumerableBase<TSource> implements ITyneqEnumerable<TSource> {

    public [Symbol.iterator](): IEnumerator<TSource> {
        return this.getEnumerator();
    }

    public abstract getEnumerator(): IEnumerator<TSource>;

    // terminal operators

    /**
     * Determines whether any element of a sequence satisfies a condition.
     * @param predicate A function to test each element for a condition.
     * @returns `true` if any element in the source sequence pass the test in the specified predicate; otherwise, `false`.
     */
    public any(predicate: (item: TSource) => boolean): boolean {
        return new AnyOperator<TSource>(this, predicate)
            .process();
    }

    public all(predicate: (item: TSource) => boolean): boolean {
        return new AllOperator<TSource>(this, predicate)
            .process();
    }

    public contains(value: TSource): boolean {
        return new ContainsOperator<TSource>(this, value)
            .process();
    }

    /**
     * Returns the number of elements in a sequence.
     * @returns The number of elements in the input sequence.
     */
    public count(): number {
        return new CountOperator<TSource>(this)
            .process();
    }

    public defaultIfEmpty(defaultValue: TSource): ITyneqEnumerable<TSource> {
        return new DefaultIfEmptyOperator<TSource>(this, defaultValue)
            .process();
    }

    public elementAt(index: number): TSource {
        return new ElementAtOperator<TSource>(this, index)
            .process();
    }

    public elementAtOrDefault(index: number, defaultValue: TSource): TSource {
        return new ElementAtOrDefaultOperator<TSource>(this, index, defaultValue)
            .process();
    }

    public first(predicate: (item: TSource) => boolean): TSource {
        return new FirstOperator<TSource>(this, predicate)
            .process();
    }

    public firstOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        return new FirstOrDefaultOperator<TSource>(this, predicate, defaultValue)
            .process();
    }

    public indexOf(predicate: (item: TSource) => boolean, startIndex: number = 0): number {
        return new IndexOfOperator<TSource>(this, predicate, startIndex)
            .process();
    }

    public last(predicate: (item: TSource) => boolean): TSource {
        return new LastOperator<TSource>(this, predicate)
            .process();
    }

    public lastOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        return new LastOrDefaultOperator<TSource>(this, predicate, defaultValue)
            .process();
    }

    public max(comparer?: ((a: TSource, b: TSource) => number) | undefined): TSource {
        return new MaxOperator<TSource>(this, comparer)
            .process();
    }

    public maxBy<TKey>(keySelector: (element: TSource) => TKey, comparer?: ((a: TKey, b: TKey) => number) | undefined): TSource {
        return new MaxByOperator<TSource, TKey>(this, keySelector, comparer)
            .process();
    }

    public min(comparer?: ((a: TSource, b: TSource) => number) | undefined): TSource {
        return new MinOperator<TSource>(this, comparer)
            .process();
    }

    public minBy<TKey>(keySelector: (element: TSource) => TKey, comparer?: ((a: TKey, b: TKey) => number) | undefined): TSource {
        return new MinByOperator<TSource, TKey>(this, keySelector, comparer)
            .process();
    }

    public sequenceEqual(other: IEnumerable<TSource>, equalityComparer?: ((a: TSource, b: TSource) => boolean) | undefined): boolean {
        return new SequenceEqualOperator<TSource>(this, other, equalityComparer)
            .process();
    }

    public single(predicate: (item: TSource) => boolean): TSource {
        return new SingleOperator<TSource>(this, predicate)
            .process();
    }

    public singleOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        return new SingleOrDefaultOperator<TSource>(this, predicate, defaultValue)
            .process();
    }

    public startsWith(sequence: IEnumerable<TSource>): boolean {
        return new StartsWithOperator<TSource>(this, sequence)
            .process();
    }

    public sum(selector: (item: TSource) => number): number {
        return new SumOperator<TSource>(this, selector)
            .process();
    }

    public toArray(): TSource[] {
        return new ToArrayOperator<TSource>(this)
            .process();
    }

    public toMap<TKey, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>): Map<TKey, TValue> {
        return new ToMapOperator<TSource, TKey, TValue>(this, selector)
            .process();
    }

    public toRecord<TKey extends string | number | symbol, TValue>(selector: (item: TSource) => KeyValuePair<TKey, TValue>): Record<TKey, TValue> {
        return new ToRecordOperator<TSource, TKey, TValue>(this, selector)
            .process();
    }

    public toSet(): Set<TSource> {
        return new ToSetOperator<TSource>(this)
            .process();
    }

    // stream operators

    public append(item: TSource): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new AppendOperatorEnumerable<TSource>(this, item)
        );
    }

    public chunk(size: number): ITyneqEnumerable<TSource[]> {
        return this.createEnumerable(
            new ChunkOperatorEnumerable<TSource>(this, size)
        );
    }

    public concat(other: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new ConcatOperatorEnumerable<TSource>(this, other)
        );
    }

    public prepend(item: TSource): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new PrependOperatorEnumerable<TSource>(this, item)
        );
    }

    public select<TResult>(selector: (item: TSource) => TResult): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new SelectOperatorEnumerable<TSource, TResult>(this, selector)
        );
    }

    public selectMany<TResult>(selector: (item: TSource) => IEnumerable<TResult>): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new SelectManyOperatorEnumerable<TSource, TResult>(this, selector)
        );
    }

    public skip(count: number): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new SkipOperatorEnumerable<TSource>(this, count)
        );
    }

    public skipLast(count: number): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new SkipLastOperatorEnumerable<TSource>(this, count)
        );
    }

    public skipWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new SkipWhileOperatorEnumerable<TSource>(this, predicate)
        );
    }

    public split(splitOn: (item: TSource) => boolean): ITyneqEnumerable<TSource[]> {
        return this.createEnumerable(
            new SplitOperatorEnumerable<TSource>(this, splitOn)
        );
    }

    public take(count: number): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new TakeOperatorEnumerable<TSource>(this, count)
        );
    }

    public takeWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new TakeWhileOperatorEnumerable<TSource>(this, predicate)
        );
    }

    public tap(action: (item: TSource) => void): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new TapOperatorEnumerable<TSource>(this, action)
        );
    }

    public tapIf(action: (item: TSource) => void, predicate: () => boolean): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new TapIfOperatorEnumerable<TSource>(this, action, predicate)
        );
    }

    public where(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new WhereOperatorEnumerable<TSource>(this, predicate)
        );
    }

    public zip<TOther, TResult>(other: IEnumerable<TOther>, selector: (first: TSource, second: TOther) => TResult): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new ZipOperatorEnumerable<TSource, TOther, TResult>(this, other, selector)
        );
    }

    // buffering operators

    public distinct(): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new DistinctOperatorEnumerable<TSource>(this)
        );
    }

    public distinctBy<TKey>(keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new DistinctByOperatorEnumerable<TSource, TKey>(this, keySelector)
        );
    }

    public except(excludedValues: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new ExceptOperatorEnumerable<TSource>(this, excludedValues)
        );
    }
    
    public exceptBy<TKey>(excludedKeys: IEnumerable<TKey>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new ExceptByOperatorEnumerable<TSource, TKey>(this, excludedKeys, keySelector)
        );
    }

    public groupBy<TKey, TValue, TResult>(
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: ITyneqEnumerable<TValue>) => TResult
    ): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new GroupByOperatorEnumerable<TSource, TKey, TValue, TResult>(this, keySelector, valueSelector, resultSelector)
        );
    }

    public groupJoin<TInner, TKey, TResult>(
        inner: IEnumerable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, group: ITyneqEnumerable<TInner>) => TResult
    ): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new GroupJoinOperatorEnumerable<TSource, TInner, TKey, TResult>(this, inner, outerKeySelector, innerKeySelector, resultSelector)
        );
    }

    public intersect(intersectedValues: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new IntersectOperatorEnumerable<TSource>(this, intersectedValues)
        )
    }

    public intersectBy<TKey>(intersectedKeys: IEnumerable<TKey>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new IntersectByOperatorEnumerable<TSource, TKey>(this, intersectedKeys, keySelector)
        );
    }

    public join<TInner, TKey, TResult>(
        inner: IEnumerable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, inner: TInner) => TResult
    ): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new JoinOperatorEnumerable<TSource, TInner, TKey, TResult>(this, inner, outerKeySelector, innerKeySelector, resultSelector)
        );
    }

    public orderBy<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: ((a: TKey, b: TKey) => number) | undefined
    ): ITyneqOrderedEnumerable<TSource> {
        return this.createOrderedEnumerable(
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            false
        );
    }

    public orderByDescending<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: ((a: TKey, b: TKey) => number) | undefined
    ): ITyneqOrderedEnumerable<TSource> {
        return this.createOrderedEnumerable(
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            true
        );
    }

    public reverse(): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new ReverseOperatorEnumerable<TSource>(this)
        );
    }

    public shuffle(): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new ShuffleOperatorEnumerable<TSource>(this)
        );
    }

    public union(otherValues: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new UnionOperatorEnumerable<TSource>(this, otherValues)
        );
    }

    public unionBy<TKey>(otherValues: IEnumerable<TSource>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new UnionByOperatorEnumerable<TSource, TKey>(this, otherValues, keySelector)
        );
    }

    // extensions

    public pipe<TResult>(factory: (source: IEnumerable<TSource>) => IEnumerator<TResult> | IterableIterator<TResult>): ITyneqEnumerable<TResult> {
        ArgumentUtility.checkNotOptional(factory, nameof({ factory }));
        const self = this;
        return this.createEnumerable({
            getEnumerator() {
                return factory(self);
            },
        } satisfies IEnumeratorFactory<TResult>);
    }

    protected abstract createEnumerable<TResult>(factory: IEnumeratorFactory<TResult>): ITyneqEnumerable<TResult>;

    protected abstract createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean
    ): ITyneqOrderedEnumerable<TSource>;
}