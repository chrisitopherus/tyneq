import { Enumerator, TyneqSequence, KeyValuePair, MinMaxResult, IOperatorMetadataCarrier } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { tyneqQueryNode } from "../types/queryplan";
import { QueryNode } from "../queryplan/QueryNode";
import { TyneqEnumerableCore } from "./TyneqEnumerableCore";
// --- Terminal operators ---
import { AggregateOperator } from "../operators/aggregate";
import { AllOperator } from "../operators/all";
import { AnyOperator } from "../operators/any";
import { AverageOperator } from "../operators/average";
import { ConsumeOperator } from "../operators/consume";
import { ContainsOperator } from "../operators/contains";
import { CountOperator } from "../operators/count";
import { CountByOperator } from "../operators/countBy";
import { ElementAtOperator } from "../operators/elementAt";
import { ElementAtOrDefaultOperator } from "../operators/elementAtOrDefault";
import { FirstOperator } from "../operators/first";
import { FirstOrDefaultOperator } from "../operators/firstOrDefault";
import { IndexOfOperator } from "../operators/indexOf";
import { IsNullOrEmptyOperator } from "../operators/isNullOrEmpty";
import { LastOperator } from "../operators/last";
import { LastOrDefaultOperator } from "../operators/lastOrDefault";
import { MaxOperator } from "../operators/max";
import { MaxByOperator } from "../operators/maxBy";
import { MinOperator } from "../operators/min";
import { MinByOperator } from "../operators/minBy";
import { MinMaxOperator } from "../operators/minMax";
import { SequenceEqualOperator } from "../operators/sequenceEqual";
import { SingleOperator } from "../operators/single";
import { SingleOrDefaultOperator } from "../operators/singleOrDefault";
import { StartsWithOperator } from "../operators/startsWith";
import { SumOperator } from "../operators/sum";
import { ToArrayOperator } from "../operators/toArray";
import { ToAsyncOperator } from "../operators/toAsync";
import { ToMapOperator } from "../operators/toMap";
import { ToRecordOperator } from "../operators/toRecord";
import { ToSetOperator } from "../operators/toSet";
// --- Streaming enumerators ---
import { AppendEnumerator } from "../enumerators/streaming/append";
import { CastEnumerator } from "../enumerators/streaming/cast";
import { ChunkEnumerator } from "../enumerators/streaming/chunk";
import { ConcatEnumerator } from "../enumerators/streaming/concat";
import { DefaultIfEmptyEnumerator } from "../enumerators/streaming/defaultIfEmpty";
import { OfTypeEnumerator } from "../enumerators/streaming/ofType";
import { PairwiseEnumerator } from "../enumerators/streaming/pairwise";
import { PopulateEnumerator } from "../enumerators/streaming/populate";
import { PrependEnumerator } from "../enumerators/streaming/prepend";
import { ScanEnumerator } from "../enumerators/streaming/scan";
import { SelectEnumerator } from "../enumerators/streaming/select";
import { SelectManyEnumerator } from "../enumerators/streaming/selectMany";
import { SkipEnumerator } from "../enumerators/streaming/skip";
import { SkipLastEnumerator } from "../enumerators/streaming/skipLast";
import { SkipWhileEnumerator } from "../enumerators/streaming/skipWhile";
import { SplitEnumerator } from "../enumerators/streaming/split";
import { TakeEnumerator } from "../enumerators/streaming/take";
import { TakeWhileEnumerator } from "../enumerators/streaming/takeWhile";
import { TapEnumerator } from "../enumerators/streaming/tap";
import { TapIfEnumerator } from "../enumerators/streaming/tapIf";
import { ThrottleEnumerator } from "../enumerators/streaming/throttle";
import { WhereEnumerator } from "../enumerators/streaming/where";
import { ZipEnumerator } from "../enumerators/streaming/zip";
// --- Buffer enumerators ---
import { BacksertEnumerator } from "../enumerators/buffer/backsert";
import { DistinctEnumerator } from "../enumerators/buffer/distinct";
import { DistinctByEnumerator } from "../enumerators/buffer/distinctBy";
import { ExceptEnumerator } from "../enumerators/buffer/except";
import { ExceptByEnumerator } from "../enumerators/buffer/exceptBy";
import { GroupByEnumerator } from "../enumerators/buffer/groupBy";
import { GroupJoinEnumerator } from "../enumerators/buffer/groupJoin";
import { IntersectEnumerator } from "../enumerators/buffer/intersect";
import { IntersectByEnumerator } from "../enumerators/buffer/intersectBy";
import { JoinEnumerator } from "../enumerators/buffer/join";
import { ReverseEnumerator } from "../enumerators/buffer/reverse";
import { ShuffleEnumerator } from "../enumerators/buffer/shuffle";
import { UnionEnumerator } from "../enumerators/buffer/union";
import { UnionByEnumerator } from "../enumerators/buffer/unionBy";
import { getOperatorMetadata } from "./registry/OperatorMetadata";

