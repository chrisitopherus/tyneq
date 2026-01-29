import { Nullable } from "../../types/utility";
import { BaseEnumerableSorter } from "./BaseEnumerableSorter";
import { TyneqEnumerableSorter } from "./TyneqEnumerableSorter";
import type { IEnumerable, IEnumerator, IOrderedEnumerable, ITyneqEnumerable, ITyneqOrderedEnumerable } from '../../types/core';
import { TyneqEnumerable } from "../TyneqEnumerable";
import { OrderByEnumerator } from "../../enumerators/buffer/orderBy";
import { WhereEnumerator } from "../../enumerators/streaming/where";
import { WhereOperator } from "../../operators/streaming/where";
import { ConcatOperator } from "../../operators/streaming/concat";
import { AppendOperator } from "../../operators/streaming/append";
import { SelectOperator } from "../../operators/streaming/select";
import { PrependOperator } from "../../operators/streaming/prepend";
import { SelectManyOperator } from "../../operators/streaming/selectMany";
import { SkipOperator } from "../../operators/streaming/skip";
import { SkipLastOperator } from "../../operators/streaming/skipLast";
import { SkipWhileOperator } from "../../operators/streaming/skipWhile";
import { TakeOperator } from "../../operators/streaming/take";
import { TakeWhileOperator } from "../../operators/streaming/takeWhile";
import { ZipOperator } from "../../operators/streaming/zip";
import { DistinctOperator } from "../../operators/buffer/distinct";
import { DistinctByOperator } from "../../operators/buffer/distinctBy";
import { ExceptByOperator } from "../../operators/buffer/exceptBy";
import { ExceptOperator } from "../../operators/buffer/except";
import { IntersectByOperator } from "../../operators/buffer/intersectBy";
import { IntersectOperator } from "../../operators/buffer/intersect";
import { GroupByOperator } from "../../operators/buffer/groupBy";
import { UnionByOperator } from "../../operators/buffer/unionBy";
import { UnionOperator } from "../../operators/buffer/union";
import { ReverseOperator } from "../../operators/buffer/reverse";
import { AllOperator } from "../../operators/terminal/all";
import { AnyOperator } from "../../operators/terminal/any";
import { CountOperator } from "../../operators/terminal/count";

export class TyneqOrderedEnumerable<TSource, TKey> implements ITyneqOrderedEnumerable<TSource> {
    private readonly keySelector: (item: TSource) => TKey;
    private readonly comparer: (a: TKey, b: TKey) => number;
    private readonly descending: boolean;
    public parent: Nullable<IOrderedEnumerable<TSource>>;
    public readonly source: ITyneqEnumerable<TSource>;
    public constructor(
        source: ITyneqEnumerable<TSource>,
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

    // terminal operators

    public toArray(): TSource[] {
        return Array.from(this);
    }

    /**
     * Returns the number of elements in a sequence.
     * @returns The number of elements in the input sequence.
     */
    public count(): number {
        return new CountOperator<TSource>(this)
            .process();
    }

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

    // stream operators

    public append(element: TSource): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new AppendOperator<TSource>(this, element).getFactory()
        );
    }

    public concat(other: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new ConcatOperator<TSource>(this, other).getFactory()
        );
    }

    public prepend(item: TSource): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new PrependOperator<TSource>(this, item).getFactory()
        );
    }

    public select<TResult>(selector: (item: TSource) => TResult): ITyneqEnumerable<TResult> {
        return new TyneqEnumerable<TResult>(
            new SelectOperator<TSource, TResult>(this, selector).getFactory()
        );
    }

    public selectMany<TResult>(selector: (item: TSource) => IEnumerable<TResult>): ITyneqEnumerable<TResult> {
        return new TyneqEnumerable<TResult>(
            new SelectManyOperator<TSource, TResult>(this, selector).getFactory()
        );
    }

    public skip(count: number): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new SkipOperator<TSource>(this, count).getFactory()
        );
    }

    public skipLast(count: number): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new SkipLastOperator<TSource>(this, count).getFactory()
        );
    }

    public skipWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new SkipWhileOperator<TSource>(this, predicate).getFactory()
        );
    }

    public take(count: number): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new TakeOperator<TSource>(this, count).getFactory()
        );
    }

    public takeWhile(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new TakeWhileOperator<TSource>(this, predicate).getFactory()
        );
    }

    public where(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new WhereOperator<TSource>(this, predicate).getFactory()
        );
    }

    public zip<TOther, TResult>(other: IEnumerable<TOther>, selector: (first: TSource, second: TOther) => TResult): ITyneqEnumerable<TResult> {
        return new TyneqEnumerable<TResult>(
            new ZipOperator<TSource, TOther, TResult>(this, other, selector).getFactory()
        );
    }

    // buffering operators

    public distinct(): TyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new DistinctOperator<TSource>(this).getFactory()
        );
    }

    public distinctBy<TKey>(keySelector: (item: TSource) => TKey): TyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new DistinctByOperator<TSource, TKey>(this, keySelector).getFactory()
        );
    }

    public except(excludedValues: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new ExceptOperator<TSource>(this, excludedValues).getFactory()
        );
    }

    public exceptBy<TKey>(excludedKeys: IEnumerable<TKey>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new ExceptByOperator<TSource, TKey>(this, excludedKeys, keySelector).getFactory()
        );
    }

    public groupBy<TKey, TValue, TResult>(
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: ITyneqEnumerable<TValue>) => TResult
    ): ITyneqEnumerable<TResult> {
        return new TyneqEnumerable<TResult>(
            new GroupByOperator<TSource, TKey, TValue, TResult>(
                this,
                keySelector,
                valueSelector,
                resultSelector
            ).getFactory()
        );
    }

    public intersect(intersectedValues: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new IntersectOperator<TSource>(this, intersectedValues).getFactory()
        );
    }

    public intersectBy<TKey>(intersectedKeys: IEnumerable<TKey>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new IntersectByOperator<TSource, TKey>(this, intersectedKeys, keySelector).getFactory()
        );
    }

    public orderBy<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: ((a: TKey, b: TKey) => number) | undefined
    ): ITyneqOrderedEnumerable<TSource> {
        return new TyneqOrderedEnumerable<TSource, TKey>(
            this,
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            false
        );
    }

    public orderByDescending<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: ((a: TKey, b: TKey) => number) | undefined
    ): ITyneqOrderedEnumerable<TSource> {
        return new TyneqOrderedEnumerable<TSource, TKey>(
            this,
            keySelector,
            comparer ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
            true
        )
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

    public reverse(): TyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new ReverseOperator<TSource>(this).getFactory()
        );
    }

    public union(otherValues: IEnumerable<TSource>): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new UnionOperator<TSource>(this, otherValues).getFactory()
        );
    }

    public unionBy<TKey>(otherValues: IEnumerable<TSource>, keySelector: (item: TSource) => TKey): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new UnionByOperator<TSource, TKey>(this, otherValues, keySelector).getFactory()
        );
    }
}