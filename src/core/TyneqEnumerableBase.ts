import { Enumerator, TyneqSequence, KeyValuePair, MinMaxResult, Comparer, EqualityComparer } from "../types/core";
import { ArgumentOutOfRangeError } from "./errors/argument/ArgumentOutOfRangeError";
import { ArgumentUtility } from "../utility/ArgumentUtility";
import { EnumeratorUtility } from "../utility/EnumeratorUtility";
import { ItemAction, ItemPredicate, ItemSelector } from "../types/utility";
import { TyneqEnumerableCore } from "./TyneqEnumerableCore";
import { sequence } from "../plugin/decorators/sequence";
import { builtin } from "../plugin/decorators/builtin";

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
import { ExtremumOperator, ExtremumByOperator } from "../operators/extremum";
import { MinMaxOperator } from "../operators/minMax";
import { SequenceEqualOperator } from "../operators/sequenceEqual";
import { SingleOperator } from "../operators/single";
import { SingleOrDefaultOperator } from "../operators/singleOrDefault";
import { EndsWithOperator } from "../operators/endsWith";
import { StartsWithOperator } from "../operators/startsWith";
import { SumOperator } from "../operators/sum";
import { ToArrayOperator } from "../operators/toArray";
import { ToAsyncOperator } from "../operators/toAsync";
import { ToMapOperator } from "../operators/toMap";
import { ToRecordOperator } from "../operators/toRecord";
import { ToSetOperator } from "../operators/toSet";
import { AppendEnumerator } from "../enumerators/streaming/append";
import { ChunkEnumerator } from "../enumerators/streaming/chunk";
import { ConcatEnumerator } from "../enumerators/streaming/concat";
import { FlattenEnumerator } from "../enumerators/streaming/flatten";
import { DefaultIfEmptyEnumerator } from "../enumerators/streaming/defaultIfEmpty";
import { OfTypeEnumerator } from "../enumerators/streaming/ofType";
import { PairwiseEnumerator } from "../enumerators/streaming/pairwise";
import { PopulateEnumerator } from "../enumerators/streaming/populate";
import { PrependEnumerator } from "../enumerators/streaming/prepend";
import { ScanEnumerator } from "../enumerators/streaming/scan";
import { SelectEnumerator } from "../enumerators/streaming/select";
import { SelectManyEnumerator } from "../enumerators/streaming/selectMany";
import { RepeatSequenceEnumerator } from "../enumerators/streaming/repeatSequence";
import { SkipEnumerator } from "../enumerators/streaming/skip";
import { SkipLastEnumerator } from "../enumerators/streaming/skipLast";
import { SkipUntilEnumerator } from "../enumerators/streaming/skipUntil";
import { SkipWhileEnumerator } from "../enumerators/streaming/skipWhile";
import { SliceEnumerator } from "../enumerators/streaming/slice";
import { SplitEnumerator } from "../enumerators/streaming/split";
import { TakeEnumerator } from "../enumerators/streaming/take";
import { TakeUntilEnumerator } from "../enumerators/streaming/takeUntil";
import { TakeWhileEnumerator } from "../enumerators/streaming/takeWhile";
import { TapEnumerator } from "../enumerators/streaming/tap";
import { TapIfEnumerator } from "../enumerators/streaming/tapIf";
import { ThrottleEnumerator } from "../enumerators/streaming/throttle";
import { WhereEnumerator } from "../enumerators/streaming/where";
import { WindowEnumerator } from "../enumerators/streaming/window";
import { ZipEnumerator } from "../enumerators/streaming/zip";
import { BacksertEnumerator } from "../enumerators/buffer/backsert";
import { DistinctEnumerator } from "../enumerators/streaming/distinct";
import { DistinctByEnumerator } from "../enumerators/streaming/distinctBy";
import { ExceptEnumerator } from "../enumerators/buffer/except";
import { ExceptByEnumerator } from "../enumerators/buffer/exceptBy";
import { GroupByEnumerator } from "../enumerators/buffer/groupBy";
import { GroupJoinEnumerator } from "../enumerators/buffer/groupJoin";
import { IntersectEnumerator } from "../enumerators/buffer/intersect";
import { IntersectByEnumerator } from "../enumerators/buffer/intersectBy";
import { JoinEnumerator } from "../enumerators/buffer/join";
import { ReverseEnumerator } from "../enumerators/buffer/reverse";
import { ShuffleEnumerator } from "../enumerators/buffer/shuffle";
import { UnionEnumerator } from "../enumerators/streaming/union";
import { UnionByEnumerator } from "../enumerators/streaming/unionBy";
import { PermutationsEnumerator } from "../enumerators/buffer/permutations";

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
@sequence
export abstract class TyneqEnumerableBase<TSource> extends TyneqEnumerableCore<TSource> implements TyneqSequence<TSource> {
    @builtin({ kind: "terminal" })
    public aggregate<UAccumulate, VResult>(
        seed: UAccumulate,
        func: (accumulate: UAccumulate, item: TSource) => UAccumulate,
        resultSelector: (accumulate: UAccumulate) => VResult
    ): VResult {
        return new AggregateOperator<TSource, UAccumulate, VResult>(this, seed, func, resultSelector).process();
    }

