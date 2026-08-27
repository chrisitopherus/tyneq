import { describe, expect, it } from "vitest";
import { InvalidOperationError } from "../../../src";
import { EnumeratorUtility } from "../../../src/plugin";

describe("EnumeratorUtility.isOneShotIterable", () => {
    it("returns true for a generator object", () => {
        function* gen() { yield 1; }
        expect(EnumeratorUtility.isOneShotIterable(gen())).toBe(true);
    });

    it("returns true for Map.prototype.entries()", () => {
        const map = new Map([["a", 1]]);
        expect(EnumeratorUtility.isOneShotIterable(map.entries())).toBe(true);
    });

    it("returns false for an array", () => {
        expect(EnumeratorUtility.isOneShotIterable([1, 2, 3])).toBe(false);
    });

    it("returns false for a Set", () => {
        expect(EnumeratorUtility.isOneShotIterable(new Set([1, 2]))).toBe(false);
    });

    it("returns false for a Map itself (not its .entries() result)", () => {
        expect(EnumeratorUtility.isOneShotIterable(new Map([["a", 1]]))).toBe(false);
    });

    it("returns false for a custom iterable whose [Symbol.iterator]() returns a fresh iterator", () => {
        const values = [1, 2, 3];
        const customIterable: Iterable<number> = {
            [Symbol.iterator]: () => values[Symbol.iterator]()
        };
        expect(EnumeratorUtility.isOneShotIterable(customIterable)).toBe(false);
    });

    it("does not consume the iterable (calling it does not advance iteration)", () => {
        function* gen() { yield 1; yield 2; }
        const g = gen();
        EnumeratorUtility.isOneShotIterable(g);
        EnumeratorUtility.isOneShotIterable(g);
        expect([...g]).toEqual([1, 2]);
    });
});

describe("EnumeratorUtility.guardReiterable", () => {
    it("returns the same reference unchanged for an ordinary array", () => {
        const array = [1, 2, 3];
        expect(EnumeratorUtility.guardReiterable(array, "source")).toBe(array);
    });

    it("returns the same reference unchanged for a Set", () => {
        const set = new Set([1, 2, 3]);
        expect(EnumeratorUtility.guardReiterable(set, "source")).toBe(set);
    });

    it("allows the first [Symbol.iterator]() call on a one-shot iterable to fully iterate", () => {
        function* gen() { yield 1; yield 2; }
        const guarded = EnumeratorUtility.guardReiterable(gen(), "source");
        expect([...guarded]).toEqual([1, 2]);
    });

    it("throws InvalidOperationError on the second [Symbol.iterator]() call for a one-shot iterable", () => {
        function* gen() { yield 1; yield 2; }
        const guarded = EnumeratorUtility.guardReiterable(gen(), "source");

        expect([...guarded]).toEqual([1, 2]);
        expect(() => guarded[Symbol.iterator]()).toThrow(InvalidOperationError);
    });

    it("includes the given paramName in the thrown error's message", () => {
        function* gen() { yield 1; }
        const guarded = EnumeratorUtility.guardReiterable(gen(), "myParam");

        [...guarded];
        expect(() => guarded[Symbol.iterator]()).toThrow(/myParam/);
    });

    it("does not throw on the first call, only subsequent calls", () => {
        function* gen() { yield 1; }
        const guarded = EnumeratorUtility.guardReiterable(gen(), "source");
        expect(() => guarded[Symbol.iterator]()).not.toThrow();
        expect(() => guarded[Symbol.iterator]()).toThrow(InvalidOperationError);
    });

    it("wrapped iterable remains re-iterable indefinitely for a re-iterable input", () => {
        const array = [1, 2, 3];
        const guarded = EnumeratorUtility.guardReiterable(array, "source");
        expect([...guarded]).toEqual([1, 2, 3]);
        expect([...guarded]).toEqual([1, 2, 3]);
        expect([...guarded]).toEqual([1, 2, 3]);
    });
});
