import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentError, ArgumentNullError, ArgumentTypeError } from "../../../src";

describe("Tyneq.from", () => {
    describe("normal usage", () => {
        it("wraps an array into a sequence", () => {
            expect(Tyneq.from([1, 2, 3]).toArray()).toEqual([1, 2, 3]);
        });

        it("wraps a Set into a sequence", () => {
            expect(Tyneq.from(new Set([1, 2, 3])).toArray()).toEqual([1, 2, 3]);
        });

        it("wraps a Map into a sequence of entries", () => {
            const map = new Map([["a", 1], ["b", 2]]);
            expect(Tyneq.from(map).toArray()).toEqual([["a", 1], ["b", 2]]);
        });

        it("wraps a string into a sequence of characters", () => {
            expect(Tyneq.from("abc").toArray()).toEqual(["a", "b", "c"]);
        });

        it("wraps a generator into a sequence", () => {
            function* gen() { yield 10; yield 20; }
            expect(Tyneq.from(gen()).toArray()).toEqual([10, 20]);
        });

        it("preserves element order", () => {
            expect(Tyneq.from([3, 1, 4, 1, 5]).toArray()).toEqual([3, 1, 4, 1, 5]);
        });
    });

    describe("edge cases", () => {
        it("wraps an empty array into an empty sequence", () => {
            expect(Tyneq.from([]).toArray()).toEqual([]);
        });

        it("wraps an empty Set into an empty sequence", () => {
            expect(Tyneq.from(new Set()).toArray()).toEqual([]);
        });

        it("is re-iterable when backed by an array", () => {
            const seq = Tyneq.from([1, 2, 3]);
            expect(seq.toArray()).toEqual([1, 2, 3]);
            expect(seq.toArray()).toEqual([1, 2, 3]);
        });

        it("supports chaining operators", () => {
            expect(Tyneq.from([1, 2, 3, 4]).where((x) => x % 2 === 0).toArray()).toEqual([2, 4]);
        });
    });

    describe("invalid arguments", () => {
        it("throws ArgumentNullError when source is null", () => {
            expect(() => Tyneq.from(null as any)).toThrow(ArgumentNullError);
        });

        it("throws ArgumentError when source is undefined", () => {
            expect(() => Tyneq.from(undefined as any)).toThrow(ArgumentError);
        });

        it("throws ArgumentTypeError when source is not iterable", () => {
            expect(() => Tyneq.from(42 as any)).toThrow(ArgumentTypeError);
        });

        it("throws ArgumentTypeError when source is a plain object", () => {
            expect(() => Tyneq.from({} as any)).toThrow(ArgumentTypeError);
        });
    });
});
