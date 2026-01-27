import { RangeEnumerator } from "../enumerators/streaming/range";
import { IteratorFactory } from "../types/core";
import { TyneqEnumerable } from "./TyneqEnumerable";

/**
 * Tyneq is the public entry point for creating typed enumerable sequences.
 *
 * Use for example `Tyneq.from` to wrap an existing iterable. Returned values are `TyneqEnumerable` which
 * expose the full set of streaming and terminal operators implemented in
 * the library.
 *
 * Examples:
 * ```ts
 * const nums = Tyneq.from([1, 2, 3]);
 * const range = Tyneq.range(0, 5);
 * ```
 */
export class Tyneq {
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
    public static from<TSource>(source: Iterable<TSource>): TyneqEnumerable<TSource> {
        const factory: IteratorFactory<TSource> = () => source[Symbol.iterator]();
        return new TyneqEnumerable<TSource>(factory);
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
    public static range(start: number, count: number): TyneqEnumerable<number> {
        const arr = new Array<number>(count);
        const factory: IteratorFactory<number> = () => {
            const source = arr[Symbol.iterator]();
            return new RangeEnumerator(source, start);
        }

        return new TyneqEnumerable<number>(factory);
    }
}