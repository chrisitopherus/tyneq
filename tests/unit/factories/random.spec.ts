import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentOutOfRangeError, ArgumentNullError, ArgumentError } from "../../../src";

describe("Tyneq.random", () => {
    describe("normal usage", () => {
        it("produces the specified number of elements", () => {
            expect(Tyneq.random(5, () => 1).toArray()).toHaveLength(5);
        });

        it("calls the randomizer once per element", () => {
            let calls = 0;
            Tyneq.random(4, () => ++calls).toArray();
            expect(calls).toBe(4);
        });

        it("uses the randomizer return value as each element", () => {
            const values = [10, 20, 30];
            let i = 0;
            const result = Tyneq.random(3, () => values[i++]).toArray();
            expect(result).toEqual([10, 20, 30]);
        });

        it("works with object values", () => {
            const obj = { id: 1 };
            const result = Tyneq.random(3, () => obj).toArray();
            expect(result).toHaveLength(3);
            expect(result.every((x) => x === obj)).toBe(true);
        });
    });

    describe("edge cases", () => {
        it("returns an empty sequence when count is 0", () => {
            expect(Tyneq.random(0, () => 1).toArray()).toEqual([]);
        });

        it("does not call the randomizer when count is 0", () => {
            let called = false;
            Tyneq.random(0, () => { called = true; return 1; }).toArray();
            expect(called).toBe(false);
        });

        it("is re-iterable", () => {
            let n = 0;
            const seq = Tyneq.random(3, () => ++n);
            seq.toArray();
            seq.toArray();
            expect(n).toBe(6);
        });
    });

    describe("invalid arguments", () => {
        it("throws ArgumentOutOfRangeError when count is negative", () => {
            expect(() => Tyneq.random(-1, () => 1)).toThrow(ArgumentOutOfRangeError);
        });

        it("throws ArgumentError when count is a non-integer", () => {
            expect(() => Tyneq.random(1.5, () => 1)).toThrow(ArgumentError);
        });

        it("throws ArgumentNullError when randomizer is null", () => {
            expect(() => Tyneq.random(3, null as any)).toThrow(ArgumentNullError);
        });

        it("throws ArgumentError when randomizer is undefined", () => {
            expect(() => Tyneq.random(3, undefined as any)).toThrow(ArgumentError);
        });
    });
});
