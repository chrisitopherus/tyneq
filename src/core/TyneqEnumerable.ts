import { SelectEnumerator } from "../enumerators/streaming/select";
import { SelectManyEnumerator } from "../enumerators/streaming/selectMany";
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

export class TyneqEnumerable<TSource> implements ITyneqEnumerable<TSource> {
    public constructor(protected readonly iteratorFactory: IteratorFactory<TSource>) { }

    public [Symbol.iterator](): IEnumerator<TSource> {
        return this.getSource();
    }

    public getSource(): IEnumerator<TSource> {
        return this.iteratorFactory();
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

    public where(predicate: (item: TSource) => boolean): ITyneqEnumerable<TSource> {
        return new TyneqEnumerable<TSource>(
            new WhereOperator<TSource>(this, predicate).getFactory()
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

    // buffering operators

    public reverse(): TyneqEnumerable<TSource> {
        const source = this;
        const factory: IteratorFactory<TSource> = () => {
            const inner = source[Symbol.iterator]();
            return new ReverseEnumerator<TSource>(inner);
        };

        return new TyneqEnumerable<TSource>(factory);
    }

    public distinct(): TyneqEnumerable<TSource> {
        const source = this;
        const factory: IteratorFactory<TSource> = () => {
            const inner = source[Symbol.iterator]();
            return new DistinctEnumerator<TSource>(inner);
        };

        return new TyneqEnumerable<TSource>(factory);
    }

    public distinctBy<TKey>(keySelector: (item: TSource) => TKey): TyneqEnumerable<TSource> {
        const source = this;
        const factory: IteratorFactory<TSource> = () => {
            const inner = source[Symbol.iterator]();
            return new DistinctByEnumerator<TSource, TKey>(inner, keySelector);
        };

        return new TyneqEnumerable<TSource>(factory);
    }

    public groupBy<TKey, TValue, TResult>(
        keySelector: (item: TSource) => TKey,
        valueSelector: (item: TSource) => TValue,
        resultSelector: (key: TKey, values: TyneqEnumerable<TValue>) => TResult
    ): TyneqEnumerable<TResult> {
        const source = this;
        const factory: IteratorFactory<TResult> = () => {
            const inner = source[Symbol.iterator]();
            return new GroupByEnumerator(inner, keySelector, valueSelector, resultSelector);
        };

        return new TyneqEnumerable<TResult>(factory);
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
        )
    }

    public orderByDescending<TKey>(
        keySelector: (item: TSource) => TKey,
        comparer?: ((a: TKey, b: TKey) => number) | undefined
    ): ITyneqOrderedEnumerable<TSource> {
        throw new Error("Method not implemented.");
    }
}