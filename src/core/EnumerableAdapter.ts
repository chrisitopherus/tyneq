import { Enumerable, Enumerator } from "../types/core";
import { ArgumentUtility } from "../utility/argumentUtility";

/**
 * Adapts any `Iterable<TSource>` into an {@link Enumerable} by delegating
 * `[Symbol.iterator]` and `getEnumerator` directly to the wrapped iterable.
 *
 * @remarks
 * Used internally by {@link Tyneq.from} to wrap user-provided iterables (arrays, sets, maps,
 * generator functions, etc.) into the `Enumerable` protocol without copying elements.
 *
 * Each call to `getEnumerator()` forwards to `iterable[Symbol.iterator]()`, so re-iterability
 * depends on the wrapped iterable — re-iterable sources (arrays, sets) produce fresh iterators;
 * single-use sources (raw generators) do not.
 *
 * @typeParam TSource - Element type of the wrapped iterable.
 *
 * @see {@link Tyneq.from} The only entry point that creates this adapter.
 *
 * @group Classes
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
