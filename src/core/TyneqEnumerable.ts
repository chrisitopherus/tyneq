import { AllOperator } from "../operators/terminal/all";
import { AnyOperator } from "../operators/terminal/any";
import { CountOperator } from "../operators/terminal/count";
import { IEnumerable, IEnumerator, IteratorFactory, ITyneqEnumerable, ITyneqOrderedEnumerable } from "../types/core";
import { ReverseEnumerator } from "../enumerators/buffer/reverse";
import { DistinctEnumerator } from "../enumerators/buffer/distinct";
import { DistinctByEnumerator } from "../enumerators/buffer/distinctBy";
import { GroupByEnumerator } from "../enumerators/buffer/groupBy";
import { TyneqOrderedEnumerable } from "./ordering/TyneqOrderedEnumerable";
import { WhereOperator } from "../operators/streaming/where";
import { AppendOperator } from "../operators/streaming/append";
import { ConcatOperator } from "../operators/streaming/concat";
import { SelectOperator } from "../operators/streaming/select";
import { PrependOperator } from "../operators/streaming/prepend";
import { SelectManyOperator } from "../operators/streaming/selectMany";
import { SkipOperator } from "../operators/streaming/skip";
import { SkipLastOperator } from "../operators/streaming/skipLast";
import { SkipWhileOperator } from "../operators/streaming/skipWhile";
import { TakeOperator } from "../operators/streaming/take";
import { TakeWhileOperator } from "../operators/streaming/takeWhile";
import { ZipOperator } from "../operators/streaming/zip";
import { DistinctOperator } from "../operators/buffer/distinct";
import { DistinctByOperator } from "../operators/buffer/distinctBy";
import { ExceptOperator } from "../operators/buffer/except";
import { ExceptByOperator } from "../operators/buffer/exceptBy";
import { IntersectOperator } from "../operators/buffer/intersect";
import { IntersectByOperator } from "../operators/buffer/intersectBy";
import { GroupByOperator } from "../operators/buffer/groupBy";
import { ReverseOperator } from "../operators/buffer/reverse";
import { UnionEnumerator } from "../enumerators/buffer/union";
import { UnionOperator } from "../operators/buffer/union";
import { UnionByOperator } from "../operators/buffer/unionBy";
import { ContainsOperator } from "../operators/terminal/contains";
import { DefaultIfEmptyOperator } from "../operators/terminal/defaultIfEmpty";

export class TyneqEnumerable<TSource> implements ITyneqEnumerable<TSource> {
    public constructor(protected readonly iteratorFactory: IteratorFactory<TSource>) { }

    public [Symbol.iterator](): IEnumerator<TSource> {
        return this.getSource();
    }

    public getSource(): IEnumerator<TSource> {
        return this.iteratorFactory();
    }

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

    public toArray(): TSource[] {
        return Array.from(this);
    }

    // stream operators

    public append(item: TSource): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new AppendOperator<TSource>(this, item).getFactory()
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

    public zip<TOther, TResult>(other: IEnumerable<TOther>, selector: (first: TSource, second: TOther) => TResult): ITyneqEnumerable<TResult> {
        return new TyneqEnumerable<TResult>(
            new ZipOperator<TSource, TOther, TResult>(this, other, selector).getFactory()
        );
    }

    public where(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new WhereOperator<TSource>(this, predicate).getFactory()
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