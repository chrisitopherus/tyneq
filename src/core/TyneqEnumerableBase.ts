import { IEnumerator, IEnumeratorFactory, ITyneqCachedEnumerable, ITyneqEnumerable, ITyneqOrderedEnumerable, KeyValuePair, MinMaxResult } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { tyneqQueryNode } from "../types/queryplan";
import type { IQueryNode } from "../types/queryplan";
import { QueryNode } from "../queryplan/QueryNode";
import { getOperatorMetadata, IOperatorMetadataCarrier } from "../queryplan/operatorMetadata";
import { TyneqEnumerableCore } from "./TyneqEnumerableCore";
import { Nullable } from "../types/utility";
import { EnumeratorUtility } from "../utility/EnumeratorUtility";
import { TyneqComparer } from "./TyneqComparer";
import { InvalidOperationError } from "./errors/InvalidOperationError";
import { ArgumentOutOfRangeError } from "./errors/argument/ArgumentOutOfRangeError";
import { SequenceContainsNoElementsError } from "./errors/SequenceContainsNoElementsError";
// ── Streaming enumerators ─────────────────────────────────────────────────────
import { AppendEnumerator } from "../operators/streaming/append";
import { CastEnumerator } from "../operators/streaming/cast";
import { ChunkEnumerator } from "../operators/streaming/chunk";
import { ConcatEnumerator } from "../operators/streaming/concat";
import { DefaultIfEmptyEnumerator } from "../operators/streaming/defaultIfEmpty";
import { OfTypeEnumerator } from "../operators/streaming/ofType";
import { PairwiseEnumerator } from "../operators/streaming/pairwise";
import { PopulateEnumerator } from "../operators/streaming/populate";
import { PrependEnumerator } from "../operators/streaming/prepend";
import { ScanEnumerator } from "../operators/streaming/scan";
import { SelectEnumerator } from "../operators/streaming/select";
import { SelectManyEnumerator } from "../operators/streaming/selectMany";
import { SkipEnumerator } from "../operators/streaming/skip";
import { SkipLastEnumerator } from "../operators/streaming/skipLast";
import { SkipWhileEnumerator } from "../operators/streaming/skipWhile";
import { SplitEnumerator } from "../operators/streaming/split";
import { TakeEnumerator } from "../operators/streaming/take";
import { TakeWhileEnumerator } from "../operators/streaming/takeWhile";
import { TapEnumerator } from "../operators/streaming/tap";
import { TapIfEnumerator } from "../operators/streaming/tapIf";
import { ThrottleEnumerator } from "../operators/streaming/throttle";
import { WhereEnumerator } from "../operators/streaming/where";
import { ZipEnumerator } from "../operators/streaming/zip";
// ── Buffer enumerators ────────────────────────────────────────────────────────
import { BacksertEnumerator } from "../operators/buffer/backsert";
import { DistinctEnumerator } from "../operators/buffer/distinct";
import { DistinctByEnumerator } from "../operators/buffer/distinctBy";
import { ExceptEnumerator } from "../operators/buffer/except";
import { ExceptByEnumerator } from "../operators/buffer/exceptBy";
import { GroupByEnumerator } from "../operators/buffer/groupBy";
import { GroupJoinEnumerator } from "../operators/buffer/groupJoin";
import { IntersectEnumerator } from "../operators/buffer/intersect";
import { IntersectByEnumerator } from "../operators/buffer/intersectBy";
import { JoinEnumerator } from "../operators/buffer/join";
import { ReverseEnumerator } from "../operators/buffer/reverse";
import { ShuffleEnumerator } from "../operators/buffer/shuffle";
import { UnionEnumerator } from "../operators/buffer/union";
import { UnionByEnumerator } from "../operators/buffer/unionBy";

