import { describe, expect, it } from "vitest";
import { NullGuards } from "../../../src/utility/guards/NullGuards";
import { StringGuards } from "../../../src/utility/guards/StringGuards";
import { NumericGuards } from "../../../src/utility/guards/NumericGuards";
import { TypeGuards } from "../../../src/utility/guards/TypeGuards";
import { TypeGuardUtility } from "../../../src/utility/TypeGuardUtility";
import { ArgumentNullError } from "../../../src/core/errors/argument/ArgumentNullError";
import { ArgumentError } from "../../../src/core/errors/argument/ArgumentError";
import { ArgumentOutOfRangeError } from "../../../src/core/errors/argument/ArgumentOutOfRangeError";
import { ArgumentTypeError } from "../../../src/core/errors/argument/ArgumentTypeError";

// --- NullGuards ---

describe("NullGuards", () => {
    describe("checkNotNull", () => {
        it("does not throw for a non-null value", () => {
            expect(() => NullGuards.checkNotNull(0, "x")).not.toThrow();
            expect(() => NullGuards.checkNotNull("", "x")).not.toThrow();
            expect(() => NullGuards.checkNotNull(false, "x")).not.toThrow();
        });

        it("throws ArgumentNullError for null", () => {
            expect(() => NullGuards.checkNotNull(null, "x")).toThrow(ArgumentNullError);
        });
    });

    describe("checkNotUndefined", () => {
        it("does not throw for a defined value", () => {
            expect(() => NullGuards.checkNotUndefined(0, "x")).not.toThrow();
            expect(() => NullGuards.checkNotUndefined(null, "x")).not.toThrow();
        });

        it("throws ArgumentError for undefined", () => {
            expect(() => NullGuards.checkNotUndefined(undefined, "x")).toThrow(ArgumentError);
        });
    });

    describe("checkNotOptional", () => {
        it("does not throw for a non-null non-undefined value", () => {
            expect(() => NullGuards.checkNotOptional(42, "x")).not.toThrow();
        });

        it("throws for null", () => {
            expect(() => NullGuards.checkNotOptional(null, "x")).toThrow(ArgumentNullError);
        });

        it("throws for undefined", () => {
            expect(() => NullGuards.checkNotOptional(undefined, "x")).toThrow(ArgumentError);
        });
    });

    describe("checkNotNullOrEmpty", () => {
        it("does not throw for non-null non-empty value", () => {
            expect(() => NullGuards.checkNotNullOrEmpty([1, 2], "x")).not.toThrow();
            expect(() => NullGuards.checkNotNullOrEmpty("hello", "x")).not.toThrow();
        });

        it("throws ArgumentNullError for null", () => {
            expect(() => NullGuards.checkNotNullOrEmpty(null, "x")).toThrow(ArgumentNullError);
        });

        it("throws ArgumentError for empty", () => {
            expect(() => NullGuards.checkNotNullOrEmpty([], "x")).toThrow(ArgumentError);
            expect(() => NullGuards.checkNotNullOrEmpty("", "x")).toThrow(ArgumentError);
        });
    });

    describe("checkNotOptionalOrEmpty", () => {
        it("does not throw for valid value", () => {
            expect(() => NullGuards.checkNotOptionalOrEmpty("abc", "x")).not.toThrow();
        });

        it("throws for null", () => {
            expect(() => NullGuards.checkNotOptionalOrEmpty(null, "x")).toThrow(ArgumentNullError);
        });

        it("throws for undefined", () => {
            expect(() => NullGuards.checkNotOptionalOrEmpty(undefined, "x")).toThrow(ArgumentError);
        });

        it("throws for empty", () => {
            expect(() => NullGuards.checkNotOptionalOrEmpty("", "x")).toThrow(ArgumentError);
        });
    });
});

// --- StringGuards ---

