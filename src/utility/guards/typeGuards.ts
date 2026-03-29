import { ArgumentError } from "../../core/errors/argument/ArgumentError";
import { ArgumentTypeError } from "../../core/errors/argument/ArgumentTypeError";
import type { Enumerable, Enumerator } from "../../types/core";
import type { HasLength } from "../../types/utility";
import { TypeGuardUtility } from "../typeGuardUtility";

/**
 * Type-checking guard implementations. Called by `ArgumentUtility`.
 *
 * @internal
 */
export class TypeGuards {
    private constructor() { }

    
    public static checkFunction(value: unknown, paramName: string): asserts value is Function {
        if (typeof value !== "function") {
            throw new ArgumentTypeError(paramName, "function", typeof value);
        }
    }

    
    public static checkIterable<T = unknown>(value: unknown, paramName: string): asserts value is Iterable<T> {
        if (!TypeGuardUtility.isIterable<T>(value)) {
            const actualType = value === null ? "null" : value === undefined ? "undefined" : typeof value;
            throw new ArgumentTypeError(paramName, "iterable", actualType);
        }
    }

    
    public static checkIterator<T = unknown>(value: unknown, paramName: string): asserts value is Iterator<T> {
        if (!TypeGuardUtility.isIterator<T>(value)) {
            const actualType = value === null ? "null" : value === undefined ? "undefined" : typeof value;
            throw new ArgumentTypeError(paramName, "iterator", actualType);
        }
    }

    
    public static checkEnumerable<T = unknown>(value: unknown, paramName: string): asserts value is Enumerable<T> {
        if (!TypeGuardUtility.isEnumerable<T>(value)) {
            const actualType = value === null ? "null" : value === undefined ? "undefined" : typeof value;
            throw new ArgumentTypeError(paramName, "Enumerable", actualType);
        }
    }

    
    public static checkEnumerator<T = unknown>(value: unknown, paramName: string): asserts value is Enumerator<T> {
        if (!TypeGuardUtility.isEnumerator<T>(value)) {
            const actualType = value === null ? "null" : value === undefined ? "undefined" : typeof value;
            throw new ArgumentTypeError(paramName, "Enumerator", actualType);
        }
    }

    
    public static checkInstanceOf<T>(
        value: unknown,
        constructor: new (...args: any[]) => T,
        paramName: string
    ): asserts value is T {
        if (!(value instanceof constructor)) {
            const constructorName = constructor.name || "unknown";
            const actualType = value === null ? "null" : value === undefined ? "undefined" : typeof value;
            throw new ArgumentTypeError(paramName, constructorName, actualType);
        }
    }

    
    public static checkHasLength(value: unknown, paramName: string): asserts value is HasLength {
        if (typeof value !== "object" || value === null || typeof (value as any).length !== "number") {
            throw new ArgumentTypeError(paramName, "object with numeric length property", typeof value);
        }
    }

    
    public static check<T>(value: T, paramName: string, predicate: (v: T) => boolean, message: string): void {
        if (!predicate(value)) {
            throw new ArgumentError(message, paramName);
        }
    }
}