/**
 * Abstract base class providing the complete LINQ-style operator surface for enumerable sequences.
 *
 * @remarks
 * Extends {@link TyneqEnumerableCore} (which owns `orderBy`, `orderByDescending`, `memoize`,
 * and `pipe`) and implements all remaining operators directly — terminal (immediate evaluation),
 * streaming (deferred, O(1) memory), and buffering (deferred, O(n) memory).
 *
 * Query pipelines are lazy — evaluation begins only when a terminal operator or the
 * `for...of` protocol is invoked. Sequences are re-iterable: each enumeration calls
 * {@link getEnumerator} for a fresh iterator.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link TyneqEnumerable} for the standard concrete implementation.
 * @see {@link TyneqOrderedEnumerable} for ordered sequence support.
 *
 * @group Classes
 * @internal
 */
export abstract class TyneqEnumerableBase<TSource>
    extends TyneqEnumerableCore<TSource>
    implements ITyneqEnumerable<TSource> {

    private createOperatorNode(
        operator: new (...args: any[]) => any,
        args: readonly unknown[]
    ): QueryNode {
        const metadata = getOperatorMetadata(operator as unknown as IOperatorMetadataCarrier);
        return new QueryNode(metadata.name, args, this[tyneqQueryNode], metadata.category);
    }

    // ── Terminal operators ────────────────────────────────────────────────────

    public aggregate<UAccumulate, VResult>(
        seed: UAccumulate,
        func: (accumulate: UAccumulate, item: TSource) => UAccumulate,
        resultSelector: (accumulate: UAccumulate) => VResult
    ): VResult {
        ArgumentUtility.checkNotOptional({ func });
        ArgumentUtility.checkNotOptional({ resultSelector });
        let accumulate = seed;
        for (const item of this) {
            accumulate = func(accumulate, item);
        }
        return resultSelector(accumulate);
    }

    public all(predicate: (item: TSource) => boolean): boolean {
        ArgumentUtility.checkNotOptional({ predicate });
        for (const item of this) {
            if (!predicate(item)) return false;
        }
        return true;
    }

    public any(predicate: (item: TSource) => boolean): boolean {
        ArgumentUtility.checkNotOptional({ predicate });
        for (const item of this) {
            if (predicate(item)) return true;
        }
        return false;
    }

    public average(selector: (item: TSource) => number): number {
        ArgumentUtility.checkNotOptional({ selector });
        let count = 0;
        let sum = 0;
        for (const item of this) {
            sum += selector(item);
            count++;
        }
        return count === 0 ? 0 : sum / count;
    }

    public consume(): void {
        for (const _ of this) { /* intentionally consume all elements */ }
    }

    public contains(value: TSource): boolean {
        for (const item of this) {
            if (item === value) return true;
        }
        return false;
    }

    public count(): number {
        let n = 0;
        for (const _ of this) { n++; }
        return n;
    }

    public countBy(predicate: (item: TSource) => boolean): number {
        ArgumentUtility.checkNotOptional({ predicate });
        let n = 0;
        for (const item of this) {
            if (predicate(item)) n++;
        }
        return n;
    }

    public elementAt(index: number): TSource {
        ArgumentUtility.checkNonNegative({ index });
        let i = 0;
        for (const element of this) {
            if (i === index) return element;
            i++;
        }
        throw new ArgumentOutOfRangeError("index");
    }

    public elementAtOrDefault(index: number, defaultValue: TSource): TSource {
        ArgumentUtility.checkNonNegative({ index });
        let i = 0;
        for (const element of this) {
            if (i === index) return element;
            i++;
        }
        return defaultValue;
    }

    public first(predicate: (item: TSource) => boolean): TSource {
        ArgumentUtility.checkNotOptional({ predicate });
        for (const element of this) {
            if (predicate(element)) return element;
        }
        throw new InvalidOperationError("Sequence contains no matching element");
    }

    public firstOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        ArgumentUtility.checkNotOptional({ predicate });
        for (const element of this) {
            if (predicate(element)) return element;
        }
        return defaultValue;
    }

    public indexOf(predicate: (item: TSource) => boolean, startIndex: number = 0): number {
        ArgumentUtility.checkNotOptional({ predicate });
        ArgumentUtility.checkNonNegative({ startIndex });
        let idx = -1;
        for (const item of this) {
            idx++;
            if (idx < startIndex) continue;
            if (predicate(item)) return idx;
        }
        return -1;
    }

    public isNullOrEmpty(): boolean {
        const iterator = this.getEnumerator();
        const first = iterator.next();
        EnumeratorUtility.tryDispose(iterator);
        return first.done === true;
    }

    public last(predicate: (item: TSource) => boolean): TSource {
        ArgumentUtility.checkNotOptional({ predicate });
        let last: Nullable<TSource> = null;
        let found = false;
        for (const element of this) {
            if (predicate(element)) {
                last = element;
                found = true;
            }
        }
        if (!found) throw new InvalidOperationError("Sequence contains no matching element");
        return last as TSource;
    }

    public lastOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        ArgumentUtility.checkNotOptional({ predicate });
        let last: Nullable<TSource> = null;
        let found = false;
        for (const element of this) {
            if (predicate(element)) {
                last = element;
                found = true;
            }
        }
        return found ? (last as TSource) : defaultValue;
    }

    public max(comparer?: (a: TSource, b: TSource) => number): TSource {
        const cmp = comparer ?? TyneqComparer.defaultComparer;
        let maxElement: Nullable<TSource> = null;
        let hasElement = false;
        for (const element of this) {
            if (!hasElement || cmp(element, maxElement!) > 0) {
                maxElement = element;
                hasElement = true;
            }
        }
        if (!hasElement) throw new SequenceContainsNoElementsError();
        return maxElement as TSource;
    }

    public maxBy<TKey>(
        keySelector: (element: TSource) => TKey,
        comparer?: (a: TKey, b: TKey) => number
    ): TSource {
        ArgumentUtility.checkNotOptional({ keySelector });
        const cmp = comparer ?? TyneqComparer.defaultComparer;
        let maxElement: Nullable<TSource> = null;
        let maxKey: Nullable<TKey> = null;
        let hasElement = false;
        for (const element of this) {
            const key = keySelector(element);
            if (!hasElement || cmp(key, maxKey!) > 0) {
                maxElement = element;
                maxKey = key;
                hasElement = true;
            }
        }
        if (!hasElement) throw new SequenceContainsNoElementsError();
        return maxElement as TSource;
    }

    public min(comparer?: (a: TSource, b: TSource) => number): TSource {
        const cmp = comparer ?? TyneqComparer.defaultComparer;
        let minElement: Nullable<TSource> = null;
        let hasElement = false;
        for (const element of this) {
            if (!hasElement || cmp(element, minElement!) < 0) {
                minElement = element;
                hasElement = true;
            }
        }
        if (!hasElement) throw new SequenceContainsNoElementsError();
        return minElement as TSource;
    }

    public minBy<TKey>(
        keySelector: (element: TSource) => TKey,
        comparer?: (a: TKey, b: TKey) => number
    ): TSource {
        ArgumentUtility.checkNotOptional({ keySelector });
        const cmp = comparer ?? TyneqComparer.defaultComparer;
        let minElement: Nullable<TSource> = null;
        let minKey: Nullable<TKey> = null;
        let hasElement = false;
        for (const element of this) {
            const key = keySelector(element);
            if (!hasElement || cmp(key, minKey!) < 0) {
                minElement = element;
                minKey = key;
                hasElement = true;
            }
        }
        if (!hasElement) throw new SequenceContainsNoElementsError();
        return minElement as TSource;
    }

    public minMax(comparer?: (a: TSource, b: TSource) => number): MinMaxResult<TSource> {
        const cmp = comparer ?? TyneqComparer.defaultComparer;
        let min: TSource | undefined;
        let max: TSource | undefined;
        let hasElements = false;
        for (const item of this) {
            if (!hasElements) {
                min = item;
                max = item;
                hasElements = true;
            } else {
                if (cmp(item, min!) < 0) min = item;
                if (cmp(item, max!) > 0) max = item;
            }
        }
        if (!hasElements) throw new SequenceContainsNoElementsError();
        return { min: min as TSource, max: max as TSource };
    }

    public sequenceEqual(
        other: Iterable<TSource>,
        equalityComparer?: (a: TSource, b: TSource) => boolean
    ): boolean {
        ArgumentUtility.checkNotOptional({ other });
        ArgumentUtility.checkNotNull({ equalityComparer });
        const cmp = equalityComparer ?? TyneqComparer.defaultEqualityComparer;
        const sourceIterator = this.getEnumerator();
        const otherIterator = other[Symbol.iterator]();
        while (true) {
            const sourceNext = sourceIterator.next();
            const otherNext = otherIterator.next();
            if (sourceNext.done && otherNext.done) break;
            if (sourceNext.done !== otherNext.done) return false;
            if (!cmp(sourceNext.value, otherNext.value)) return false;
        }
        return true;
    }

    public single(predicate: (item: TSource) => boolean): TSource {
        ArgumentUtility.checkNotOptional({ predicate });
        let found = false;
        let single: Nullable<TSource> = null;
        for (const element of this) {
            if (predicate(element)) {
                if (found) throw new InvalidOperationError("Sequence contains more than one matching element");
                found = true;
                single = element;
            }
        }
        if (!found) throw new InvalidOperationError("Sequence contains no matching element");
        return single as TSource;
    }

    public singleOrDefault(predicate: (item: TSource) => boolean, defaultValue: TSource): TSource {
        ArgumentUtility.checkNotOptional({ predicate });
        let found = false;
        let single: Nullable<TSource> = null;
        for (const element of this) {
            if (predicate(element)) {
                if (found) throw new InvalidOperationError("Sequence contains more than one matching element");
                found = true;
                single = element;
            }
        }
        return found ? (single as TSource) : defaultValue;
    }

    public startsWith(sequence: Iterable<TSource>): boolean {
        ArgumentUtility.checkNotOptional({ sequence });
        const sourceIterator = this.getEnumerator();
        const sequenceIterator = sequence[Symbol.iterator]();
        while (true) {
            const { value: sourceValue, done: sourceDone } = sourceIterator.next();
            const { value: sequenceValue, done: sequenceDone } = sequenceIterator.next();
            if (sequenceDone) return true;
            if (sourceDone || sourceValue !== sequenceValue) return false;
        }
    }

    public sum(selector: (item: TSource) => number): number {
        ArgumentUtility.checkNotOptional({ selector });
        let total = 0;
        for (const item of this) { total += selector(item); }
        return total;
    }

    public toArray(): TSource[] {
        return Array.from(this);
    }

    public toAsync(): AsyncIterable<TSource> {
        const source = this;
        return {
            async *[Symbol.asyncIterator]() {
                for (const item of source) {
                    yield item;
                }
            },
        };
    }

    public toMap<TKey, TValue>(
        selector: (item: TSource) => KeyValuePair<TKey, TValue>
    ): Map<TKey, TValue> {
        ArgumentUtility.checkNotOptional({ selector });
        return new Map<TKey, TValue>(
            Array.from(this, (item) => {
                const pair = selector(item);
                return [pair.key, pair.value] as [TKey, TValue];
            })
        );
    }

    public toRecord<TKey extends string | number | symbol, TValue>(
        selector: (item: TSource) => KeyValuePair<TKey, TValue>
    ): Record<TKey, TValue> {
        ArgumentUtility.checkNotOptional({ selector });
        const result = {} as Record<TKey, TValue>;
        for (const item of this) {
            const pair = selector(item);
            result[pair.key] = pair.value;
        }
        return result;
    }

    public toSet(): Set<TSource> {
        return new Set(this);
    }

    // ── Streaming operators ───────────────────────────────────────────────────

    public cast<U>(): ITyneqEnumerable<U> {
        const node = this.createOperatorNode(CastEnumerator, []);
        return this.createEnumerable(
            { getEnumerator: () => new CastEnumerator<TSource, U>(this.getEnumerator()) },
            node
        );
    }

    public ofType<U extends TSource>(guard: (value: TSource) => value is U): ITyneqEnumerable<U> {
        ArgumentUtility.checkNotOptional({ guard });
        const node = this.createOperatorNode(OfTypeEnumerator, [guard]);
        return this.createEnumerable(
            { getEnumerator: () => new OfTypeEnumerator<TSource, U>(this.getEnumerator(), guard) },
            node
        );
    }

    public append(item: TSource): ITyneqEnumerable<TSource> {
        const node = this.createOperatorNode(AppendEnumerator, [item]);
        return this.createEnumerable(
            { getEnumerator: () => new AppendEnumerator<TSource>(this.getEnumerator(), item) },
            node
        );
    }

    public chunk(size: number): ITyneqEnumerable<TSource[]> {
        ArgumentUtility.checkSafeInteger({ size });
        ArgumentUtility.checkPositive({ size });
        const node = this.createOperatorNode(ChunkEnumerator, [size]);
        return this.createEnumerable(
            { getEnumerator: () => new ChunkEnumerator<TSource>(this.getEnumerator(), size) },
            node
        );
    }

    public concat(other: Iterable<TSource>): ITyneqEnumerable<TSource> {
        ArgumentUtility.checkNotOptional({ other });
        ArgumentUtility.checkIterable({ other });
        const node = this.createOperatorNode(ConcatEnumerator, [other]);
        return this.createEnumerable(
            { getEnumerator: () => new ConcatEnumerator<TSource>(this.getEnumerator(), other) },
            node
        );
    }

    public defaultIfEmpty(defaultValue: TSource): ITyneqEnumerable<TSource> {
        const node = this.createOperatorNode(DefaultIfEmptyEnumerator, [defaultValue]);
        return this.createEnumerable(
            { getEnumerator: () => new DefaultIfEmptyEnumerator<TSource>(this.getEnumerator(), defaultValue) },
            node
        );
    }

    public pairwise(): ITyneqEnumerable<[TSource, TSource]> {
        const node = this.createOperatorNode(PairwiseEnumerator, []);
        return this.createEnumerable(
            { getEnumerator: () => new PairwiseEnumerator<TSource>(this.getEnumerator()) },
            node
        );
    }

    public populate<TValue>(value: TValue): ITyneqEnumerable<TValue> {
        const node = this.createOperatorNode(PopulateEnumerator, [value]);
        return this.createEnumerable(
            { getEnumerator: () => new PopulateEnumerator<TSource, TValue>(this.getEnumerator(), value) },
            node
        );
    }

    public prepend(item: TSource): ITyneqEnumerable<TSource> {
        const node = this.createOperatorNode(PrependEnumerator, [item]);
        return this.createEnumerable(
            { getEnumerator: () => new PrependEnumerator<TSource>(this.getEnumerator(), item) },
            node
        );
    }

    public scan<TResult>(
        seed: TResult,
        accumulator: (acc: TResult, item: TSource) => TResult
    ): ITyneqEnumerable<TResult> {
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
    ): ITyneqEnumerable<TResult> {
        ArgumentUtility.checkNotOptional({ selector });
        const node = this.createOperatorNode(SelectEnumerator, [selector]);
        return this.createEnumerable(
            { getEnumerator: () => new SelectEnumerator<TSource, TResult>(this.getEnumerator(), selector) },
            node
        );
    }

    public selectMany<TResult>(
        selector: (item: TSource) => Iterable<TResult>
    ): ITyneqEnumerable<TResult> {
        ArgumentUtility.checkNotOptional({ selector });
        const node = this.createOperatorNode(SelectManyEnumerator, [selector]);
        return this.createEnumerable(
            { getEnumerator: () => new SelectManyEnumerator<TSource, TResult>(this.getEnumerator(), selector) },
            node
        );
    }

    public skip(count: number): ITyneqEnumerable<TSource> {
        ArgumentUtility.checkNonNegative({ count });
        const node = this.createOperatorNode(SkipEnumerator, [count]);
        return this.createEnumerable(
            { getEnumerator: () => new SkipEnumerator<TSource>(this.getEnumerator(), count) },
            node
        );
    }

    public skipLast(count: number): ITyneqEnumerable<TSource> {
        const node = this.createOperatorNode(SkipLastEnumerator, [count]);
        return this.createEnumerable(
            { getEnumerator: () => new SkipLastEnumerator<TSource>(this.getEnumerator(), count) },
            node
        );
    }

    public skipWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        ArgumentUtility.checkNotOptional({ predicate });
        const node = this.createOperatorNode(SkipWhileEnumerator, [predicate]);
        return this.createEnumerable(
            { getEnumerator: () => new SkipWhileEnumerator<TSource>(this.getEnumerator(), predicate) },
            node
        );
    }

    public split(splitOn: (item: TSource) => boolean): ITyneqEnumerable<TSource[]> {
        ArgumentUtility.checkNotOptional({ splitOn });
        const node = this.createOperatorNode(SplitEnumerator, [splitOn]);
        return this.createEnumerable(
            { getEnumerator: () => new SplitEnumerator<TSource>(this.getEnumerator(), splitOn) },
            node
        );
    }

    public take(count: number): ITyneqEnumerable<TSource> {
        const node = this.createOperatorNode(TakeEnumerator, [count]);
        return this.createEnumerable(
            { getEnumerator: () => new TakeEnumerator<TSource>(this.getEnumerator(), count) },
            node
        );
    }

    public takeWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        ArgumentUtility.checkNotOptional({ predicate });
        const node = this.createOperatorNode(TakeWhileEnumerator, [predicate]);
        return this.createEnumerable(
            { getEnumerator: () => new TakeWhileEnumerator<TSource>(this.getEnumerator(), predicate) },
            node
        );
    }

    public tap(action: (item: TSource) => void): ITyneqEnumerable<TSource> {
        ArgumentUtility.checkNotOptional({ action });
        const node = this.createOperatorNode(TapEnumerator, [action]);
        return this.createEnumerable(
            { getEnumerator: () => new TapEnumerator<TSource>(this.getEnumerator(), action) },
            node
        );
    }

    public tapIf(action: (item: TSource) => void, predicate: () => boolean): ITyneqEnumerable<TSource> {
        ArgumentUtility.checkNotOptional({ action });
        ArgumentUtility.checkNotOptional({ predicate });
        const node = this.createOperatorNode(TapIfEnumerator, [action, predicate]);
        return this.createEnumerable(
            { getEnumerator: () => new TapIfEnumerator<TSource>(this.getEnumerator(), action, predicate) },
            node
        );
    }

    public throttle(count: number): ITyneqEnumerable<TSource> {
        ArgumentUtility.checkSafeInteger({ count });
        ArgumentUtility.checkPositive({ count });
        const node = this.createOperatorNode(ThrottleEnumerator, [count]);
        return this.createEnumerable(
            { getEnumerator: () => new ThrottleEnumerator<TSource>(this.getEnumerator(), count) },
            node
        );
    }

    public where(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
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
    ): ITyneqEnumerable<TResult> {
        ArgumentUtility.checkNotOptional({ other });
        ArgumentUtility.checkIterable({ other });
        ArgumentUtility.checkNotOptional({ selector });
        const node = this.createOperatorNode(ZipEnumerator, [other, selector]);
        return this.createEnumerable(
            { getEnumerator: () => new ZipEnumerator<TSource, TOther, TResult>(this.getEnumerator(), other, selector) },
            node
        );
    }

    // ── Buffer operators ──────────────────────────────────────────────────────

    public backsert(index: number, other: Iterable<TSource>): ITyneqEnumerable<TSource> {
        ArgumentUtility.checkNotOptional({ index, other });
        ArgumentUtility.checkNotNull({ other });
        if (typeof index !== "number" || !Number.isFinite(index)) {
            throw new TypeError("backIndex must be a finite number.");
        }
        if (!Number.isSafeInteger(index)) {
            throw new RangeError("backIndex must be a safe integer.");
        }
        if (index < 0) {
            throw new RangeError("backIndex must be a non-negative integer.");
        }
        ArgumentUtility.checkIterable({ other });
        const node = this.createOperatorNode(BacksertEnumerator, [index, other]);
        return this.createEnumerable(
            { getEnumerator: () => new BacksertEnumerator<TSource>(this.getEnumerator(), index, other) },
            node
        );
    }

    public distinct(): ITyneqEnumerable<TSource> {
        const node = this.createOperatorNode(DistinctEnumerator, []);
        return this.createEnumerable(
            { getEnumerator: () => new DistinctEnumerator<TSource>(this.getEnumerator()) },
            node
        );
    }

    public distinctBy<TKey>(keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        ArgumentUtility.checkNotOptional({ keySelector });
        const node = this.createOperatorNode(DistinctByEnumerator, [keySelector]);
        return this.createEnumerable(
            { getEnumerator: () => new DistinctByEnumerator<TSource, TKey>(this.getEnumerator(), keySelector) },
            node
        );
    }

    public except(excludedValues: Iterable<TSource>): ITyneqEnumerable<TSource> {
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
    ): ITyneqEnumerable<TSource> {
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
        resultSelector: (key: TKey, values: ITyneqEnumerable<TValue>) => TResult
    ): ITyneqEnumerable<TResult> {
        ArgumentUtility.checkNotOptional({ keySelector });
        ArgumentUtility.checkNotOptional({ valueSelector });
        ArgumentUtility.checkNotOptional({ resultSelector });
        const node = this.createOperatorNode(GroupByEnumerator, [keySelector, valueSelector, resultSelector]);
        const groupFactory = (values: TValue[]): ITyneqEnumerable<TValue> =>
            this.createEnumerable({ getEnumerator: () => values[Symbol.iterator]() as IEnumerator<TValue> });
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
        resultSelector: (outer: TSource, group: ITyneqEnumerable<TInner>) => TResult
    ): ITyneqEnumerable<TResult> {
        ArgumentUtility.checkNotOptional({ inner });
        ArgumentUtility.checkIterable({ inner });
        ArgumentUtility.checkNotOptional({ outerKeySelector });
        ArgumentUtility.checkNotOptional({ innerKeySelector });
        ArgumentUtility.checkNotOptional({ resultSelector });
        const node = this.createOperatorNode(GroupJoinEnumerator, [inner, outerKeySelector, innerKeySelector, resultSelector]);
        const groupFactory = (values: TInner[]): ITyneqEnumerable<TInner> =>
            this.createEnumerable({ getEnumerator: () => values[Symbol.iterator]() as IEnumerator<TInner> });
        return this.createEnumerable(
            {
                getEnumerator: () => new GroupJoinEnumerator<TSource, TInner, TKey, TResult>(
                    this.getEnumerator(), inner, outerKeySelector, innerKeySelector, resultSelector, groupFactory
                ),
            },
            node
        );
    }

    public intersect(intersectedValues: Iterable<TSource>): ITyneqEnumerable<TSource> {
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
    ): ITyneqEnumerable<TSource> {
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
    ): ITyneqEnumerable<TResult> {
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

    public reverse(): ITyneqEnumerable<TSource> {
        const node = this.createOperatorNode(ReverseEnumerator, []);
        return this.createEnumerable(
            { getEnumerator: () => new ReverseEnumerator<TSource>(this.getEnumerator()) },
            node
        );
    }

    public shuffle(): ITyneqEnumerable<TSource> {
        const node = this.createOperatorNode(ShuffleEnumerator, []);
        return this.createEnumerable(
            { getEnumerator: () => new ShuffleEnumerator<TSource>(this.getEnumerator()) },
            node
        );
    }

    public union(otherValues: Iterable<TSource>): ITyneqEnumerable<TSource> {
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
    ): ITyneqEnumerable<TSource> {
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
