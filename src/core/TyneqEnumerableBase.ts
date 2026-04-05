import { Enumerator, TyneqSequence, KeyValuePair, MinMaxResult, Comparer, EqualityComparer } from "../types/core";
import { ArgumentUtility } from "../utility/ArgumentUtility";
import { tyneqQueryNode } from "../types/queryplan";
import { QueryNode } from "../queryplan/QueryNode";
import { TyneqEnumerableCore } from "./TyneqEnumerableCore";
import { sequence } from "../plugin/decorators/sequence";
import { builtin } from "../plugin/decorators/builtin";

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
    // --- Terminal operators ---

    @builtin({ kind: "terminal" })
    public aggregate<UAccumulate, VResult>(
        seed: UAccumulate,
        func: (accumulate: UAccumulate, item: TSource) => UAccumulate,
        resultSelector: (accumulate: UAccumulate) => VResult
    ): VResult {
        return new AggregateOperator<TSource, UAccumulate, VResult>(this, seed, func, resultSelector).process();
    }

    @builtin({ kind: "terminal" })
    public all(predicate: (item: TSource) => boolean): boolean {
        return new AllOperator(this, predicate).process();
    }

    @builtin({ kind: "terminal" })
    public any(predicate: (item: TSource) => boolean): boolean {
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
    public contains(value: TSource): boolean {
        return new ContainsOperator(this, value).process();
    }

    @builtin({ kind: "terminal" })
    public count(): number {
        return new CountOperator(this).process();
    }

    @builtin({ kind: "terminal" })
    public countBy(predicate: (item: TSource) => boolean): number {
        return new CountByOperator(this, predicate).process();
    }

    @builtin({ kind: "terminal" })
    public elementAt(index: number): TSource {
        ArgumentUtility.checkNonNegative({ index });
        return new ElementAtOperator(this, index).process();
    }

    @builtin({ kind: "terminal" })
    public elementAtOrDefault(index: number, defaultValue: TSource): TSource {
        return new ElementAtOrDefaultOperator(this, index, defaultValue).process();
    }

    @builtin({ kind: "terminal" })
    public first(predicate: (item: TSource) => boolean): TSource {
        return new FirstOperator(this, predicate).process();
    }

    @builtin({ kind: "terminal" })
    public firstOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        return new FirstOrDefaultOperator(this, predicate, defaultValue).process();
    }

    @builtin({ kind: "terminal" })
    public indexOf(predicate: (item: TSource) => boolean, startIndex: number = 0): number {
        return new IndexOfOperator(this, predicate, startIndex).process();
    }

    @builtin({ kind: "terminal" })
    public isNullOrEmpty(): boolean {
        return new IsNullOrEmptyOperator(this).process();
    }

    @builtin({ kind: "terminal" })
    public last(predicate: (item: TSource) => boolean): TSource {
        return new LastOperator(this, predicate).process();
    }

    @builtin({ kind: "terminal" })
    public lastOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        return new LastOrDefaultOperator(this, predicate, defaultValue).process();
    }

    @builtin({ kind: "terminal" })
    public max(comparer?: Comparer<TSource>): TSource {
        return new MaxOperator(this, comparer).process();
    }

    @builtin({ kind: "terminal" })
    public maxBy<TKey>(
        keySelector: (element: TSource) => TKey,
        comparer?: Comparer<TKey>
    ): TSource {
        return new MaxByOperator<TSource, TKey>(this, keySelector, comparer).process();
    }

    @builtin({ kind: "terminal" })
    public min(comparer?: Comparer<TSource>): TSource {
        return new MinOperator(this, comparer).process();
    }

    @builtin({ kind: "terminal" })
    public minBy<TKey>(
        keySelector: (element: TSource) => TKey,
        comparer?: Comparer<TKey>
    ): TSource {
        return new MinByOperator<TSource, TKey>(this, keySelector, comparer).process();
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
    public single(predicate: (item: TSource) => boolean): TSource {
        return new SingleOperator(this, predicate).process();
    }

    @builtin({ kind: "terminal" })
    public singleOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        return new SingleOrDefaultOperator(this, predicate, defaultValue).process();
    }

    @builtin({ kind: "terminal" })
    public startsWith(sequence: Iterable<TSource>): boolean {
        return new StartsWithOperator(this, sequence).process();
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

    // --- Streaming operators ---

    @builtin({ kind: "streaming" })
    public cast<U>(): TyneqSequence<U> {
        const node = new QueryNode("cast", [], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new CastEnumerator<TSource, U>(this.getEnumerator()) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public ofType<U extends TSource>(guard: (value: TSource) => value is U): TyneqSequence<U> {
        ArgumentUtility.checkNotOptional({ guard });
        const node = new QueryNode("ofType", [guard], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new OfTypeEnumerator<TSource, U>(this.getEnumerator(), guard) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public append(item: TSource): TyneqSequence<TSource> {
        const node = new QueryNode("append", [item], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new AppendEnumerator<TSource>(this.getEnumerator(), item) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public chunk(size: number): TyneqSequence<TSource[]> {
        ArgumentUtility.checkSafeInteger({ size });
        ArgumentUtility.checkPositive({ size });
        const node = new QueryNode("chunk", [size], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new ChunkEnumerator<TSource>(this.getEnumerator(), size) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public concat(other: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ other });
        ArgumentUtility.checkIterable({ other });
        const node = new QueryNode("concat", [other], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new ConcatEnumerator<TSource>(this.getEnumerator(), other) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public defaultIfEmpty(defaultValue: TSource): TyneqSequence<TSource> {
        const node = new QueryNode("defaultIfEmpty", [defaultValue], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new DefaultIfEmptyEnumerator<TSource>(this.getEnumerator(), defaultValue) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public pairwise(): TyneqSequence<[TSource, TSource]> {
        const node = new QueryNode("pairwise", [], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new PairwiseEnumerator<TSource>(this.getEnumerator()) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public populate<TValue>(value: TValue): TyneqSequence<TValue> {
        const node = new QueryNode("populate", [value], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new PopulateEnumerator<TSource, TValue>(this.getEnumerator(), value) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public prepend(item: TSource): TyneqSequence<TSource> {
        const node = new QueryNode("prepend", [item], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new PrependEnumerator<TSource>(this.getEnumerator(), item) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public scan<TResult>(
        seed: TResult,
        accumulator: (acc: TResult, item: TSource) => TResult
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ seed });
        ArgumentUtility.checkNotOptional({ accumulator });
        ArgumentUtility.checkFunction({ accumulator });
        const node = new QueryNode("scan", [seed, accumulator], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new ScanEnumerator<TSource, TResult>(this.getEnumerator(), seed, accumulator) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public select<TResult>(
        selector: (item: TSource) => TResult
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ selector });
        const node = new QueryNode("select", [selector], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new SelectEnumerator<TSource, TResult>(this.getEnumerator(), selector) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public selectMany<TResult>(
        selector: (item: TSource) => Iterable<TResult>
    ): TyneqSequence<TResult> {
        ArgumentUtility.checkNotOptional({ selector });
        const node = new QueryNode("selectMany", [selector], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new SelectManyEnumerator<TSource, TResult>(this.getEnumerator(), selector) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public skip(count: number): TyneqSequence<TSource> {
        ArgumentUtility.checkNonNegative({ count });
        const node = new QueryNode("skip", [count], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new SkipEnumerator<TSource>(this.getEnumerator(), count) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public skipLast(count: number): TyneqSequence<TSource> {
        const node = new QueryNode("skipLast", [count], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new SkipLastEnumerator<TSource>(this.getEnumerator(), count) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public skipWhile(predicate: (item: TSource) => boolean): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ predicate });
        const node = new QueryNode("skipWhile", [predicate], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new SkipWhileEnumerator<TSource>(this.getEnumerator(), predicate) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public split(splitOn: (item: TSource) => boolean): TyneqSequence<TSource[]> {
        ArgumentUtility.checkNotOptional({ splitOn });
        const node = new QueryNode("split", [splitOn], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new SplitEnumerator<TSource>(this.getEnumerator(), splitOn) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public take(count: number): TyneqSequence<TSource> {
        const node = new QueryNode("take", [count], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new TakeEnumerator<TSource>(this.getEnumerator(), count) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public takeWhile(predicate: (item: TSource) => boolean): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ predicate });
        const node = new QueryNode("takeWhile", [predicate], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new TakeWhileEnumerator<TSource>(this.getEnumerator(), predicate) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public tap(action: (item: TSource) => void): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ action });
        const node = new QueryNode("tap", [action], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new TapEnumerator<TSource>(this.getEnumerator(), action) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public tapIf(action: (item: TSource) => void, predicate: () => boolean): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ action });
        ArgumentUtility.checkNotOptional({ predicate });
        const node = new QueryNode("tapIf", [action, predicate], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new TapIfEnumerator<TSource>(this.getEnumerator(), action, predicate) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public throttle(count: number): TyneqSequence<TSource> {
        ArgumentUtility.checkSafeInteger({ count });
        ArgumentUtility.checkPositive({ count });
        const node = new QueryNode("throttle", [count], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new ThrottleEnumerator<TSource>(this.getEnumerator(), count) },
            node
        );
    }

    @builtin({ kind: "streaming" })
    public where(predicate: (item: TSource) => boolean): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ predicate });
        const node = new QueryNode("where", [predicate], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new WhereEnumerator<TSource>(this.getEnumerator(), predicate) },
            node
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
        const node = new QueryNode("zip", [other, selector], this[tyneqQueryNode], "streaming");
        return this.createEnumerable(
            { getEnumerator: () => new ZipEnumerator<TSource, TOther, TResult>(this.getEnumerator(), other, selector) },
            node
        );
    }

    // --- Buffer operators ---

    @builtin({ kind: "buffer" })
    public backsert(index: number, other: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ index });
        ArgumentUtility.checkNotOptional({ other });
        ArgumentUtility.checkSafeInteger({ index });
        ArgumentUtility.checkNonNegative({ index });
        ArgumentUtility.checkIterable({ other });
        const node = new QueryNode("backsert", [index, other], this[tyneqQueryNode], "buffer");
        return this.createEnumerable(
            { getEnumerator: () => new BacksertEnumerator<TSource>(this.getEnumerator(), index, other) },
            node
        );
    }

    @builtin({ kind: "buffer" })
    public distinct(): TyneqSequence<TSource> {
        const node = new QueryNode("distinct", [], this[tyneqQueryNode], "buffer");
        return this.createEnumerable(
            { getEnumerator: () => new DistinctEnumerator<TSource>(this.getEnumerator()) },
            node
        );
    }

    @builtin({ kind: "buffer" })
    public distinctBy<TKey>(keySelector: (item: TSource) => TKey): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ keySelector });
        const node = new QueryNode("distinctBy", [keySelector], this[tyneqQueryNode], "buffer");
        return this.createEnumerable(
            { getEnumerator: () => new DistinctByEnumerator<TSource, TKey>(this.getEnumerator(), keySelector) },
            node
        );
    }

    @builtin({ kind: "buffer" })
    public except(excludedValues: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ excludedValues });
        ArgumentUtility.checkIterable({ excludedValues });
        const node = new QueryNode("except", [excludedValues], this[tyneqQueryNode], "buffer");
        return this.createEnumerable(
            { getEnumerator: () => new ExceptEnumerator<TSource>(this.getEnumerator(), excludedValues) },
            node
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
        const node = new QueryNode("exceptBy", [excludedKeys, keySelector], this[tyneqQueryNode], "buffer");
        return this.createEnumerable(
            { getEnumerator: () => new ExceptByEnumerator<TSource, TKey>(this.getEnumerator(), excludedKeys, keySelector) },
            node
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
        const node = new QueryNode("groupBy", [keySelector, valueSelector, resultSelector], this[tyneqQueryNode], "buffer");
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
        const node = new QueryNode("groupJoin", [inner, outerKeySelector, innerKeySelector, resultSelector], this[tyneqQueryNode], "buffer");
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

    @builtin({ kind: "buffer" })
    public intersect(intersectedValues: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ intersectedValues });
        ArgumentUtility.checkIterable({ intersectedValues });
        const node = new QueryNode("intersect", [intersectedValues], this[tyneqQueryNode], "buffer");
        return this.createEnumerable(
            { getEnumerator: () => new IntersectEnumerator<TSource>(this.getEnumerator(), intersectedValues) },
            node
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
        const node = new QueryNode("intersectBy", [intersectedKeys, keySelector], this[tyneqQueryNode], "buffer");
        return this.createEnumerable(
            { getEnumerator: () => new IntersectByEnumerator<TSource, TKey>(this.getEnumerator(), intersectedKeys, keySelector) },
            node
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
        const node = new QueryNode("join", [inner, outerKeySelector, innerKeySelector, resultSelector], this[tyneqQueryNode], "buffer");
        return this.createEnumerable(
            {
                getEnumerator: () => new JoinEnumerator<TSource, TInner, TKey, TResult>(
                    this.getEnumerator(), inner, outerKeySelector, innerKeySelector, resultSelector
                ),
            },
            node
        );
    }

    @builtin({ kind: "buffer" })
    public reverse(): TyneqSequence<TSource> {
        const node = new QueryNode("reverse", [], this[tyneqQueryNode], "buffer");
        return this.createEnumerable(
            { getEnumerator: () => new ReverseEnumerator<TSource>(this.getEnumerator()) },
            node
        );
    }

    @builtin({ kind: "buffer" })
    public shuffle(): TyneqSequence<TSource> {
        const node = new QueryNode("shuffle", [], this[tyneqQueryNode], "buffer");
        return this.createEnumerable(
            { getEnumerator: () => new ShuffleEnumerator<TSource>(this.getEnumerator()) },
            node
        );
    }

    @builtin({ kind: "buffer" })
    public union(otherValues: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ otherValues });
        ArgumentUtility.checkIterable({ otherValues });
        const node = new QueryNode("union", [otherValues], this[tyneqQueryNode], "buffer");
        return this.createEnumerable(
            { getEnumerator: () => new UnionEnumerator<TSource>(this.getEnumerator(), otherValues) },
            node
        );
    }

    @builtin({ kind: "buffer" })
    public unionBy<TKey>(
        otherValues: Iterable<TSource>,
        keySelector: (item: TSource) => TKey
    ): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ otherValues });
        ArgumentUtility.checkIterable({ otherValues });
        ArgumentUtility.checkNotOptional({ keySelector });
        const node = new QueryNode("unionBy", [otherValues, keySelector], this[tyneqQueryNode], "buffer");
        return this.createEnumerable(
            { getEnumerator: () => new UnionByEnumerator<TSource, TKey>(this.getEnumerator(), otherValues, keySelector) },
            node
        );
    }
}
