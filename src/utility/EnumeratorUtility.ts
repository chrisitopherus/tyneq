import { Enumerator } from "../types/core";
import { Optional } from "../types/utility";
import { InvalidOperationError } from "../core/errors/InvalidOperationError";

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

    /**
     * Returns `true` if `iterable[Symbol.iterator]()` returns `iterable` itself - the signature
     * of a one-shot iterable (a generator object, or the result of `Map.prototype.entries()`
     * and similar built-in iterator-as-iterable helpers). Calling `[Symbol.iterator]()` a second
     * time on such a value returns the same, already-advanced iterator rather than a fresh one.
     *
     * @remarks
     * This check is cheap and non-consuming: obtaining an iterator via `[Symbol.iterator]()`
     * does not advance it, so calling this does not affect subsequent iteration.
     */
    public static isOneShotIterable<TSource>(iterable: Iterable<TSource>): boolean {
        return (iterable[Symbol.iterator]() as unknown) === (iterable as unknown);
    }

    /**
     * Wraps `iterable` so that every call to `[Symbol.iterator]()` after the first throws
     * {@link InvalidOperationError} instead of silently handing back an already-exhausted
     * iterator, if - and only if - `iterable` is detected as one-shot via {@link isOneShotIterable}.
     * Ordinary re-iterable sources (arrays, sets, and any custom iterable whose
     * `[Symbol.iterator]()` returns a fresh iterator each call) pass through unchanged and
     * remain re-iterable without restriction.
     *
     * @remarks
     * Use this once, at the point a class-based operator or source adapter stores a caller-
     * supplied `Iterable<T>` argument, so every later `[Symbol.iterator]()` call on the stored
     * reference is protected without needing to re-check at each call site.
     *
     * @param iterable - The iterable to guard.
     * @param paramName - The parameter name to report in the thrown error's message.
     * @throws {InvalidOperationError} On the second and any subsequent call to
     * `[Symbol.iterator]()`, if `iterable` is one-shot.
     */
    public static guardReiterable<TSource>(iterable: Iterable<TSource>, paramName: string): Iterable<TSource> {
        if (!EnumeratorUtility.isOneShotIterable(iterable)) {
            return iterable;
        }

        let consumed = false;
        return {
            [Symbol.iterator](): Iterator<TSource> {
                if (consumed) {
                    throw new InvalidOperationError(
                        `'${paramName}' is a one-shot iterable (for example a generator object) and has ` +
                        "already been iterated once. Tyneq sequences are re-iterable, but a one-shot " +
                        "iterable cannot be replayed - wrap it in an array (e.g. Tyneq.from([...source])) " +
                        "or call .memoize() if you need to iterate it more than once."
                    );
                }

                consumed = true;
                return iterable[Symbol.iterator]();
            }
        };
    }
}
