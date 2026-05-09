import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentOutOfRangeError, ArgumentError } from "../../../src";

describe("Tyneq.range", () => {
    describe("normal usage", () => {
        it("produces count consecutive integers starting from start", () => {
            expect(Tyneq.range(1, 5).toArray()).toEqual([1, 2, 3, 4, 5]);
        });

        it("works with a start of 0", () => {
            expect(Tyneq.range(0, 4).toArray()).toEqual([0, 1, 2, 3]);
        });

        it("works with a negative start", () => {
            expect(Tyneq.range(-3, 4).toArray()).toEqual([-3, -2, -1, 0]);
        });

        it("produces a sequence of the correct length", () => {
            expect(Tyneq.range(10, 7).toArray()).toHaveLength(7);
        });
    });

    describe("edge cases", () => {
        it("returns an empty sequence when count is 0", () => {
            expect(Tyneq.range(5, 0).toArray()).toEqual([]);
        });

        it("returns a single-element sequence when count is 1", () => {
            expect(Tyneq.range(42, 1).toArray()).toEqual([42]);
        });

        it("is re-iterable", () => {
            const seq = Tyneq.range(1, 3);
            expect(seq.toArray()).toEqual([1, 2, 3]);
            expect(seq.toArray()).toEqual([1, 2, 3]);
        });
    });

    describe("invalid arguments", () => {
        it("throws ArgumentOutOfRangeError when count is negative", () => {
            expect(() => Tyneq.range(0, -1)).toThrow(ArgumentOutOfRangeError);
        });

        it("throws ArgumentError when count is a non-integer", () => {
            expect(() => Tyneq.range(0, 1.5)).toThrow(ArgumentError);
        });
    });
});