    @builtin({ kind: "terminal" })
    public all(predicate: ItemPredicate<TSource>): boolean {
        return new AllOperator(this, predicate).process();
    }

    @builtin({ kind: "terminal" })
    public any(predicate: ItemPredicate<TSource>): boolean {
        return new AnyOperator(this, predicate).process();
    }

    @builtin({ kind: "terminal" })
    public average(selector: (item: TSource) => number): number {
        return new AverageOperator(this, selector).process();
    }

    @builtin({ kind: "terminal" })

    public consume(): void {
        new ConsumeOperator(this).process();
    }

    @builtin({ kind: "terminal" })
    public contains(value: TSource, equalityComparer?: EqualityComparer<TSource>): boolean {
        return new ContainsOperator(this, value, equalityComparer).process();
    }

    @builtin({ kind: "terminal" })
    public count(): number {
        return new CountOperator(this).process();
    }

    @builtin({ kind: "terminal" })
    public countBy(predicate: ItemPredicate<TSource>): number {
        return new CountByOperator(this, predicate).process();
    }

    @builtin({ kind: "terminal" })
    public elementAt(index: number): TSource {
        ArgumentUtility.checkSafeInteger({ index });
        ArgumentUtility.checkNonNegative({ index });
        return new ElementAtOperator(this, index).process();
    }

    @builtin({ kind: "terminal" })
    public elementAtOrDefault(index: number, defaultValue: TSource): TSource {
        ArgumentUtility.checkSafeInteger({ index });
        ArgumentUtility.checkNonNegative({ index });
        return new ElementAtOrDefaultOperator(this, index, defaultValue).process();
    }

    @builtin({ kind: "terminal" })
    public first(predicate: ItemPredicate<TSource>): TSource {
        return new FirstOperator(this, predicate).process();
    }

    @builtin({ kind: "terminal" })
    public firstOrDefault(predicate: ItemPredicate<TSource>, defaultValue: TSource): TSource {
        return new FirstOrDefaultOperator(this, predicate, defaultValue).process();
    }

    @builtin({ kind: "terminal" })
    public indexOf(predicate: ItemPredicate<TSource>, startIndex: number = 0): number {
        return new IndexOfOperator(this, predicate, startIndex).process();
    }

    @builtin({ kind: "terminal" })
    public isNullOrEmpty(): boolean {
        return new IsNullOrEmptyOperator(this).process();
    }

    @builtin({ kind: "terminal" })
    public last(predicate: ItemPredicate<TSource>): TSource {
        return new LastOperator(this, predicate).process();
    }

    @builtin({ kind: "terminal" })
    public lastOrDefault(predicate: ItemPredicate<TSource>, defaultValue: TSource): TSource {
        return new LastOrDefaultOperator(this, predicate, defaultValue).process();
    }

    @builtin({ kind: "terminal" })
    public max(comparer?: Comparer<TSource>): TSource {
        return new ExtremumOperator(this, 1, "max", comparer).process();
    }

