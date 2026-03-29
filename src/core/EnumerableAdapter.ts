import { Enumerable, Enumerator } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";

/**
 * Wraps a native `Iterable<T>` as a Tyneq {@link Enumerable}.
 *
 * @remarks
 * Used by `Tyneq.from()` to adapt arrays, sets, generators, and any other iterable.
 * Each call to `getEnumerator()` delegates to the underlying `[Symbol.iterator]()`.
 *
 * @internal
 */
export class EnumerableAdapter<TSource> implements Enumerable<TSource> {
    private readonly iterable: Iterable<TSource>;
    public constructor(iterable: Iterable<TSource>) {
        ArgumentUtility.checkNotOptional({ iterable });
        ArgumentUtility.checkIterable({ iterable });

        this.iterable = iterable;
    }

    public [Symbol.iterator](): Enumerator<TSource> {
        return this.getEnumerator();
    }

    public getEnumerator(): Enumerator<TSource> {
        return this.iterable[Symbol.iterator]();
    }
}
