import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../src";

describe("Tyneq.isNullOrEmpty", () => {
    describe("null and undefined inputs", () => {
        it("returns true for null", () => {
            expect(Tyneq.isNullOrEmpty<number>(null)).toBe(true);
        });

        it("returns true for undefined", () => {
            expect(Tyneq.isNullOrEmpty<number>(undefined)).toBe(true);
        });
    });

    describe("empty iterables", () => {
        it("returns true for an empty array", () => {
            expect(Tyneq.isNullOrEmpty([])).toBe(true);
        });

        it("returns true for an empty Set", () => {
            expect(Tyneq.isNullOrEmpty(new Set())).toBe(true);
        });
    });

    describe("non-empty iterables", () => {
        it("returns false for an array with elements", () => {
            expect(Tyneq.isNullOrEmpty([1, 2, 3])).toBe(false);
        });

        it("returns false for a single-element array", () => {
            expect(Tyneq.isNullOrEmpty([0])).toBe(false);
        });

        it("returns false for a non-empty Set", () => {
            expect(Tyneq.isNullOrEmpty(new Set([1]))).toBe(false);
        });

        it("returns false for a string with characters", () => {
            expect(Tyneq.isNullOrEmpty("abc")).toBe(false);
        });
    });
});
