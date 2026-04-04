import type { Enumerable, Enumerator } from "../types/core";

/**
 * Type guard predicates for Tyneq's core protocol types.
 *
 * @group Utilities
 */
export class TypeGuardUtility {
    private constructor() { }

    
    public static isIterable<T = unknown>(value: unknown): value is Iterable<T> {
        return value !== null
            && value !== undefined
            && typeof (value as { [Symbol.iterator]?: unknown })[Symbol.iterator] === "function";
    }

    
    public static isIterator<T = unknown>(value: unknown): value is Iterator<T> {
        const valueType = typeof value;

        return value !== null
            && (valueType === "object" || valueType === "function")
            && typeof (value as { next?: unknown }).next === "function";
    }

    
    public static isIterableIterator<T = unknown>(value: unknown): value is IterableIterator<T> {
        return this.isIterable<T>(value) && this.isIterator<T>(value);
    }

    
    public static isEnumerator<T = unknown>(value: unknown): value is Enumerator<T> {
        if (!this.isIterator<T>(value)) return false;

        const candidate = value as { return?: unknown; throw?: unknown };
        return (candidate.return === undefined || typeof candidate.return === "function")
            && (candidate.throw === undefined || typeof candidate.throw === "function");
    }

    
    public static isEnumerable<T = unknown>(value: unknown): value is Enumerable<T> {
        if (value === null || value === undefined) return false;

        const candidate = value as { getEnumerator?: unknown };
        return this.isIterable<T>(value)
            && typeof candidate.getEnumerator === "function";
    }
}
