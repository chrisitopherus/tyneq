
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
     * Works correctly for numbers, strings, dates, and any type that supports the relational operators.
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
     * Use this to invert any custom comparer -- for example, to sort by a locale-aware comparer
     * in descending order without rewriting it.
     *
     * @example
     * ```ts
     * const desc = TyneqComparer.reverse(TyneqComparer.createLocaleComparer("en"));
     * seq.orderBy((s) => s, desc);
     * ```
     */
    public static reverse<T>(comparer: Comparer<T>): Comparer<T> {
        return (a, b) => comparer(b, a);
    }

    /**
     * Returns a locale-aware string comparer backed by `String.prototype.localeCompare`.
     *
     * @remarks
     * Pass a `locale` and optional `options` for deterministic cross-environment ordering.
     * Without arguments the comparer uses the runtime locale, which may vary across environments.
     *
     * @example
     * ```ts
     * seq.orderBy((s) => s, TyneqComparer.createLocaleComparer("en"));
     * ```
     *
     * @param locale - BCP 47 language tag(s) forwarded to `localeCompare`.
     * @param options - `Intl.CollatorOptions` forwarded to `localeCompare`.
     *
     * @see {@link caseInsensitiveComparer} for a zero-config case-insensitive ordering comparer.
     */
    public static createLocaleComparer(locale?: string | string[], options?: Intl.CollatorOptions): Comparer<string> {
        return (a, b) => a.localeCompare(b, locale, options);
    }

    /**
     * Case-insensitive string equality comparer.
     *
     * @remarks
     * Converts both values to lower-case before comparing with `===`.
     * Use {@link createLocaleComparer} with `{ sensitivity: "base" }` for locale-aware case-insensitivity.
     *
     * @see {@link caseInsensitiveComparer} for the ordering (negative/zero/positive) counterpart.
     */
    public static caseInsensitiveEqualityComparer(a: string, b: string): boolean {
        return a.toLowerCase() === b.toLowerCase();
    }

    /**
     * Case-insensitive ordering comparer using `localeCompare` with `sensitivity: "accent"`.
     *
     * @remarks
     * Returns negative when `a` sorts before `b`, positive when `a` sorts after `b`, and `0`
     * when `a` and `b` are equal ignoring case. Accented characters are treated as distinct
     * (e.g. "e" and "e-with-accent" are not equal), but "apple" and "Apple" compare as equal.
     *
     * @example
     * ```ts
     * seq.orderBy((s) => s, TyneqComparer.caseInsensitiveComparer)
     * ```
     *
     * @see {@link caseInsensitiveEqualityComparer} for the boolean equality counterpart.
     * @see {@link createLocaleComparer} for full locale and collation control.
     */
    public static caseInsensitiveComparer(a: string, b: string): number {
        return a.localeCompare(b, undefined, { sensitivity: "accent" });
    }
}
