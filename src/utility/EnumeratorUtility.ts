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
        const enumeratorReturnFunc = enumerator?.return;
        if (!enumeratorReturnFunc) return;

        try {
            enumeratorReturnFunc.call(enumerator);
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
}