    @builtin({ kind: "terminal" })
    public maxBy<TKey>(
        keySelector: (element: TSource) => TKey,
        comparer?: Comparer<TKey>
    ): TSource {
        return new ExtremumByOperator<TSource, TKey>(this, keySelector, 1, "maxBy", comparer).process();
    }

    @builtin({ kind: "terminal" })
    public min(comparer?: Comparer<TSource>): TSource {
        return new ExtremumOperator(this, -1, "min", comparer).process();
    }

    @builtin({ kind: "terminal" })
    public minBy<TKey>(
        keySelector: (element: TSource) => TKey,
        comparer?: Comparer<TKey>
    ): TSource {
        return new ExtremumByOperator<TSource, TKey>(this, keySelector, -1, "minBy", comparer).process();
    }

    @builtin({ kind: "terminal" })
    public minMax(comparer?: Comparer<TSource>): MinMaxResult<TSource> {
        return new MinMaxOperator(this, comparer).process();
    }

    @builtin({ kind: "terminal" })
    public sequenceEqual(
        other: Iterable<TSource>,
        equalityComparer?: EqualityComparer<TSource>
    ): boolean {
        return new SequenceEqualOperator(this, other, equalityComparer).process();
    }

    @builtin({ kind: "terminal" })
    public single(predicate: ItemPredicate<TSource>): TSource {
        return new SingleOperator(this, predicate).process();
    }

    @builtin({ kind: "terminal" })
    public singleOrDefault(predicate: ItemPredicate<TSource>, defaultValue: TSource): TSource {
        return new SingleOrDefaultOperator(this, predicate, defaultValue).process();
    }

    @builtin({ kind: "terminal" })
    public endsWith(sequence: Iterable<TSource>, equalityComparer?: EqualityComparer<TSource>): boolean {
        return new EndsWithOperator(this, sequence, equalityComparer).process();
    }

    @builtin({ kind: "terminal" })
    public startsWith(sequence: Iterable<TSource>, equalityComparer?: EqualityComparer<TSource>): boolean {
        return new StartsWithOperator(this, sequence, equalityComparer).process();
    }

    @builtin({ kind: "terminal" })
    public sum(selector: (item: TSource) => number): number {
        return new SumOperator(this, selector).process();
    }

    @builtin({ kind: "terminal" })
    public toArray(): TSource[] {
        return new ToArrayOperator(this).process();
    }

    @builtin({ kind: "terminal" })
    public toAsync(): AsyncIterable<TSource> {
        return new ToAsyncOperator(this).process();
    }

    @builtin({ kind: "terminal" })
    public toMap<TKey, TValue>(
        selector: (item: TSource) => KeyValuePair<TKey, TValue>
    ): Map<TKey, TValue> {
        return new ToMapOperator<TSource, TKey, TValue>(this, selector).process();
    }

    @builtin({ kind: "terminal" })
    public toRecord<TKey extends string | number | symbol, TValue>(
        selector: (item: TSource) => KeyValuePair<TKey, TValue>
    ): Record<TKey, TValue> {
        return new ToRecordOperator<TSource, TKey, TValue>(this, selector).process();
    }

    @builtin({ kind: "terminal" })
    public toSet(): Set<TSource> {
        return new ToSetOperator(this).process();
    }

    @builtin({ kind: "streaming" })
    public ofType<U extends TSource>(guard: (value: TSource) => value is U): TyneqSequence<U> {
        ArgumentUtility.checkNotOptional({ guard });
        return this.createSequence(
            () => new OfTypeEnumerator<TSource, U>(this.getEnumerator(), guard),
            this.createNode("ofType", "streaming", [guard])
        );
    }

    @builtin({ kind: "streaming" })
    public append(item: TSource): TyneqSequence<TSource> {
        return this.createSequence(
            () => new AppendEnumerator<TSource>(this.getEnumerator(), item),
            this.createNode("append", "streaming", [item])
        );
    }

    @builtin({ kind: "streaming" })
    public chunk(size: number): TyneqSequence<TSource[]> {
        ArgumentUtility.checkSafeInteger({ size });
        ArgumentUtility.checkPositive({ size });
        return this.createSequence(
            () => new ChunkEnumerator<TSource>(this.getEnumerator(), size),
            this.createNode("chunk", "streaming", [size])
        );
    }

