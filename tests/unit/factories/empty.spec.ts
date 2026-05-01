import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../src";

describe("Tyneq.empty", () => {
    describe("normal usage", () => {
        it("returns a sequence with zero elements", () => {
            expect(Tyneq.empty<number>().toArray()).toEqual([]);
        });

        it("count returns 0", () => {
            expect(Tyneq.empty<string>().count()).toBe(0);
        });

        it("works with any type parameter", () => {
            expect(Tyneq.empty<{ id: number }>().toArray()).toEqual([]);
        });
    });

    describe("edge cases", () => {
        it("is re-iterable", () => {
            const seq = Tyneq.empty<number>();
            expect(seq.toArray()).toEqual([]);
            expect(seq.toArray()).toEqual([]);
        });

        it("each call returns an independent empty sequence", () => {
            const a = Tyneq.empty<number>();
            const b = Tyneq.empty<number>();
            expect(a).not.toBe(b);
        });

        it("supports chaining without error", () => {
            expect(Tyneq.empty<number>().where((x) => x > 0).toArray()).toEqual([]);
        });

        it("any() returns false", () => {
            expect(Tyneq.empty<number>().any((x) => x > 0)).toBe(false);
        });
    });
});
