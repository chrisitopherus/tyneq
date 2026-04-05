
import { Comparer } from "../types/core";

/**
 * Built-in comparers and equality comparers used by ordering and equality operators.
 *
 * @remarks
 * All members are static. This class cannot be instantiated.
 *
 * @group Utilities
 */
export class TyneqComparer {
    private constructor() {}

    /**
     * Natural-order comparer using `<` and `>`.
     *
     * @remarks
     * Works correctly for numbers, strings, dates, and any type that overloads the relational operators.
     *
     * @returns Negative if `a < b`, positive if `a > b`, `0` if equal.
     */
    public static defaultComparer<T>(a: T, b: T): number {
        return a > b ? 1 : a < b ? -1 : 0;
    }

    /** Strict equality comparer using `===`. */
    public static defaultEqualityComparer<T>(a: T, b: T): boolean {
        return a === b;
    }

    /**
     * Returns a comparer that reverses the order of `comparer`.
     *
     * @remarks
     * Wraps any existing comparer to sort in descending order without rewriting it.
     */
    public static reverse<T>(comparer: Comparer<T>): Comparer<T> {
        return (a, b) => comparer(b, a);
    }

    /**
     * Numeric comparer using subtraction (`a - b`).
     *
     * @remarks
     * Only correct for finite numbers. Do not use when values may be `NaN` or `Infinity`.
     */
    public static numericComparer(a: number, b: number): number {
        return a - b;
    }

    /**
     * Case-sensitive string comparer using `String.prototype.localeCompare`.
     *
     * @remarks
     * Respects the runtime locale. Pass a `locale` and optional `options` for deterministic
     * cross-environment ordering (e.g., `TyneqComparer.localeComparer("en")`).
     *
     * @param locale - BCP 47 language tag(s) forwarded to `localeCompare`.
     * @param options - `Intl.CollatorOptions` forwarded to `localeCompare`.
     */
    public static localeComparer(locale?: string | string[], options?: Intl.CollatorOptions): Comparer<string> {
        return (a, b) => a.localeCompare(b, locale, options);
    }

    /**
     * Case-insensitive string equality comparer.
     *
     * @remarks
     * Converts both values to lower-case before comparing with `===`.
     * Use {@link localeComparer} with `{ sensitivity: "base" }` for locale-aware case-insensitivity.
     */
    public static caseInsensitiveEqualityComparer(a: string, b: string): boolean {
        return a.toLowerCase() === b.toLowerCase();
    }
}
