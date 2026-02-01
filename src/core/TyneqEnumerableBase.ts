import { DistinctOperator } from "../operators/buffer/distinct";
import { DistinctByOperator } from "../operators/buffer/distinctBy";
import { ExceptOperator } from "../operators/buffer/except";
import { ExceptByOperator } from "../operators/buffer/exceptBy";
import { GroupByOperator } from "../operators/buffer/groupBy";
import { IntersectOperator } from "../operators/buffer/intersect";
import { IntersectByOperator } from "../operators/buffer/intersectBy";
import { ReverseOperator } from "../operators/buffer/reverse";
import { UnionOperator } from "../operators/buffer/union";
import { UnionByOperator } from "../operators/buffer/unionBy";
import { AppendOperator } from "../operators/streaming/append";
import { ChunkOperator } from "../operators/streaming/chunk";
import { ConcatOperator } from "../operators/streaming/concat";
import { PrependOperator } from "../operators/streaming/prepend";
import { SelectOperator } from "../operators/streaming/select";
import { SelectManyOperator } from "../operators/streaming/selectMany";
import { SkipOperator } from "../operators/streaming/skip";
import { SkipLastOperator } from "../operators/streaming/skipLast";
import { SkipWhileOperator } from "../operators/streaming/skipWhile";
import { TakeOperator } from "../operators/streaming/take";
import { TakeWhileOperator } from "../operators/streaming/takeWhile";
import { WhereOperator } from "../operators/streaming/where";
import { ZipOperator } from "../operators/streaming/zip";
import { AllOperator } from "../operators/terminal/all";
import { AnyOperator } from "../operators/terminal/any";
import { ContainsOperator } from "../operators/terminal/contains";
import { CountOperator } from "../operators/terminal/count";
import { DefaultIfEmptyOperator } from "../operators/terminal/defaultIfEmpty";
import { ElementAtOperator } from "../operators/terminal/elementAt";
import { ElementAtOrDefaultOperator } from "../operators/terminal/elementAtOrDefault";
import { FirstOperator } from "../operators/terminal/first";
import { FirstOrDefaultOperator } from "../operators/terminal/firstOrDefault";
import { LastOperator } from "../operators/terminal/last";
import { LastOrDefaultOperator } from "../operators/terminal/lastOrDefault";
import { MaxOperator } from "../operators/terminal/max";
import { MaxByOperator } from "../operators/terminal/maxBy";
import { MinOperator } from "../operators/terminal/min";
import { MinByOperator } from "../operators/terminal/minBy";
import { SequenceEqualOperator } from "../operators/terminal/sequenceEqual";
import { SingleOperator } from "../operators/terminal/single";
import { SingleOrDefaultOperator } from "../operators/terminal/singleOrDefault";
import { SumOperator } from "../operators/terminal/sum";
import { ToArrayOperator } from "../operators/terminal/toArray";
import { ToMapOperator } from "../operators/terminal/toMap";
import { ToRecordOperator } from "../operators/terminal/toRecord";
import { ToSetOperator } from "../operators/terminal/toSet";
import { IEnumerable, IEnumerator, IteratorFactory, ITyneqEnumerable, ITyneqOrderedEnumerable, KeyValuePair } from "../types/core";

export abstract class TyneqEnumerableBase<TSource> implements ITyneqEnumerable<TSource> {

    public [Symbol.iterator](): IEnumerator<TSource> {
        return this.getSource();
    }

    public abstract getSource(): IEnumerator<TSource>;

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
            new AppendOperator<TSource>(this, item).getFactory()
        );
    }

    public chunk(size: number): ITyneqEnumerable<TSource[]> {
        return this.createEnumerable(
            new ChunkOperator<TSource>(this, size).getFactory()
        );
    }

    public concat(other: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new ConcatOperator<TSource>(this, other).getFactory()
        );
    }

    public prepend(item: TSource): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new PrependOperator<TSource>(this, item).getFactory()
        );
    }

    public select<TResult>(selector: (item: TSource) => TResult): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new SelectOperator<TSource, TResult>(this, selector).getFactory()
        );
    }

    public selectMany<TResult>(selector: (item: TSource) => IEnumerable<TResult>): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new SelectManyOperator<TSource, TResult>(this, selector).getFactory()
        );
    }

    public skip(count: number): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new SkipOperator<TSource>(this, count).getFactory()
        );
    }

    public skipLast(count: number): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new SkipLastOperator<TSource>(this, count).getFactory()
        );
    }

    public skipWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new SkipWhileOperator<TSource>(this, predicate).getFactory()
        );
    }

    public take(count: number): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new TakeOperator<TSource>(this, count).getFactory()
        );
    }

    public takeWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new TakeWhileOperator<TSource>(this, predicate).getFactory()
        );
    }

    public zip<TOther, TResult>(other: IEnumerable<TOther>, selector: (first: TSource, second: TOther) => TResult): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new ZipOperator<TSource, TOther, TResult>(this, other, selector).getFactory()
        );
    }

    public where(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new WhereOperator<TSource>(this, predicate).getFactory()
        );
    }

    // buffering operators

    public distinct(): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new DistinctOperator<TSource>(this).getFactory()
        );
    }

    public distinctBy<TKey>(keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new DistinctByOperator<TSource, TKey>(this, keySelector).getFactory()
        );
    }

    public except(excludedValues: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new ExceptOperator<TSource>(this, excludedValues).getFactory()
        );
    }

    public exceptBy<TKey>(excludedKeys: IEnumerable<TKey>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new ExceptByOperator<TSource, TKey>(this, excludedKeys, keySelector).getFactory()
        );
    }

    public groupBy<TKey, TValue, TResult>(
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: ITyneqEnumerable<TValue>) => TResult
    ): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            new GroupByOperator<TSource, TKey, TValue, TResult>(this, keySelector, valueSelector, resultSelector).getFactory()
        );
    }

    public intersect(intersectedValues: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new IntersectOperator<TSource>(this, intersectedValues).getFactory()
        )
    }

    public intersectBy<TKey>(intersectedKeys: IEnumerable<TKey>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new IntersectByOperator<TSource, TKey>(this, intersectedKeys, keySelector).getFactory()
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
            new ReverseOperator<TSource>(this).getFactory()
        );
    }

    public union(otherValues: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new UnionOperator<TSource>(this, otherValues).getFactory()
        );
    }

    public unionBy<TKey>(otherValues: IEnumerable<TSource>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return this.createEnumerable(
            new UnionByOperator<TSource, TKey>(this, otherValues, keySelector).getFactory()
        );
    }

    // extensions

    public pipe<TResult>(factory: (source: IEnumerator<TSource>) => IEnumerator<TResult>): ITyneqEnumerable<TResult> {
        return this.createEnumerable(
            () => factory(this.getSource())
        );
    }

    protected abstract createEnumerable<TResult>(factory: IteratorFactory<TResult>): ITyneqEnumerable<TResult>;

    protected abstract createOrderedEnumerable<TKey>(
        keySelector: (x: TSource) => TKey,
        comparer: (a: TKey, b: TKey) => number,
        descending: boolean
    ): ITyneqOrderedEnumerable<TSource>;
}