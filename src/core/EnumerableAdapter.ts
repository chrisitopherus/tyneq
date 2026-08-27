import { Enumerable, Enumerator } from "../types/core";
import { ArgumentUtility } from "../utility/ArgumentUtility";
import { EnumeratorUtility } from "../utility/EnumeratorUtility";

/**
 * Wraps a native `Iterable<T>` as a Tyneq {@link Enumerable}.
 *
 * @remarks
 * Used by `Tyneq.from()` to adapt arrays, sets, generators, and any other iterable.
 * Each call to `getEnumerator()` delegates to the underlying `[Symbol.iterator]()`.
 *
 * If `iterable` is detected as one-shot (its `[Symbol.iterator]()` returns itself, as with a
 * generator object), the second and any subsequent `getEnumerator()` call throws
 * {@link InvalidOperationError} instead of silently replaying an already-exhausted iterator.
 * Ordinary re-iterable sources are unaffected.
 *
 * @internal
 */
export class EnumerableAdapter<TSource> implements Enumerable<TSource> {
    private readonly iterable: Iterable<TSource>;
    public constructor(iterable: Iterable<TSource>) {
        ArgumentUtility.checkNotOptional({ iterable });
        ArgumentUtility.checkIterable({ iterable });

        this.iterable = EnumeratorUtility.guardReiterable(iterable, "source");
    }

    public [Symbol.iterator](): Enumerator<TSource> {
        return this.getEnumerator();
    }

    public getEnumerator(): Enumerator<TSource> {
        return this.iterable[Symbol.iterator]();
    }
}
