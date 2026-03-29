import { RangeEnumerator } from "./generators/range";
import { RandomEnumerator } from "./generators/random";
import { Enumerable, Enumerator, EnumeratorFactory, IteratorFactory, TyneqSequence } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";
import { nameof } from "../utility/nameof";
import { EnumerableAdapter } from "./EnumerableAdapter";
import { TyneqEnumerable } from "./TyneqEnumerable";
import { QueryNode } from "../queryplan/QueryNode";
import type { SourceKind } from "../types/queryplan";

/**
 * Entry point for creating Tyneq sequences.
 *
 * @example
 * ```ts
 * import { Tyneq } from "tyneq";
 *
 * const sum = Tyneq.from([1, 2, 3, 4, 5])
 *   .where((x) => x % 2 === 0)
 *   .sum((x) => x); // -> 6
 * ```
 *
 * @group Classes
 */
export class Tyneq {
    /**
     * Creates a lazy sequence from any `Iterable<T>` (arrays, sets, generators, etc.).
     *
     * @throws {ArgumentNullError} When `source` is null or undefined.
     * @throws {ArgumentTypeError} When `source` is not iterable.
     */
    public static from<TSource>(source: Iterable<TSource>): TyneqSequence<TSource> {
        ArgumentUtility.checkNotOptional({ source });
        ArgumentUtility.checkIterable({ source });

        const sourceKind = Tyneq.resolveSourceKind(source);
        const adapter = new EnumerableAdapter(source);
        return new TyneqEnumerable<TSource>(adapter, new QueryNode("from", [source], null, "source", sourceKind));
    }

    private static resolveSourceKind(source: Iterable<unknown>): SourceKind {
        if (Array.isArray(source)) return "array";
        if (source instanceof Set) return "set";
        if (source instanceof Map) return "map";
        if (typeof source === "string") return "string";

        return "other";
    }

    /**
     * Creates a sequence of `count` elements produced by calling `randomizer` once per element.
     *
     * @remarks
     * Returns an empty sequence when `count === 0`.
     *
     * @throws {ArgumentOutOfRangeError} When `count` is negative.
     * @throws {ArgumentNullError} When `randomizer` is null or undefined.
     */
    public static random<TSource>(count: number, randomizer: () => TSource): TyneqSequence<TSource> {
        ArgumentUtility.checkNonNegative({ count });
        ArgumentUtility.checkNotOptional({ randomizer });

        if (count === 0) {
            return this.empty<TSource>();
        }

        return new TyneqEnumerable<TSource>({
            getEnumerator: () => new RandomEnumerator<TSource>(count, randomizer)
        }, new QueryNode("random", [count], null, "source"));
    }

    /**
     * Returns `true` if `source` is `null`, `undefined`, or an iterable whose first element is `null` or `undefined`.
     */
    public static isNullOrEmpty<TSource>(source: Iterable<TSource> | null | undefined): boolean {
        if (source === null || source === undefined) {
            return true;
        }

        return this.from(source).isNullOrEmpty();
    }

    /**
     * Creates a sequence of `count` integers starting from `start`.
     *
     * @remarks
     * Returns an empty sequence when `count === 0`.
     *
     * @example
     * ```ts
     * Tyneq.range(1, 5).toArray(); // -> [1, 2, 3, 4, 5]
     * ```
     *
     * @throws {ArgumentOutOfRangeError} When `count` is negative.
     * @throws {ArgumentError} When `count` is not an integer.
     */
    public static range(start: number, count: number): TyneqSequence<number> {
        ArgumentUtility.checkNonNegative({ count });
        ArgumentUtility.checkInteger({ count });

        if (count === 0) {
            return this.empty<number>();
        }

        const end = start + count - 1;
        return new TyneqEnumerable<number>({
            getEnumerator: () => new RangeEnumerator(start, end)
        }, new QueryNode("range", [start, count], null, "source"));
    }

    /** Returns an empty sequence with zero elements. */
    public static empty<TSource>(): TyneqSequence<TSource> {
        return new TyneqEnumerable<TSource>(
            new EnumerableAdapter<TSource>([]),
            new QueryNode("empty", [], null, "source")
        );
    }

    /**
     * Pairs each element with its zero-based index.
     *
     * @remarks
     * Each iteration produces independent index counters — safe to re-enumerate.
     *
     * @example
     * ```ts
     * Tyneq.enumerate(["a", "b", "c"]).toArray();
     * // -> [[0, "a"], [1, "b"], [2, "c"]]
     * ```
     *
     * @throws {ArgumentNullError} When `source` is null or undefined.
     * @throws {ArgumentTypeError} When `source` is not iterable.
     */
    public static enumerate<TSource>(source: Iterable<TSource>): Enumerable<[number, TSource]> {
        ArgumentUtility.checkNotOptional({ source });
        ArgumentUtility.checkIterable({ source });
        // A fresh `index` counter is created per enumeration via [Symbol.iterator],
        // preventing the shared-counter bug that occurs when the result is re-enumerated.
        return this.from({
            *[Symbol.iterator]() {
                let index = 0;
                for (const item of source) yield [index++, item] as [number, TSource];
            }
        });
    }
}