describe("StringGuards", () => {
    describe("checkNotNullOrWhiteSpace", () => {
        it("does not throw for a non-empty non-whitespace string", () => {
            expect(() => StringGuards.checkNotNullOrWhiteSpace("hello", "s")).not.toThrow();
            expect(() => StringGuards.checkNotNullOrWhiteSpace("  a  ", "s")).not.toThrow();
        });

        it("throws for null", () => {
            expect(() => StringGuards.checkNotNullOrWhiteSpace(null, "s")).toThrow(ArgumentNullError);
        });

        it("throws for undefined", () => {
            expect(() => StringGuards.checkNotNullOrWhiteSpace(undefined, "s")).toThrow(ArgumentError);
        });

        it("throws for empty string", () => {
            expect(() => StringGuards.checkNotNullOrWhiteSpace("", "s")).toThrow(ArgumentError);
        });

        it("throws for whitespace-only string", () => {
            expect(() => StringGuards.checkNotNullOrWhiteSpace("   ", "s")).toThrow(ArgumentError);
            expect(() => StringGuards.checkNotNullOrWhiteSpace("\t\n", "s")).toThrow(ArgumentError);
        });
    });
});

// --- NumericGuards ---

describe("NumericGuards", () => {
    describe("checkNonNegative", () => {
        it("does not throw for 0", () => {
            expect(() => NumericGuards.checkNonNegative(0, "n")).not.toThrow();
        });

        it("does not throw for positive numbers", () => {
            expect(() => NumericGuards.checkNonNegative(1, "n")).not.toThrow();
            expect(() => NumericGuards.checkNonNegative(100.5, "n")).not.toThrow();
        });

        it("throws for negative numbers", () => {
            expect(() => NumericGuards.checkNonNegative(-1, "n")).toThrow(ArgumentOutOfRangeError);
        });

        it("throws for Infinity", () => {
            expect(() => NumericGuards.checkNonNegative(Infinity, "n")).toThrow(ArgumentOutOfRangeError);
        });

        it("throws for NaN", () => {
            expect(() => NumericGuards.checkNonNegative(NaN, "n")).toThrow(ArgumentOutOfRangeError);
        });
    });

    describe("checkPositive", () => {
        it("does not throw for positive numbers", () => {
            expect(() => NumericGuards.checkPositive(1, "n")).not.toThrow();
        });

        it("throws for 0", () => {
            expect(() => NumericGuards.checkPositive(0, "n")).toThrow(ArgumentOutOfRangeError);
        });

        it("throws for negative numbers", () => {
            expect(() => NumericGuards.checkPositive(-1, "n")).toThrow(ArgumentOutOfRangeError);
        });

        it("throws for Infinity", () => {
            expect(() => NumericGuards.checkPositive(Infinity, "n")).toThrow(ArgumentOutOfRangeError);
        });
    });

    describe("checkNegative", () => {
        it("does not throw for negative numbers", () => {
            expect(() => NumericGuards.checkNegative(-1, "n")).not.toThrow();
        });

        it("throws for 0", () => {
            expect(() => NumericGuards.checkNegative(0, "n")).toThrow(ArgumentOutOfRangeError);
        });

        it("throws for positive numbers", () => {
            expect(() => NumericGuards.checkNegative(1, "n")).toThrow(ArgumentOutOfRangeError);
        });
    });

    describe("checkNonPositive", () => {
        it("does not throw for 0", () => {
            expect(() => NumericGuards.checkNonPositive(0, "n")).not.toThrow();
        });

        it("does not throw for negative numbers", () => {
            expect(() => NumericGuards.checkNonPositive(-5, "n")).not.toThrow();
        });

        it("throws for positive numbers", () => {
            expect(() => NumericGuards.checkNonPositive(1, "n")).toThrow(ArgumentOutOfRangeError);
        });
    });

    describe("checkInRange", () => {
        it("does not throw when value is within range", () => {
            expect(() => NumericGuards.checkInRange(5, 1, 10, "n")).not.toThrow();
            expect(() => NumericGuards.checkInRange(1, 1, 10, "n")).not.toThrow();
            expect(() => NumericGuards.checkInRange(10, 1, 10, "n")).not.toThrow();
        });

        it("throws ArgumentOutOfRangeError when value is below range", () => {
            expect(() => NumericGuards.checkInRange(0, 1, 10, "n")).toThrow(ArgumentOutOfRangeError);
        });

        it("throws ArgumentOutOfRangeError when value is above range", () => {
            expect(() => NumericGuards.checkInRange(11, 1, 10, "n")).toThrow(ArgumentOutOfRangeError);
        });

        it("throws ArgumentError when min > max", () => {
            expect(() => NumericGuards.checkInRange(5, 10, 1, "n")).toThrow(ArgumentError);
        });

        it("throws for NaN value", () => {
            expect(() => NumericGuards.checkInRange(NaN, 1, 10, "n")).toThrow(ArgumentOutOfRangeError);
        });
    });

    describe("checkInteger", () => {
        it("does not throw for integers", () => {
            expect(() => NumericGuards.checkInteger(0, "n")).not.toThrow();
            expect(() => NumericGuards.checkInteger(-5, "n")).not.toThrow();
            expect(() => NumericGuards.checkInteger(100, "n")).not.toThrow();
        });

        it("throws for floats", () => {
            expect(() => NumericGuards.checkInteger(1.5, "n")).toThrow(ArgumentError);
        });

        it("throws for NaN", () => {
            expect(() => NumericGuards.checkInteger(NaN, "n")).toThrow(ArgumentError);
        });

        it("throws for Infinity", () => {
            expect(() => NumericGuards.checkInteger(Infinity, "n")).toThrow(ArgumentError);
        });
    });

    describe("checkFinite", () => {
        it("does not throw for finite numbers", () => {
            expect(() => NumericGuards.checkFinite(0, "n")).not.toThrow();
            expect(() => NumericGuards.checkFinite(-100, "n")).not.toThrow();
        });

        it("throws for Infinity", () => {
            expect(() => NumericGuards.checkFinite(Infinity, "n")).toThrow(ArgumentError);
            expect(() => NumericGuards.checkFinite(-Infinity, "n")).toThrow(ArgumentError);
        });

        it("throws for NaN", () => {
            expect(() => NumericGuards.checkFinite(NaN, "n")).toThrow(ArgumentError);
        });
    });

    describe("checkNotNaN", () => {
        it("does not throw for a valid number", () => {
            expect(() => NumericGuards.checkNotNaN(0, "n")).not.toThrow();
            expect(() => NumericGuards.checkNotNaN(Infinity, "n")).not.toThrow();
        });

        it("throws for NaN", () => {
            expect(() => NumericGuards.checkNotNaN(NaN, "n")).toThrow(ArgumentError);
        });
    });

    describe("checkSafeInteger", () => {
        it("does not throw for safe integers", () => {
            expect(() => NumericGuards.checkSafeInteger(0, "n")).not.toThrow();
            expect(() => NumericGuards.checkSafeInteger(Number.MAX_SAFE_INTEGER, "n")).not.toThrow();
        });

        it("throws for floats", () => {
            expect(() => NumericGuards.checkSafeInteger(1.1, "n")).toThrow(ArgumentError);
        });

        it("throws for Number.MAX_SAFE_INTEGER + 1", () => {
            expect(() => NumericGuards.checkSafeInteger(Number.MAX_SAFE_INTEGER + 1, "n")).toThrow(ArgumentError);
        });
    });

    describe("checkArrayIndex", () => {
        it("does not throw for valid index within array bounds", () => {
            expect(() => NumericGuards.checkArrayIndex(0, "i", 5)).not.toThrow();
            expect(() => NumericGuards.checkArrayIndex(4, "i", 5)).not.toThrow();
        });

        it("throws for negative index", () => {
            expect(() => NumericGuards.checkArrayIndex(-1, "i", 5)).toThrow(ArgumentOutOfRangeError);
        });

        it("throws for index equal to array length", () => {
            expect(() => NumericGuards.checkArrayIndex(5, "i", 5)).toThrow(ArgumentOutOfRangeError);
        });

        it("throws for float index", () => {
            expect(() => NumericGuards.checkArrayIndex(1.5, "i", 5)).toThrow(ArgumentError);
        });

        it("works without arrayLength (only requires safe integer >= 0)", () => {
            expect(() => NumericGuards.checkArrayIndex(0, "i")).not.toThrow();
            expect(() => NumericGuards.checkArrayIndex(-1, "i")).toThrow(ArgumentOutOfRangeError);
        });
    });
});

