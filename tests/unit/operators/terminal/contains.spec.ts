import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError } from "../../../../src";

describe("contains", () => {
    describe("normal usage", () => {
        it("returns true when the value exists in the sequence", () => {
            expect(Tyneq.from([1, 2, 3]).contains(2)).toBe(true);
        });

        it("returns false when the value does not exist in the sequence", () => {
            expect(Tyneq.from([1, 2, 3]).contains(99)).toBe(false);
        });

        it("returns false for an empty sequence", () => {
            expect(Tyneq.from<number>([]).contains(1)).toBe(false);
        });
    });

    describe("custom equality comparer", () => {
        it("uses the comparer for element comparison", () => {
            expect(
                Tyneq.from(["A", "B", "C"]).contains(
                    "b",
                    (a, b) => a.toLowerCase() === b.toLowerCase()
                )
            ).toBe(true);
        });

        it("returns false when comparer reports no match", () => {
            expect(
                Tyneq.from(["A", "B", "C"]).contains(
                    "d",
                    (a, b) => a.toLowerCase() === b.toLowerCase()
                )
            ).toBe(false);
        });
    });

    describe("invalid arguments", () => {
        it("throws ArgumentNullError when equalityComparer is null", () => {
            expect(() => Tyneq.from([1]).contains(1, null as any)).toThrow(ArgumentNullError);
        });
    });
});
