import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentError, ArgumentNullError, ArgumentTypeError } from "../../../src";

describe("Tyneq.enumerate", () => {
    describe("normal usage", () => {
        it("pairs each element with its zero-based index", () => {
            expect(Tyneq.from(Tyneq.enumerate(["a", "b", "c"])).toArray()).toEqual([
                [0, "a"],
                [1, "b"],
                [2, "c"]
            ]);
        });

        it("indices start at 0", () => {
            const [[first]] = Tyneq.from(Tyneq.enumerate(["x"])).toArray();
            expect(first).toBe(0);
        });

        it("works with numeric values", () => {
            expect(Tyneq.from(Tyneq.enumerate([10, 20, 30])).toArray()).toEqual([
                [0, 10],
                [1, 20],
                [2, 30]
            ]);
        });

        it("works with a Set (insertion order)", () => {
            expect(Tyneq.from(Tyneq.enumerate(new Set(["a", "b"]))).toArray()).toEqual([
                [0, "a"],
                [1, "b"]
            ]);
        });
    });

    describe("edge cases", () => {
        it("returns an empty sequence for an empty array", () => {
            expect(Tyneq.from(Tyneq.enumerate([])).toArray()).toEqual([]);
        });

        it("returns a single pair for a single-element array", () => {
            expect(Tyneq.from(Tyneq.enumerate(["only"])).toArray()).toEqual([[0, "only"]]);
        });

        it("is re-iterable with independent index counters", () => {
            const seq = Tyneq.enumerate(["a", "b"]);
            expect(Tyneq.from(seq).toArray()).toEqual([[0, "a"], [1, "b"]]);
            expect(Tyneq.from(seq).toArray()).toEqual([[0, "a"], [1, "b"]]);
        });
    });

    describe("invalid arguments", () => {
        it("throws ArgumentNullError when source is null", () => {
            expect(() => Tyneq.enumerate(null as any)).toThrow(ArgumentNullError);
        });

        it("throws ArgumentError when source is undefined", () => {
            expect(() => Tyneq.enumerate(undefined as any)).toThrow(ArgumentError);
        });

        it("throws ArgumentTypeError when source is not iterable", () => {
            expect(() => Tyneq.enumerate(42 as any)).toThrow(ArgumentTypeError);
        });
    });
});