// --- TypeGuards ---

describe("TypeGuards", () => {
    describe("checkFunction", () => {
        it("does not throw for a function", () => {
            expect(() => TypeGuards.checkFunction(() => 1, "fn")).not.toThrow();
        });

        it("throws ArgumentTypeError for non-function values", () => {
            expect(() => TypeGuards.checkFunction(42, "fn")).toThrow(ArgumentTypeError);
            expect(() => TypeGuards.checkFunction("str", "fn")).toThrow(ArgumentTypeError);
            expect(() => TypeGuards.checkFunction(null, "fn")).toThrow(ArgumentTypeError);
        });
    });

    describe("checkIterable", () => {
        it("does not throw for arrays and iterables", () => {
            expect(() => TypeGuards.checkIterable([1, 2, 3], "x")).not.toThrow();
            expect(() => TypeGuards.checkIterable("string", "x")).not.toThrow();
            expect(() => TypeGuards.checkIterable(new Set(), "x")).not.toThrow();
        });

        it("throws for null and undefined", () => {
            expect(() => TypeGuards.checkIterable(null, "x")).toThrow(ArgumentTypeError);
            expect(() => TypeGuards.checkIterable(undefined, "x")).toThrow(ArgumentTypeError);
        });

        it("throws for non-iterable values", () => {
            expect(() => TypeGuards.checkIterable(42, "x")).toThrow(ArgumentTypeError);
            expect(() => TypeGuards.checkIterable({}, "x")).toThrow(ArgumentTypeError);
        });
    });

    describe("checkIterator", () => {
        it("does not throw for an iterator", () => {
            const iter = [1, 2][Symbol.iterator]();
            expect(() => TypeGuards.checkIterator(iter, "x")).not.toThrow();
        });

        it("throws for null", () => {
            expect(() => TypeGuards.checkIterator(null, "x")).toThrow(ArgumentTypeError);
        });

        it("throws for a plain object without next()", () => {
            expect(() => TypeGuards.checkIterator({}, "x")).toThrow(ArgumentTypeError);
        });
    });

    describe("checkEnumerable", () => {
        it("does not throw for a valid Enumerable (has getEnumerator and Symbol.iterator)", () => {
            const enumerable = {
                getEnumerator() { return [][Symbol.iterator](); },
                [Symbol.iterator]() { return [][Symbol.iterator](); },
            };
            expect(() => TypeGuards.checkEnumerable(enumerable, "x")).not.toThrow();
        });

        it("throws ArgumentTypeError for null", () => {
            expect(() => TypeGuards.checkEnumerable(null, "x")).toThrow(ArgumentTypeError);
        });

        it("throws ArgumentTypeError for undefined", () => {
            expect(() => TypeGuards.checkEnumerable(undefined, "x")).toThrow(ArgumentTypeError);
        });

        it("throws ArgumentTypeError for a plain iterable lacking getEnumerator", () => {
            expect(() => TypeGuards.checkEnumerable([1, 2, 3], "x")).toThrow(ArgumentTypeError);
        });
    });

    describe("checkEnumerator", () => {
        it("does not throw for a valid Enumerator (has next())", () => {
            const enumerator = [1, 2][Symbol.iterator]();
            expect(() => TypeGuards.checkEnumerator(enumerator, "x")).not.toThrow();
        });

        it("throws ArgumentTypeError for null", () => {
            expect(() => TypeGuards.checkEnumerator(null, "x")).toThrow(ArgumentTypeError);
        });

        it("throws ArgumentTypeError for undefined", () => {
            expect(() => TypeGuards.checkEnumerator(undefined, "x")).toThrow(ArgumentTypeError);
        });

        it("throws ArgumentTypeError for a plain object without next()", () => {
            expect(() => TypeGuards.checkEnumerator({}, "x")).toThrow(ArgumentTypeError);
        });
    });

    describe("checkInstanceOf", () => {
        it("does not throw when value is an instance of the constructor", () => {
            expect(() => TypeGuards.checkInstanceOf(new Date(), Date, "d")).not.toThrow();
        });

        it("throws ArgumentTypeError when value is not an instance", () => {
            expect(() => TypeGuards.checkInstanceOf("not a date", Date, "d")).toThrow(ArgumentTypeError);
        });

        it("throws for null", () => {
            expect(() => TypeGuards.checkInstanceOf(null, Date, "d")).toThrow(ArgumentTypeError);
        });
    });

    describe("checkHasLength", () => {
        it("does not throw for array-like objects with numeric length", () => {
            expect(() => TypeGuards.checkHasLength([1, 2], "x")).not.toThrow();
            expect(() => TypeGuards.checkHasLength({ length: 3 }, "x")).not.toThrow();
        });

        it("throws for primitives", () => {
            expect(() => TypeGuards.checkHasLength(42 as any, "x")).toThrow(ArgumentTypeError);
        });

        it("throws for null", () => {
            expect(() => TypeGuards.checkHasLength(null as any, "x")).toThrow(ArgumentTypeError);
        });

        it("throws for objects without a numeric length", () => {
            expect(() => TypeGuards.checkHasLength({ length: "not a number" } as any, "x")).toThrow(ArgumentTypeError);
        });
    });

    describe("check (predicate-based)", () => {
        it("does not throw when predicate returns true", () => {
            expect(() => TypeGuards.check(5, "n", (v) => v > 0, "must be positive")).not.toThrow();
        });

        it("throws ArgumentError when predicate returns false", () => {
            expect(() => TypeGuards.check(-1, "n", (v) => v > 0, "must be positive")).toThrow(ArgumentError);
        });
    });
});

