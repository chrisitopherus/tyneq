import { NotSupportedError } from "../core/errors/NotSupportedError";
import { Enumerator } from "../types/core";
import { Optional } from "../types/utility";

/**
 * Low-level helpers for working with `Enumerator<T>` objects.
 *
 * @group Utilities
 * @internal
 */
export class EnumeratorUtility {
    private constructor() { }

    /**
     * Calls `enumerator.return()` if it exists, swallowing any error.
     * Safe to call on `null` or `undefined`.
     */
    public static tryDispose<TSource>(enumerator: Optional<Enumerator<TSource>>): void {
        try {
            enumerator?.return?.();
        } catch {
            // swallow
        }
    }

    /** Wraps an `Enumerator<T>` in a minimal `Iterable<T>` adapter (no buffering). */
    public static toIterable<TSource>(enumerator: Enumerator<TSource>): Iterable<TSource> {
        return {
            [Symbol.iterator]: () => enumerator
        };
    }

    /** Gets an `Enumerator<T>` from any `Iterable<T>`. */
    public static fromIterable<TSource>(iterable: Iterable<TSource>): Enumerator<TSource> {
        return iterable[Symbol.iterator]() as Enumerator<TSource>;
    }

    /** Checks if the enumerator is already exhausted (i.e., `next().done === true`). */
    public static isExhausted<TSource>(enumerator: Enumerator<TSource>): boolean {
        return enumerator.next().done === true;
    }
}