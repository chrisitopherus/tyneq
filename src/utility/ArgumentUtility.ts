import type { KeyValuePair } from "../types/core";
import type { HasLength, Nullable, Optional, Maybe } from "../types/utility";
import { extractParameter } from "./guards/extractParameter";
import { NullGuards } from "./guards/NullGuards";
import { StringGuards } from "./guards/StringGuards";
import { NumericGuards } from "./guards/NumericGuards";
import { TypeGuards } from "./guards/TypeGuards";
import type { Enumerable, Enumerator } from "../types/core";

/**
 * Facade for all argument validation guards.
 *
 * Every method accepts either a single-property object (`{ count }`) - where the
 * property name becomes the error message's parameter name - or a raw value with
 * an explicit `paramName` string. Prefer the object form; the name is inferred
 * automatically via `nameof`.
 *
 * @example
 * ```ts
 * import { ArgumentUtility } from "tyneq/utility";
 *
 * function take(count: number) {
 *     ArgumentUtility.checkNonNegative({ count });   // throws ArgumentOutOfRangeError if count < 0
 *     ArgumentUtility.checkInteger({ count });       // throws ArgumentError if count is not an integer
 * }
 * ```
 *
 * @group Utilities
 */
export class ArgumentUtility {
    private constructor() { }

    // --- Null guards ---

    
    public static checkNotNull<T>(param: Record<string, Nullable<T>>): asserts param is Record<string, T>;
    public static checkNotNull<T>(param: Nullable<T>, paramName: string): asserts param is T;
    public static checkNotNull<T>(param: Record<string, Nullable<T>> | Nullable<T>, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        NullGuards.checkNotNull(value, key);
    }

    
    public static checkNotUndefined<T>(param: Record<string, Maybe<T>>): asserts param is Record<string, T>;
    public static checkNotUndefined<T>(param: Maybe<T>, paramName: string): asserts param is T;
    public static checkNotUndefined<T>(param: Record<string, Maybe<T>> | Maybe<T>, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        NullGuards.checkNotUndefined(value, key);
    }

    
    public static checkNotOptional<T>(param: Record<string, Optional<T>>): asserts param is Record<string, T>;
    public static checkNotOptional<T>(param: Optional<T>, paramName: string): asserts param is T;
    public static checkNotOptional<T>(param: Record<string, Optional<T>> | Optional<T>, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        NullGuards.checkNotOptional(value, key);
    }

    
    public static checkNotNullOrEmpty<T extends HasLength>(param: Record<string, Nullable<T>>): asserts param is Record<string, T>;
    public static checkNotNullOrEmpty<T extends HasLength>(param: Nullable<T>, paramName: string): asserts param is T;
    public static checkNotNullOrEmpty<T extends HasLength>(param: Record<string, Nullable<T>> | Nullable<T>, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        NullGuards.checkNotNullOrEmpty(value, key);
    }

    
    public static checkNotOptionalOrEmpty<T extends HasLength>(param: Record<string, Optional<T>>): asserts param is Record<string, T>;
    public static checkNotOptionalOrEmpty<T extends HasLength>(param: Optional<T>, paramName: string): asserts param is T;
    public static checkNotOptionalOrEmpty<T extends HasLength>(param: Record<string, Optional<T>> | Optional<T>, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        NullGuards.checkNotOptionalOrEmpty(value, key);
    }

    // --- String guards ---

    
    public static checkNotNullOrWhiteSpace(param: Record<string, Optional<string>>): asserts param is Record<string, string>;
    public static checkNotNullOrWhiteSpace(param: Optional<string>, paramName: string): asserts param is string;
    public static checkNotNullOrWhiteSpace(param: Record<string, Optional<string>> | Optional<string>, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        StringGuards.checkNotNullOrWhiteSpace(value, key);
    }

    // --- Numeric guards ---

    
    public static checkNonNegative(param: Record<string, number>): void;
    public static checkNonNegative(param: number, paramName: string): void;
    public static checkNonNegative(param: Record<string, number> | number, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        NumericGuards.checkNonNegative(value, key);
    }

    
    public static checkPositive(param: Record<string, number>): void;
    public static checkPositive(param: number, paramName: string): void;
    public static checkPositive(param: Record<string, number> | number, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        NumericGuards.checkPositive(value, key);
    }

    
    public static checkNegative(param: Record<string, number>): void;
    public static checkNegative(param: number, paramName: string): void;
    public static checkNegative(param: Record<string, number> | number, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        NumericGuards.checkNegative(value, key);
    }

    
    public static checkNonPositive(param: Record<string, number>): void;
    public static checkNonPositive(param: number, paramName: string): void;
    public static checkNonPositive(param: Record<string, number> | number, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        NumericGuards.checkNonPositive(value, key);
    }

    
    public static checkInRange(param: Record<string, number>, min: number, max: number): void;
    public static checkInRange(param: number, min: number, max: number, paramName: string): void;
    public static checkInRange(param: Record<string, number> | number, min: number, max: number, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        NumericGuards.checkInRange(value, min, max, key);
    }

    
    public static checkInteger(param: Record<string, number>): void;
    public static checkInteger(param: number, paramName: string): void;
    public static checkInteger(param: Record<string, number> | number, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        NumericGuards.checkInteger(value, key);
    }

    
    public static checkFinite(param: Record<string, number>): void;
    public static checkFinite(param: number, paramName: string): void;
    public static checkFinite(param: Record<string, number> | number, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        NumericGuards.checkFinite(value, key);
    }

    
    public static checkNotNaN(param: Record<string, number>): void;
    public static checkNotNaN(param: number, paramName: string): void;
    public static checkNotNaN(param: Record<string, number> | number, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        NumericGuards.checkNotNaN(value, key);
    }

    
    public static checkSafeInteger(param: Record<string, number>): void;
    public static checkSafeInteger(param: number, paramName: string): void;
    public static checkSafeInteger(param: Record<string, number> | number, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        NumericGuards.checkSafeInteger(value, key);
    }

    
    public static checkArrayIndex(param: Record<string, number>, arrayLength?: number): void;
    public static checkArrayIndex(param: number, paramName: string, arrayLength?: number): void;
    public static checkArrayIndex(
        param: Record<string, number> | number,
        paramNameOrArrayLength?: string | number,
        arrayLength?: number
    ): void {
        const hasExplicitParamName = typeof paramNameOrArrayLength === "string";
        const { key, value } = hasExplicitParamName
            ? this.extractParameter(param as number, paramNameOrArrayLength)
            : this.extractParameter(param as Record<string, number>);
        const resolvedArrayLength = hasExplicitParamName ? arrayLength : paramNameOrArrayLength as Maybe<number>;
        NumericGuards.checkArrayIndex(value, key, resolvedArrayLength);
    }