// --- TypeGuardUtility ---

describe("TypeGuardUtility", () => {
    describe("isIterable", () => {
        it("returns true for arrays", () => {
            expect(TypeGuardUtility.isIterable([1, 2])).toBe(true);
        });

        it("returns true for strings", () => {
            expect(TypeGuardUtility.isIterable("hello")).toBe(true);
        });

        it("returns true for Set and Map", () => {
            expect(TypeGuardUtility.isIterable(new Set())).toBe(true);
            expect(TypeGuardUtility.isIterable(new Map())).toBe(true);
        });

        it("returns false for null", () => {
            expect(TypeGuardUtility.isIterable(null)).toBe(false);
        });

        it("returns false for undefined", () => {
            expect(TypeGuardUtility.isIterable(undefined)).toBe(false);
        });

        it("returns false for plain objects", () => {
            expect(TypeGuardUtility.isIterable({})).toBe(false);
        });
    });

    describe("isIterator", () => {
        it("returns true for an array iterator", () => {
            expect(TypeGuardUtility.isIterator([1, 2][Symbol.iterator]())).toBe(true);
        });

        it("returns true for a generator", () => {
            function* gen() { yield 1; }
            expect(TypeGuardUtility.isIterator(gen())).toBe(true);
        });

        it("returns false for null", () => {
            expect(TypeGuardUtility.isIterator(null)).toBe(false);
        });

        it("returns false for objects without next()", () => {
            expect(TypeGuardUtility.isIterator({})).toBe(false);
        });
    });

    describe("isIterableIterator", () => {
        it("returns true for a generator (both iterable and iterator)", () => {
            function* gen() { yield 1; }
            expect(TypeGuardUtility.isIterableIterator(gen())).toBe(true);
        });

        it("returns false for a plain array (iterable but not an iterator)", () => {
            expect(TypeGuardUtility.isIterableIterator([1, 2])).toBe(false);
        });
    });

    describe("isEnumerator", () => {
        it("returns true for an object with a next() function", () => {
            const enumerator = { next: () => ({ value: 1, done: false }) };
            expect(TypeGuardUtility.isEnumerator(enumerator)).toBe(true);
        });

        it("returns true for an object with next() and optional return()", () => {
            const enumerator = {
                next: () => ({ value: undefined, done: true }),
                return: () => ({ value: undefined, done: true }),
            };
            expect(TypeGuardUtility.isEnumerator(enumerator)).toBe(true);
        });

        it("returns false when throw is present but not a function", () => {
            const enumerator = {
                next: () => ({ value: 1, done: false }),
                throw: "not a function",
            };
            expect(TypeGuardUtility.isEnumerator(enumerator)).toBe(false);
        });

        it("returns false for null", () => {
            expect(TypeGuardUtility.isEnumerator(null)).toBe(false);
        });
    });

    describe("isEnumerable", () => {
        it("returns true for an object with getEnumerator() and Symbol.iterator", () => {
            const enumerable = {
                getEnumerator: () => ({ next: () => ({ value: undefined, done: true }) }),
                [Symbol.iterator]: function* () { },
            };
            expect(TypeGuardUtility.isEnumerable(enumerable)).toBe(true);
        });

        it("returns false for null", () => {
            expect(TypeGuardUtility.isEnumerable(null)).toBe(false);
        });

        it("returns false for undefined", () => {
            expect(TypeGuardUtility.isEnumerable(undefined)).toBe(false);
        });

        it("returns false for an iterable without getEnumerator", () => {
            expect(TypeGuardUtility.isEnumerable([1, 2, 3])).toBe(false);
        });

        it("returns false for an object with getEnumerator but no Symbol.iterator", () => {
            expect(TypeGuardUtility.isEnumerable({ getEnumerator: () => null })).toBe(false);
        });
    });
});