    @builtin({ kind: "streaming" })
    public concat(other: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ other });
        ArgumentUtility.checkIterable({ other });
        const guardedOther = EnumeratorUtility.guardReiterable(other, "other");
        return this.createSequence(
            () => new ConcatEnumerator<TSource>(this.getEnumerator(), guardedOther),
            this.createNode("concat", "streaming", [other])
        );
    }

    @builtin({ kind: "streaming" })
    public defaultIfEmpty(defaultValue: TSource): TyneqSequence<TSource> {
        return this.createSequence(
            () => new DefaultIfEmptyEnumerator<TSource>(this.getEnumerator(), defaultValue),
            this.createNode("defaultIfEmpty", "streaming", [defaultValue])
        );
    }

    @builtin({ kind: "streaming" })
    public flatten<TInner>(): TyneqSequence<TInner> {
        const self = this as unknown as TyneqEnumerableBase<Iterable<TInner>>;
        return self.createSequence(
            () => new FlattenEnumerator<TInner>(self.getEnumerator()),
            self.createNode("flatten", "streaming")
        );
    }

    @builtin({ kind: "streaming" })
    public pairwise(): TyneqSequence<[TSource, TSource]> {
        return this.createSequence(
            () => new PairwiseEnumerator<TSource>(this.getEnumerator()),
            this.createNode("pairwise", "streaming")
        );
    }

    @builtin({ kind: "streaming" })
    public populate<TValue>(value: TValue): TyneqSequence<TValue> {
        return this.createSequence(
            () => new PopulateEnumerator<TSource, TValue>(this.getEnumerator(), value),
            this.createNode("populate", "streaming", [value])
        );
    }

    @builtin({ kind: "streaming" })
    public prepend(item: TSource): TyneqSequence<TSource> {
        return this.createSequence(
            () => new PrependEnumerator<TSource>(this.getEnumerator(), item),
            this.createNode("prepend", "streaming", [item])
        );
    }

    @builtin({ kind: "streaming" })
    public scan<TResult>(
        seed: TResult,
        accumulator: (acc: TResult, item: TSource) => TResult
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ accumulator });
        ArgumentUtility.checkFunction({ accumulator });
        return this.createSequence(
            () => new ScanEnumerator<TSource, TResult>(this.getEnumerator(), seed, accumulator),
            this.createNode("scan", "streaming", [seed, accumulator])
        );
    }

    @builtin({ kind: "streaming" })
    public select<TResult>(
        selector: ItemSelector<TSource, TResult>
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ selector });
        return this.createSequence(
            () => new SelectEnumerator<TSource, TResult>(this.getEnumerator(), selector),
            this.createNode("select", "streaming", [selector])
        );
    }

    @builtin({ kind: "streaming" })
    public selectMany<TResult>(
        selector: (item: TSource) => Iterable<TResult>
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ selector });
        return this.createSequence(
            () => new SelectManyEnumerator<TSource, TResult>(this.getEnumerator(), selector),
            this.createNode("selectMany", "streaming", [selector])
        );
    }

    @builtin({ kind: "streaming" })
    public window(size: number, step: number = 1): TyneqSequence<TSource[]> {
        ArgumentUtility.checkSafeInteger({ size });
        ArgumentUtility.checkPositive({ size });
        ArgumentUtility.checkSafeInteger({ step });
        ArgumentUtility.checkPositive({ step });
        return this.createSequence(
            () => new WindowEnumerator<TSource>(this.getEnumerator(), size, step),
            this.createNode("window", "streaming", [size, step])
        );
    }

    @builtin({ kind: "streaming" })
    public repeat(count: number): TyneqSequence<TSource> {
        ArgumentUtility.checkNonNegative({ count });
        ArgumentUtility.checkSafeInteger({ count });
        return this.createSequence(
            () => new RepeatSequenceEnumerator<TSource>(this.getEnumerator(), this, count),
            this.createNode("repeat", "streaming", [count])
        );
    }

    @builtin({ kind: "streaming" })
    public skip(count: number): TyneqSequence<TSource> {
        ArgumentUtility.checkSafeInteger({ count });
        ArgumentUtility.checkNonNegative({ count });
        return this.createSequence(
            () => new SkipEnumerator<TSource>(this.getEnumerator(), count),
            this.createNode("skip", "streaming", [count])
        );
    }

    @builtin({ kind: "streaming" })
    public skipLast(count: number): TyneqSequence<TSource> {
        ArgumentUtility.checkSafeInteger({ count });
        ArgumentUtility.checkNonNegative({ count });
        return this.createSequence(
            () => new SkipLastEnumerator<TSource>(this.getEnumerator(), count),
            this.createNode("skipLast", "streaming", [count])
        );
    }

    @builtin({ kind: "streaming" })
    public skipUntil(predicate: ItemPredicate<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ predicate });
        return this.createSequence(
            () => new SkipUntilEnumerator<TSource>(this.getEnumerator(), predicate),
            this.createNode("skipUntil", "streaming", [predicate])
        );
    }

    @builtin({ kind: "streaming" })
    public skipWhile(predicate: ItemPredicate<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ predicate });
        return this.createSequence(
            () => new SkipWhileEnumerator<TSource>(this.getEnumerator(), predicate),
            this.createNode("skipWhile", "streaming", [predicate])
        );
    }

    @builtin({ kind: "streaming" })
    public slice(start: number, end?: number): TyneqSequence<TSource> {
        ArgumentUtility.checkNonNegative({ start });
        ArgumentUtility.checkSafeInteger({ start });
        if (end !== undefined) {
            ArgumentUtility.checkNonNegative({ end });
            ArgumentUtility.checkSafeInteger({ end });
            if (end < start) {
                throw new ArgumentOutOfRangeError("end", "`end` must be greater than or equal to `start`.");
            }
        }

        const resolvedEnd = end ?? Number.MAX_SAFE_INTEGER;
        return this.createSequence(
            () => new SliceEnumerator<TSource>(this.getEnumerator(), start, resolvedEnd),
            this.createNode("slice", "streaming", [start, end])
        );
    }

    @builtin({ kind: "streaming" })
    public split(splitOn: (item: TSource) => boolean): TyneqSequence<TSource[]> {
        ArgumentUtility.checkNotOptional({ splitOn });
        return this.createSequence(
            () => new SplitEnumerator<TSource>(this.getEnumerator(), splitOn),
            this.createNode("split", "streaming", [splitOn])
        );
    }

    @builtin({ kind: "streaming" })
    public take(count: number): TyneqSequence<TSource> {
        ArgumentUtility.checkSafeInteger({ count });
        ArgumentUtility.checkNonNegative({ count });
        return this.createSequence(
            () => new TakeEnumerator<TSource>(this.getEnumerator(), count),
            this.createNode("take", "streaming", [count])
        );
    }

    @builtin({ kind: "streaming" })
    public takeUntil(predicate: ItemPredicate<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ predicate });
        return this.createSequence(
            () => new TakeUntilEnumerator<TSource>(this.getEnumerator(), predicate),
            this.createNode("takeUntil", "streaming", [predicate])
        );
    }

    @builtin({ kind: "streaming" })
    public takeWhile(predicate: ItemPredicate<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ predicate });
        return this.createSequence(
            () => new TakeWhileEnumerator<TSource>(this.getEnumerator(), predicate),
            this.createNode("takeWhile", "streaming", [predicate])
        );
    }

    @builtin({ kind: "streaming" })
    public tap(action: ItemAction<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ action });
        return this.createSequence(
            () => new TapEnumerator<TSource>(this.getEnumerator(), action),
            this.createNode("tap", "streaming", [action])
        );
    }

    @builtin({ kind: "streaming" })
    public tapIf(action: ItemAction<TSource>, predicate: () => boolean): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ action });
        ArgumentUtility.checkNotOptional({ predicate });
        return this.createSequence(
            () => new TapIfEnumerator<TSource>(this.getEnumerator(), action, predicate),
            this.createNode("tapIf", "streaming", [action, predicate])
        );
    }

    @builtin({ kind: "streaming" })
    public throttle(count: number): TyneqSequence<TSource> {
        ArgumentUtility.checkSafeInteger({ count });
        ArgumentUtility.checkPositive({ count });
        return this.createSequence(
            () => new ThrottleEnumerator<TSource>(this.getEnumerator(), count),
            this.createNode("throttle", "streaming", [count])
        );
    }

    @builtin({ kind: "streaming" })
    public where(predicate: ItemPredicate<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ predicate });
        return this.createSequence(
            () => new WhereEnumerator<TSource>(this.getEnumerator(), predicate),
            this.createNode("where", "streaming", [predicate])
        );
    }

    @builtin({ kind: "streaming" })
    public zip<TOther, TResult>(
        other: Iterable<TOther>,
        selector: (first: TSource, second: TOther) => TResult
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ other });
        ArgumentUtility.checkIterable({ other });
        ArgumentUtility.checkNotOptional({ selector });
        const guardedOther = EnumeratorUtility.guardReiterable(other, "other");
        return this.createSequence(
            () => new ZipEnumerator<TSource, TOther, TResult>(this.getEnumerator(), guardedOther, selector),
            this.createNode("zip", "streaming", [other, selector])
        );
    }

    @builtin({ kind: "buffer" })
    public backsert(index: number, other: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ other });
        ArgumentUtility.checkSafeInteger({ index });
        ArgumentUtility.checkNonNegative({ index });
        ArgumentUtility.checkIterable({ other });
        const guardedOther = EnumeratorUtility.guardReiterable(other, "other");
        return this.createSequence(
            () => new BacksertEnumerator<TSource>(this.getEnumerator(), index, guardedOther),
            this.createNode("backsert", "buffer", [index, other])
        );
    }

    @builtin({ kind: "streaming" })
    public distinct(): TyneqSequence<TSource> {
        return this.createSequence(
            () => new DistinctEnumerator<TSource>(this.getEnumerator()),
            this.createNode("distinct", "streaming")
        );
    }

    @builtin({ kind: "streaming" })
    public distinctBy<TKey>(keySelector: (item: TSource) => TKey): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ keySelector });
        return this.createSequence(
            () => new DistinctByEnumerator<TSource, TKey>(this.getEnumerator(), keySelector),
            this.createNode("distinctBy", "streaming", [keySelector])
        );
    }

    @builtin({ kind: "buffer" })
    public except(excludedValues: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ excludedValues });
        ArgumentUtility.checkIterable({ excludedValues });
        const guardedExcludedValues = EnumeratorUtility.guardReiterable(excludedValues, "excludedValues");
        return this.createSequence(
            () => new ExceptEnumerator<TSource>(this.getEnumerator(), guardedExcludedValues),
            this.createNode("except", "buffer", [excludedValues])
        );
    }

    @builtin({ kind: "buffer" })
    public exceptBy<TKey>(
        excludedKeys: Iterable<TKey>,
        keySelector: (item: TSource) => TKey
    ): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ excludedKeys });
        ArgumentUtility.checkIterable({ excludedKeys });
        ArgumentUtility.checkNotOptional({ keySelector });
        const guardedExcludedKeys = EnumeratorUtility.guardReiterable(excludedKeys, "excludedKeys");
        return this.createSequence(
            () => new ExceptByEnumerator<TSource, TKey>(this.getEnumerator(), guardedExcludedKeys, keySelector),
            this.createNode("exceptBy", "buffer", [excludedKeys, keySelector])
        );
    }

    @builtin({ kind: "buffer" })
    public groupBy<TKey, TValue, TResult>(
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: TyneqSequence<TValue>) => TResult
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ keySelector });
        ArgumentUtility.checkNotOptional({ valueSelector });
        ArgumentUtility.checkNotOptional({ resultSelector });
        const groupFactory = (values: TValue[]): TyneqSequence<TValue> =>
            this.createEnumerable({ getEnumerator: () => values[Symbol.iterator]() as Enumerator<TValue> }, null);
        return this.createSequence(
            () => new GroupByEnumerator<TSource, TKey, TValue, TResult>(
                this.getEnumerator(), keySelector, valueSelector, resultSelector, groupFactory
            ),
            this.createNode("groupBy", "buffer", [keySelector, valueSelector, resultSelector])
        );
    }

    @builtin({ kind: "buffer" })
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
        const guardedInner = EnumeratorUtility.guardReiterable(inner, "inner");
        const groupFactory = (values: TInner[]): TyneqSequence<TInner> =>
            this.createEnumerable({ getEnumerator: () => values[Symbol.iterator]() as Enumerator<TInner> }, null);
        return this.createSequence(
            () => new GroupJoinEnumerator<TSource, TInner, TKey, TResult>(
                this.getEnumerator(), guardedInner, outerKeySelector, innerKeySelector, resultSelector, groupFactory
            ),
            this.createNode("groupJoin", "buffer", [inner, outerKeySelector, innerKeySelector, resultSelector])
        );
    }

    @builtin({ kind: "buffer" })
    public intersect(intersectedValues: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ intersectedValues });
        ArgumentUtility.checkIterable({ intersectedValues });
        const guardedIntersectedValues = EnumeratorUtility.guardReiterable(intersectedValues, "intersectedValues");
        return this.createSequence(
            () => new IntersectEnumerator<TSource>(this.getEnumerator(), guardedIntersectedValues),
            this.createNode("intersect", "buffer", [intersectedValues])
        );
    }

    @builtin({ kind: "buffer" })
    public intersectBy<TKey>(
        intersectedKeys: Iterable<TKey>,
        keySelector: (item: TSource) => TKey
    ): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ intersectedKeys });
        ArgumentUtility.checkIterable({ intersectedKeys });
        ArgumentUtility.checkNotOptional({ keySelector });
        const guardedIntersectedKeys = EnumeratorUtility.guardReiterable(intersectedKeys, "intersectedKeys");
        return this.createSequence(
            () => new IntersectByEnumerator<TSource, TKey>(this.getEnumerator(), guardedIntersectedKeys, keySelector),
            this.createNode("intersectBy", "buffer", [intersectedKeys, keySelector])
        );
    }

    @builtin({ kind: "buffer" })
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
        const guardedInner = EnumeratorUtility.guardReiterable(inner, "inner");
        return this.createSequence(
            () => new JoinEnumerator<TSource, TInner, TKey, TResult>(
                this.getEnumerator(), guardedInner, outerKeySelector, innerKeySelector, resultSelector
            ),
            this.createNode("join", "buffer", [inner, outerKeySelector, innerKeySelector, resultSelector])
        );
    }

    @builtin({ kind: "buffer" })
    public permutations(): TyneqSequence<TSource[]> {
        return this.createSequence(
            () => new PermutationsEnumerator<TSource>(this.getEnumerator()),
            this.createNode("permutations", "buffer")
        );
    }

    @builtin({ kind: "buffer" })
    public reverse(): TyneqSequence<TSource> {
        return this.createSequence(
            () => new ReverseEnumerator<TSource>(this.getEnumerator()),
            this.createNode("reverse", "buffer")
        );
    }

    @builtin({ kind: "buffer" })
    public shuffle(): TyneqSequence<TSource> {
        return this.createSequence(
            () => new ShuffleEnumerator<TSource>(this.getEnumerator()),
            this.createNode("shuffle", "buffer")
        );
    }

    @builtin({ kind: "streaming" })
    public union(otherValues: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ otherValues });
        ArgumentUtility.checkIterable({ otherValues });
        const guardedOtherValues = EnumeratorUtility.guardReiterable(otherValues, "otherValues");
        return this.createSequence(
            () => new UnionEnumerator<TSource>(this.getEnumerator(), guardedOtherValues),
            this.createNode("union", "streaming", [otherValues])
        );
    }

    @builtin({ kind: "streaming" })
    public unionBy<TKey>(
        otherValues: Iterable<TSource>,
        keySelector: (item: TSource) => TKey
    ): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ otherValues });
        ArgumentUtility.checkIterable({ otherValues });
        ArgumentUtility.checkNotOptional({ keySelector });
        const guardedOtherValues = EnumeratorUtility.guardReiterable(otherValues, "otherValues");
        return this.createSequence(
            () => new UnionByEnumerator<TSource, TKey>(this.getEnumerator(), guardedOtherValues, keySelector),
            this.createNode("unionBy", "streaming", [otherValues, keySelector])
        );
    }
}