/**
 * Abstract base class that implements all {@link TyneqSequence} operator methods.
 *
 * @remarks
 * All operator methods delegate to the corresponding operator class registered via
 * `@operator`, `@terminal`, or the functional registration APIs.
 * Subclasses implement `createEnumerable`, `createOrderedEnumerable`, and `createCachedEnumerable`
 * to control which concrete sequence types are returned.
 *
 * @internal
 */
export abstract class TyneqEnumerableBase<TSource>
    extends TyneqEnumerableCore<TSource>
    implements TyneqSequence<TSource> {

    private createOperatorNode(
        operator: new (...args: any[]) => any,
        args: readonly unknown[]
    ): QueryNode {
        const metadata = getOperatorMetadata(operator as unknown as IOperatorMetadataCarrier);
        return new QueryNode(metadata.name, args, this[tyneqQueryNode], metadata.category);
    }

    // --- Terminal operators ---

    public aggregate<UAccumulate, VResult>(
        seed: UAccumulate,
        func: (accumulate: UAccumulate, item: TSource) => UAccumulate,
        resultSelector: (accumulate: UAccumulate) => VResult
    ): VResult {
        return new AggregateOperator<TSource, UAccumulate, VResult>(this, seed, func, resultSelector).process();
    }

    public all(predicate: (item: TSource) => boolean): boolean {
        return new AllOperator(this, predicate).process();
    }

    public any(predicate: (item: TSource) => boolean): boolean {
        return new AnyOperator(this, predicate).process();
    }

    public average(selector: (item: TSource) => number): number {
        return new AverageOperator(this, selector).process();
    }

    public consume(): void {
        new ConsumeOperator(this).process();
    }

    public contains(value: TSource): boolean {
        return new ContainsOperator(this, value).process();
    }

    public count(): number {
        return new CountOperator(this).process();
    }

    public countBy(predicate: (item: TSource) => boolean): number {
        return new CountByOperator(this, predicate).process();
    }

    public elementAt(index: number): TSource {
        ArgumentUtility.checkNonNegative({ index });
        return new ElementAtOperator(this, index).process();
    }

    public elementAtOrDefault(index: number, defaultValue: TSource): TSource {
        return new ElementAtOrDefaultOperator(this, index, defaultValue).process();
    }

    public first(predicate: (item: TSource) => boolean): TSource {
        return new FirstOperator(this, predicate).process();
    }

    public firstOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        return new FirstOrDefaultOperator(this, predicate, defaultValue).process();
    }

    public indexOf(predicate: (item: TSource) => boolean, startIndex: number = 0): number {
        return new IndexOfOperator(this, predicate, startIndex).process();
    }

    public isNullOrEmpty(): boolean {
        return new IsNullOrEmptyOperator(this).process();
    }

    public last(predicate: (item: TSource) => boolean): TSource {
        return new LastOperator(this, predicate).process();
    }

    public lastOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        return new LastOrDefaultOperator(this, predicate, defaultValue).process();
    }

    public max(comparer?: (a: TSource, b: TSource) => number): TSource {
        return new MaxOperator(this, comparer).process();
    }

    public maxBy<TKey>(
        keySelector: (element: TSource) => TKey,
        comparer?: (a: TKey, b: TKey) => number
    ): TSource {
        return new MaxByOperator<TSource, TKey>(this, keySelector, comparer).process();
    }

    public min(comparer?: (a: TSource, b: TSource) => number): TSource {
        return new MinOperator(this, comparer).process();
    }

    public minBy<TKey>(
        keySelector: (element: TSource) => TKey,
        comparer?: (a: TKey, b: TKey) => number
    ): TSource {
        return new MinByOperator<TSource, TKey>(this, keySelector, comparer).process();
    }

    public minMax(comparer?: (a: TSource, b: TSource) => number): MinMaxResult<TSource> {
        return new MinMaxOperator(this, comparer).process();
    }

    public sequenceEqual(
        other: Iterable<TSource>,
        equalityComparer?: (a: TSource, b: TSource) => boolean
    ): boolean {
        return new SequenceEqualOperator(this, other, equalityComparer).process();
    }

    public single(predicate: (item: TSource) => boolean): TSource {
        return new SingleOperator(this, predicate).process();
    }

    public singleOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        return new SingleOrDefaultOperator(this, predicate, defaultValue).process();
    }

    public startsWith(sequence: Iterable<TSource>): boolean {
        return new StartsWithOperator(this, sequence).process();
    }

    public sum(selector: (item: TSource) => number): number {
        return new SumOperator(this, selector).process();
    }

    public toArray(): TSource[] {
        return new ToArrayOperator(this).process();
    }

    public toAsync(): AsyncIterable<TSource> {
        return new ToAsyncOperator(this).process();
    }

    public toMap<TKey, TValue>(
        selector: (item: TSource) => KeyValuePair<TKey, TValue>
    ): Map<TKey, TValue> {
        return new ToMapOperator<TSource, TKey, TValue>(this, selector).process();
    }

    public toRecord<TKey extends string | number | symbol, TValue>(
        selector: (item: TSource) => KeyValuePair<TKey, TValue>
    ): Record<TKey, TValue> {
        return new ToRecordOperator<TSource, TKey, TValue>(this, selector).process();
    }

    public toSet(): Set<TSource> {
        return new ToSetOperator(this).process();
    }

    // --- Streaming operators ---

    public cast<U>(): TyneqSequence<U> {
        const node = this.createOperatorNode(CastEnumerator, []);
        return this.createEnumerable(
            { getEnumerator: () => new CastEnumerator<TSource, U>(this.getEnumerator()) },
            node
        );
    }

    public ofType<U extends TSource>(guard: (value: TSource) => value is U): TyneqSequence<U> {
        ArgumentUtility.checkNotOptional({ guard });
        const node = this.createOperatorNode(OfTypeEnumerator, [guard]);
        return this.createEnumerable(
            { getEnumerator: () => new OfTypeEnumerator<TSource, U>(this.getEnumerator(), guard) },
            node
        );
    }

    public append(item: TSource): TyneqSequence<TSource> {
        const node = this.createOperatorNode(AppendEnumerator, [item]);
        return this.createEnumerable(
            { getEnumerator: () => new AppendEnumerator<TSource>(this.getEnumerator(), item) },
            node
        );
    }

    public chunk(size: number): TyneqSequence<TSource[]> {
        ArgumentUtility.checkSafeInteger({ size });
        ArgumentUtility.checkPositive({ size });
        const node = this.createOperatorNode(ChunkEnumerator, [size]);
        return this.createEnumerable(
            { getEnumerator: () => new ChunkEnumerator<TSource>(this.getEnumerator(), size) },
            node
        );
    }

    public concat(other: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ other });
        ArgumentUtility.checkIterable({ other });
        const node = this.createOperatorNode(ConcatEnumerator, [other]);
        return this.createEnumerable(
            { getEnumerator: () => new ConcatEnumerator<TSource>(this.getEnumerator(), other) },
            node
        );
    }

    public defaultIfEmpty(defaultValue: TSource): TyneqSequence<TSource> {
        const node = this.createOperatorNode(DefaultIfEmptyEnumerator, [defaultValue]);
        return this.createEnumerable(
            { getEnumerator: () => new DefaultIfEmptyEnumerator<TSource>(this.getEnumerator(), defaultValue) },
            node
        );
    }

    public pairwise(): TyneqSequence<[TSource, TSource]> {
        const node = this.createOperatorNode(PairwiseEnumerator, []);
        return this.createEnumerable(
            { getEnumerator: () => new PairwiseEnumerator<TSource>(this.getEnumerator()) },
            node
        );
    }

    public populate<TValue>(value: TValue): TyneqSequence<TValue> {
        const node = this.createOperatorNode(PopulateEnumerator, [value]);
        return this.createEnumerable(
            { getEnumerator: () => new PopulateEnumerator<TSource, TValue>(this.getEnumerator(), value) },
            node
        );
    }

    public prepend(item: TSource): TyneqSequence<TSource> {
        const node = this.createOperatorNode(PrependEnumerator, [item]);
        return this.createEnumerable(
            { getEnumerator: () => new PrependEnumerator<TSource>(this.getEnumerator(), item) },
            node
        );
    }

    public scan<TResult>(
        seed: TResult,
        accumulator: (acc: TResult, item: TSource) => TResult
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ seed });
        ArgumentUtility.checkNotOptional({ accumulator });
        ArgumentUtility.checkFunction({ accumulator });
        const node = this.createOperatorNode(ScanEnumerator, [seed, accumulator]);
        return this.createEnumerable(
            { getEnumerator: () => new ScanEnumerator<TSource, TResult>(this.getEnumerator(), seed, accumulator) },
            node
        );
    }

    public select<TResult>(
        selector: (item: TSource) => TResult
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ selector });
        const node = this.createOperatorNode(SelectEnumerator, [selector]);
        return this.createEnumerable(
            { getEnumerator: () => new SelectEnumerator<TSource, TResult>(this.getEnumerator(), selector) },
            node
        );
    }

    public selectMany<TResult>(
        selector: (item: TSource) => Iterable<TResult>
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ selector });
        const node = this.createOperatorNode(SelectManyEnumerator, [selector]);
        return this.createEnumerable(
            { getEnumerator: () => new SelectManyEnumerator<TSource, TResult>(this.getEnumerator(), selector) },
            node
        );
    }

    public skip(count: number): TyneqSequence<TSource> {
        ArgumentUtility.checkNonNegative({ count });
        const node = this.createOperatorNode(SkipEnumerator, [count]);
        return this.createEnumerable(
            { getEnumerator: () => new SkipEnumerator<TSource>(this.getEnumerator(), count) },
            node
        );
    }

    public skipLast(count: number): TyneqSequence<TSource> {
        const node = this.createOperatorNode(SkipLastEnumerator, [count]);
        return this.createEnumerable(
            { getEnumerator: () => new SkipLastEnumerator<TSource>(this.getEnumerator(), count) },
            node
        );
    }

    public skipWhile(predicate: (item: TSource) => boolean): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ predicate });
        const node = this.createOperatorNode(SkipWhileEnumerator, [predicate]);
        return this.createEnumerable(
            { getEnumerator: () => new SkipWhileEnumerator<TSource>(this.getEnumerator(), predicate) },
            node
        );
    }

    public split(splitOn: (item: TSource) => boolean): TyneqSequence<TSource[]> {
        ArgumentUtility.checkNotOptional({ splitOn });
        const node = this.createOperatorNode(SplitEnumerator, [splitOn]);
        return this.createEnumerable(
            { getEnumerator: () => new SplitEnumerator<TSource>(this.getEnumerator(), splitOn) },
            node
        );
    }

    public take(count: number): TyneqSequence<TSource> {
        const node = this.createOperatorNode(TakeEnumerator, [count]);
        return this.createEnumerable(
            { getEnumerator: () => new TakeEnumerator<TSource>(this.getEnumerator(), count) },
            node
        );
    }

    public takeWhile(predicate: (item: TSource) => boolean): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ predicate });
        const node = this.createOperatorNode(TakeWhileEnumerator, [predicate]);
        return this.createEnumerable(
            { getEnumerator: () => new TakeWhileEnumerator<TSource>(this.getEnumerator(), predicate) },
            node
        );
    }

    public tap(action: (item: TSource) => void): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ action });
        const node = this.createOperatorNode(TapEnumerator, [action]);
        return this.createEnumerable(
            { getEnumerator: () => new TapEnumerator<TSource>(this.getEnumerator(), action) },
            node
        );
    }

    public tapIf(action: (item: TSource) => void, predicate: () => boolean): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ action });
        ArgumentUtility.checkNotOptional({ predicate });
        const node = this.createOperatorNode(TapIfEnumerator, [action, predicate]);
        return this.createEnumerable(
            { getEnumerator: () => new TapIfEnumerator<TSource>(this.getEnumerator(), action, predicate) },
            node
        );
    }

    public throttle(count: number): TyneqSequence<TSource> {
        ArgumentUtility.checkSafeInteger({ count });
        ArgumentUtility.checkPositive({ count });
        const node = this.createOperatorNode(ThrottleEnumerator, [count]);
        return this.createEnumerable(
            { getEnumerator: () => new ThrottleEnumerator<TSource>(this.getEnumerator(), count) },
            node
        );
    }

    public where(predicate: (item: TSource) => boolean): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ predicate });
        const node = this.createOperatorNode(WhereEnumerator, [predicate]);
        return this.createEnumerable(
            { getEnumerator: () => new WhereEnumerator<TSource>(this.getEnumerator(), predicate) },
            node
        );
    }

    public zip<TOther, TResult>(
        other: Iterable<TOther>,
        selector: (first: TSource, second: TOther) => TResult
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ other });
        ArgumentUtility.checkIterable({ other });
        ArgumentUtility.checkNotOptional({ selector });
        const node = this.createOperatorNode(ZipEnumerator, [other, selector]);
        return this.createEnumerable(
            { getEnumerator: () => new ZipEnumerator<TSource, TOther, TResult>(this.getEnumerator(), other, selector) },
            node
        );
    }

    // --- Buffer operators ---

    public backsert(index: number, other: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ index });
        ArgumentUtility.checkNotOptional({ other });
        ArgumentUtility.checkSafeInteger({ index });
        ArgumentUtility.checkNonNegative({ index });
        ArgumentUtility.checkIterable({ other });
        const node = this.createOperatorNode(BacksertEnumerator, [index, other]);
        return this.createEnumerable(
            { getEnumerator: () => new BacksertEnumerator<TSource>(this.getEnumerator(), index, other) },
            node
        );
    }

    public distinct(): TyneqSequence<TSource> {
        const node = this.createOperatorNode(DistinctEnumerator, []);
        return this.createEnumerable(
            { getEnumerator: () => new DistinctEnumerator<TSource>(this.getEnumerator()) },
            node
        );
    }

    public distinctBy<TKey>(keySelector: (item: TSource) => TKey): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ keySelector });
        const node = this.createOperatorNode(DistinctByEnumerator, [keySelector]);
        return this.createEnumerable(
            { getEnumerator: () => new DistinctByEnumerator<TSource, TKey>(this.getEnumerator(), keySelector) },
            node
        );
    }

    public except(excludedValues: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ excludedValues });
        ArgumentUtility.checkIterable({ excludedValues });
        const node = this.createOperatorNode(ExceptEnumerator, [excludedValues]);
        return this.createEnumerable(
            { getEnumerator: () => new ExceptEnumerator<TSource>(this.getEnumerator(), excludedValues) },
            node
        );
    }

    public exceptBy<TKey>(
        excludedKeys: Iterable<TKey>,
        keySelector: (item: TSource) => TKey
    ): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ excludedKeys });
        ArgumentUtility.checkIterable({ excludedKeys });
        ArgumentUtility.checkNotOptional({ keySelector });
        const node = this.createOperatorNode(ExceptByEnumerator, [excludedKeys, keySelector]);
        return this.createEnumerable(
            { getEnumerator: () => new ExceptByEnumerator<TSource, TKey>(this.getEnumerator(), excludedKeys, keySelector) },
            node
        );
    }

    public groupBy<TKey, TValue, TResult>(
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: TyneqSequence<TValue>) => TResult
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ keySelector });
        ArgumentUtility.checkNotOptional({ valueSelector });
        ArgumentUtility.checkNotOptional({ resultSelector });
        const node = this.createOperatorNode(GroupByEnumerator, [keySelector, valueSelector, resultSelector]);
        const groupFactory = (values: TValue[]): TyneqSequence<TValue> =>
            this.createEnumerable({ getEnumerator: () => values[Symbol.iterator]() as Enumerator<TValue> });
        return this.createEnumerable(
            {
                getEnumerator: () => new GroupByEnumerator<TSource, TKey, TValue, TResult>(
                    this.getEnumerator(), keySelector, valueSelector, resultSelector, groupFactory
                ),
            },
            node
        );
    }

    public groupJoin<TInner, TKey, TResult>(
        inner: Iterable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, group: TyneqSequence<TInner>) => TResult
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ inner });
        ArgumentUtility.checkIterable({ inner });
        ArgumentUtility.checkNotOptional({ outerKeySelector });
        ArgumentUtility.checkNotOptional({ innerKeySelector });
        ArgumentUtility.checkNotOptional({ resultSelector });
        const node = this.createOperatorNode(GroupJoinEnumerator, [inner, outerKeySelector, innerKeySelector, resultSelector]);
        const groupFactory = (values: TInner[]): TyneqSequence<TInner> =>
            this.createEnumerable({ getEnumerator: () => values[Symbol.iterator]() as Enumerator<TInner> });
        return this.createEnumerable(
            {
                getEnumerator: () => new GroupJoinEnumerator<TSource, TInner, TKey, TResult>(
                    this.getEnumerator(), inner, outerKeySelector, innerKeySelector, resultSelector, groupFactory
                ),
            },
            node
        );
    }

    public intersect(intersectedValues: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ intersectedValues });
        ArgumentUtility.checkIterable({ intersectedValues });
        const node = this.createOperatorNode(IntersectEnumerator, [intersectedValues]);
        return this.createEnumerable(
            { getEnumerator: () => new IntersectEnumerator<TSource>(this.getEnumerator(), intersectedValues) },
            node
        );
    }

    public intersectBy<TKey>(
        intersectedKeys: Iterable<TKey>,
        keySelector: (item: TSource) => TKey
    ): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ intersectedKeys });
        ArgumentUtility.checkIterable({ intersectedKeys });
        ArgumentUtility.checkNotOptional({ keySelector });
        const node = this.createOperatorNode(IntersectByEnumerator, [intersectedKeys, keySelector]);
        return this.createEnumerable(
            { getEnumerator: () => new IntersectByEnumerator<TSource, TKey>(this.getEnumerator(), intersectedKeys, keySelector) },
            node
        );
    }

    public join<TInner, TKey, TResult>(
        inner: Iterable<TInner>,
        outerKeySelector: (outer: TSource) => TKey,
        innerKeySelector: (inner: TInner) => TKey,
        resultSelector: (outer: TSource, inner: TInner) => TResult
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ inner });
        ArgumentUtility.checkIterable({ inner });
        ArgumentUtility.checkNotOptional({ outerKeySelector });
        ArgumentUtility.checkNotOptional({ innerKeySelector });
        ArgumentUtility.checkNotOptional({ resultSelector });
        const node = this.createOperatorNode(JoinEnumerator, [inner, outerKeySelector, innerKeySelector, resultSelector]);
        return this.createEnumerable(
            {
                getEnumerator: () => new JoinEnumerator<TSource, TInner, TKey, TResult>(
                    this.getEnumerator(), inner, outerKeySelector, innerKeySelector, resultSelector
                ),
            },
            node
        );
    }

    public reverse(): TyneqSequence<TSource> {
        const node = this.createOperatorNode(ReverseEnumerator, []);
        return this.createEnumerable(
            { getEnumerator: () => new ReverseEnumerator<TSource>(this.getEnumerator()) },
            node
        );
    }

    public shuffle(): TyneqSequence<TSource> {
        const node = this.createOperatorNode(ShuffleEnumerator, []);
        return this.createEnumerable(
            { getEnumerator: () => new ShuffleEnumerator<TSource>(this.getEnumerator()) },
            node
        );
    }

    public union(otherValues: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ otherValues });
        ArgumentUtility.checkIterable({ otherValues });
        const node = this.createOperatorNode(UnionEnumerator, [otherValues]);
        return this.createEnumerable(
            { getEnumerator: () => new UnionEnumerator<TSource>(this.getEnumerator(), otherValues) },
            node
        );
    }

    public unionBy<TKey>(
        otherValues: Iterable<TSource>,
        keySelector: (item: TSource) => TKey
    ): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ otherValues });
        ArgumentUtility.checkIterable({ otherValues });
        ArgumentUtility.checkNotOptional({ keySelector });
        const node = this.createOperatorNode(UnionByEnumerator, [otherValues, keySelector]);
        return this.createEnumerable(
            { getEnumerator: () => new UnionByEnumerator<TSource, TKey>(this.getEnumerator(), otherValues, keySelector) },
            node
        );
    }
}
