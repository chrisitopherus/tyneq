import { Enumerator } from "../types/core";
import { Optional } from "../types/utility";

/**
 * Low-level helpers for working with `Enumerator<T>` objects inside custom operator enumerators.
 *
 * Import from `"tyneq/plugin"` when writing class-based operators that need to convert
 * between `Iterable<T>` and `Enumerator<T>`, or that need safe cleanup via `tryDispose`.
 *
 * @group Plugin Utilities
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

    /**
     * Advances the enumerator by one position and returns `true` if that position was done.
     *
     * **Warning:** this calls `next()` and irrevocably consumes one element.
     * If the enumerator is not exhausted, the yielded element is discarded.
     * Only call this when advancing past the current position is intentional.
     */
    public static checkAndConsume<TSource>(enumerator: Enumerator<TSource>): boolean {
        return enumerator.next().done === true;
    }
}
