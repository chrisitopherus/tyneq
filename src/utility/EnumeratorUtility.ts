import { Enumerator } from "../types/core";
import { Optional } from "../types/utility";

/**
 * Internal helpers for working with {@link Enumerator} instances.
 *
 * @remarks
 * Static utility class; cannot be instantiated. All members are internal helpers used
 * by enumerator implementations.
 *
 * @group Utilities
 * @internal
 */
export class EnumeratorUtility {
    private constructor() { }

    /**
     * Calls `return()` on the enumerator if the method exists, swallowing any thrown exception.
     *
     * @remarks
     * Safely disposes an enumerator without propagating errors from the enumerator's own cleanup
     * logic. If `enumerator` is `null` or `undefined`, or if it has no `return` method, this is
     * a no-op.
     *
     * @param enumerator - The enumerator to dispose. May be `null` or `undefined`.
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

    /**
     * Wraps an enumerator in a minimal `Iterable` so it can be used in `for...of` loops.
     *
     * @remarks
     * The returned iterable always returns the same enumerator instance from `[Symbol.iterator]()`.
     * It is **single-use** — iterating it a second time re-uses the already-advanced enumerator
     * and will produce no further elements.
     *
     * @param enumerator - The enumerator to wrap.
     * @returns A single-use `Iterable<TSource>` backed by `enumerator`.
     */
    public static toIterable<TSource>(enumerator: Enumerator<TSource>): Iterable<TSource> {
        return {
            [Symbol.iterator]: () => enumerator
        };
    }
}