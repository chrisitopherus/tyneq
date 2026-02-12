import { RangeEnumerator } from "../../enumerators/streaming/range";
import { IteratorFactory, ITyneqEnumerable, TyneqEnumerableFactory } from '../../types/core';
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";
import { TyneqEnumerable } from "../TyneqEnumerable";

export class TyneqExtended {
    /**
     * Create a `TyneqEnumerable` from any iterable source.
     *
     * This wraps the provided iterable in a factory that produces a fresh
     * iterator for each enumeration, enabling multiple independent
     * enumerations over the same source.
     *
     * @typeParam TSource - Element type of the source iterable.
     * @param source - An iterable to wrap as a `TyneqEnumerable`.
     * @returns A `TyneqEnumerable<TSource>` that can be used with streaming and
     * terminal operators.
     *
     * @example
     * ```ts
     * const seq = Tyneq.from(["a", "b", "c"]);
     * const list = seq.toList(); // using terminal operator
     * ```
     */
    public static from<TSource, TEnumerable extends TyneqEnumerable<TSource>>(source: Iterable<TSource>, enumerableFactory: TyneqEnumerableFactory<TSource, TEnumerable>): TEnumerable {
        ArgumentUtility.checkNotOptional(source, nameof({ source }));

        const factory: IteratorFactory<TSource> = () => source[Symbol.iterator]();
        return enumerableFactory(factory);
    }

    /**
     * Create a numeric sequence starting at `start` with `count` elements.
     *
     * The returned enumerable yields `start, start+1, ..., start+count-1`.
     *
     * @param start - The first number in the sequence.
     * @param count - How many numbers to generate. Should be a non-negative integer.
     * @returns A `TyneqEnumerable<number>` that produces the numeric range.
     *
     * @example
     * ```ts
     * const r = Tyneq.range(0, 3); // yields 0,1,2
     * ```
     */
    public static range<TEnumerable extends TyneqEnumerable<number>>(start: number, count: number, enumerableFactory: TyneqEnumerableFactory<number, TEnumerable>): TEnumerable {
        ArgumentUtility.checkNonNegative(count, nameof({ count }));
        ArgumentUtility.checkInteger(count, nameof({ count }));

        const arr = new Array<number>(count);
        const factory: IteratorFactory<number> = () => {
            const source = arr[Symbol.iterator]();
            return new RangeEnumerator(source, start);
        }

        return enumerableFactory(factory);
    }

    public static empty<TSource, TEnumerable extends TyneqEnumerable<TSource>>(enumerableFactory: TyneqEnumerableFactory<TSource, TEnumerable>): TEnumerable {
        return this.from<TSource, TEnumerable>([], enumerableFactory);
    }
}