    // --- Type guards ---

    
     
    public static checkFunction(param: Record<string, unknown>): asserts param is Record<string, Function>;
     
    public static checkFunction(param: unknown, paramName: string): asserts param is Function;
    public static checkFunction(param: Record<string, unknown> | unknown, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        TypeGuards.checkFunction(value, key);
    }

    
    public static checkIterable<T = unknown>(param: Record<string, unknown>): asserts param is Record<string, Iterable<T>>;
    public static checkIterable<T = unknown>(param: unknown, paramName: string): asserts param is Iterable<T>;
    public static checkIterable<T = unknown>(param: Record<string, unknown> | unknown, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        TypeGuards.checkIterable<T>(value, key);
    }

    
    public static checkIterator<T = unknown>(param: Record<string, unknown>): asserts param is Record<string, Iterator<T>>;
    public static checkIterator<T = unknown>(param: unknown, paramName: string): asserts param is Iterator<T>;
    public static checkIterator<T = unknown>(param: Record<string, unknown> | unknown, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        TypeGuards.checkIterator<T>(value, key);
    }

    
    public static checkEnumerable<T = unknown>(param: Record<string, unknown>): asserts param is Record<string, Enumerable<T>>;
    public static checkEnumerable<T = unknown>(param: unknown, paramName: string): asserts param is Enumerable<T>;
    public static checkEnumerable<T = unknown>(param: Record<string, unknown> | unknown, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        TypeGuards.checkEnumerable<T>(value, key);
    }

    
    public static checkEnumerator<T = unknown>(param: Record<string, unknown>): asserts param is Record<string, Enumerator<T>>;
    public static checkEnumerator<T = unknown>(param: unknown, paramName: string): asserts param is Enumerator<T>;
    public static checkEnumerator<T = unknown>(param: Record<string, unknown> | unknown, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        TypeGuards.checkEnumerator<T>(value, key);
    }

    
    public static checkInstanceOf<T>(
        param: Record<string, unknown>,
        constructor: new (...args: any[]) => T
    ): asserts param is Record<string, T>;
    public static checkInstanceOf<T>(
        param: unknown,
        constructor: new (...args: any[]) => T,
        paramName: string
    ): asserts param is T;
    public static checkInstanceOf<T>(
        param: Record<string, unknown> | unknown,
        constructor: new (...args: any[]) => T,
        paramName?: string
    ): void {
        const { key, value } = this.extractParameter(param, paramName);
        TypeGuards.checkInstanceOf(value, constructor, key);
    }

    
    public static checkHasLength(param: Record<string, unknown>): asserts param is Record<string, HasLength>;
    public static checkHasLength(param: unknown, paramName: string): asserts param is HasLength;
    public static checkHasLength(param: Record<string, unknown> | unknown, paramName?: string): void {
        const { key, value } = this.extractParameter(param, paramName);
        TypeGuards.checkHasLength(value, key);
    }

    
    public static check<T>(
        param: Record<string, T>,
        predicate: (v: T) => boolean,
        message: string
    ): void;
    public static check<T>(
        param: T,
        paramName: string,
        predicate: (v: T) => boolean,
        message: string
    ): void;
    public static check<T>(
        param: Record<string, T> | T,
        paramNameOrPredicate: string | ((v: T) => boolean),
        predicateOrMessage: ((v: T) => boolean) | string,
        message?: string
    ): void {
        const hasExplicitParamName = typeof paramNameOrPredicate === "string";
        const predicate = (hasExplicitParamName ? predicateOrMessage : paramNameOrPredicate) as (v: T) => boolean;
        const validationMessage = (hasExplicitParamName ? message : predicateOrMessage) as string;
        const { key, value } = hasExplicitParamName
            ? this.extractParameter(param as T, paramNameOrPredicate)
            : this.extractParameter(param as Record<string, T>);
        TypeGuards.check(value, key, predicate, validationMessage);
    }

    // --- Infrastructure ---

    
    public static extractParameter<T>(param: Record<string, T>): KeyValuePair<string, T>;
    public static extractParameter<T>(param: T, paramName: string): KeyValuePair<string, T>;
    public static extractParameter<T>(param: Record<string, T> | T, paramName?: string): KeyValuePair<string, T>;
    public static extractParameter<T>(param: Record<string, T> | T, paramName?: string): KeyValuePair<string, T> {
        return extractParameter(param as any, paramName as any);
    }
}
