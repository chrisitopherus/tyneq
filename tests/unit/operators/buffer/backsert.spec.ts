import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentError, ArgumentNullError } from "../../../../src";

describe("backsert", () => {
    it("backsert(0, other) appends other after all source elements", () => {
        const result = Tyneq.from([1, 2, 3, 4]).backsert(0, [9]).toArray();
        expect(result).toEqual([1, 2, 3, 4, 9]);
    });

    it("backsert(1, other) inserts before the last element", () => {
        const result = Tyneq.from([1, 2, 3]).backsert(1, [9, 10]).toArray();
        expect(result).toEqual([1, 2, 9, 10, 3]);
    });

    it("backsert(2, other) inserts before the second-to-last element", () => {
        const result = Tyneq.from([1, 2, 3, 4]).backsert(2, [9]).toArray();
        expect(result).toEqual([1, 2, 9, 3, 4]);
    });

    it("prepends when backIndex is >= source length", () => {
        const result = Tyneq.from([2, 3]).backsert(10, [1]).toArray();
        expect(result).toEqual([1, 2, 3]);
    });

    it("returns only inserted sequence when source is empty", () => {
        const result = Tyneq.from<number>([]).backsert(0, [1, 2]).toArray();
        expect(result).toEqual([1, 2]);
    });

    it("inserts nothing when other is empty", () => {
        const result = Tyneq.from([1, 2, 3]).backsert(0, []).toArray();
        expect(result).toEqual([1, 2, 3]);
    });

    it("returns empty when both source and other are empty", () => {
        const result = Tyneq.from([]).backsert(0, []).toArray();
        expect(result).toEqual([]);
    });

    it("re-iterates independently", () => {
        const seq = Tyneq.from([1, 2]).backsert(0, [9]);
        expect(seq.toArray()).toEqual([1, 2, 9]);
        expect(seq.toArray()).toEqual([1, 2, 9]);
    });

    it("throws ArgumentNullError when other is null", () => {
        expect(() => Tyneq.from([1]).backsert(0, null as any)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when other is undefined", () => {
        expect(() => Tyneq.from([1]).backsert(0, undefined as any)).toThrow(ArgumentError);
    });
});
