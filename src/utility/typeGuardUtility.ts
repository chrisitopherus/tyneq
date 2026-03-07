import type { IEnumerable, IEnumerator } from "../types/core";

/**
 * Internal type-guard predicates for runtime shape checking of iterator-protocol values.
 *
 * @remarks
 * Static utility class; cannot be instantiated. All methods are pure predicates with no side
 * effects. Used by {@link ArgumentUtility} to validate that arguments conform to the expected
 * iterator-protocol interfaces before they enter enumerable pipelines.
 *
 * @group Utilities
 * @internal
 */
export class TypeGuardUtility {
    private constructor() { }

    /**
     * Returns `true` if `value` implements `Iterable<T>`.
     *
     * @remarks
     * Checks that `value` is non-null, non-undefined, and has a callable `[Symbol.iterator]`
     * property. Does not invoke the iterator.
     *
     * @param value - The value to test.
     */
    public static isIterable<T = unknown>(value: unknown): value is Iterable<T> {
        return value !== null
            && value !== undefined
            && typeof (value as { [Symbol.iterator]?: unknown })[Symbol.iterator] === 'function';
    }

    /**
     * Returns `true` if `value` implements `Iterator<T>`.
     *
     * @remarks
     * Checks that `value` is a non-null object or function with a callable `next` property.
     *
     * @param value - The value to test.
     */
    public static isIterator<T = unknown>(value: unknown): value is Iterator<T> {
        const valueType = typeof value;

        return value !== null
            && (valueType === 'object' || valueType === 'function')
            && typeof (value as { next?: unknown }).next === 'function';
    }

    /**
     * Returns `true` if `value` implements both `Iterable<T>` and `Iterator<T>`.
     *
     * @param value - The value to test.
     */
    public static isIterableIterator<T = unknown>(value: unknown): value is IterableIterator<T> {
        return this.isIterable<T>(value) && this.isIterator<T>(value);
    }

    /**
     * Returns `true` if `value` satisfies the {@link IEnumerator} contract.
     *
     * @remarks
     * Checks that `value` is an `Iterator<T>` whose optional `return` and `throw` properties,
     * if present, are functions.
     *
     * @param value - The value to test.
     */
    public static isEnumerator<T = unknown>(value: unknown): value is IEnumerator<T> {
        if (!this.isIterator<T>(value)) return false;

        const candidate = value as { return?: unknown; throw?: unknown };
        return (candidate.return === undefined || typeof candidate.return === 'function')
            && (candidate.throw === undefined || typeof candidate.throw === 'function');
    }

    /**
     * Returns `true` if `value` satisfies the {@link IEnumerable} contract.
     *
     * @remarks
     * Checks that `value` is a non-null `Iterable<T>` that also has a callable `getEnumerator`
     * property.
     *
     * @param value - The value to test.
     */
    public static isEnumerable<T = unknown>(value: unknown): value is IEnumerable<T> {
        if (value === null || value === undefined) return false;

        const candidate = value as { getEnumerator?: unknown };
        return this.isIterable<T>(value)
            && typeof candidate.getEnumerator === 'function';
    }
}
