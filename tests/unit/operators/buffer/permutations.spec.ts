import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("permutations", () => {
    it("returns all permutations of a 3-element sequence", () => {
        const result = Tyneq.from([1, 2, 3]).permutations().toArray();

        expect(result).toHaveLength(6);
        expect(result).toContainEqual([1, 2, 3]);
        expect(result).toContainEqual([1, 3, 2]);
        expect(result).toContainEqual([2, 1, 3]);
        expect(result).toContainEqual([2, 3, 1]);
        expect(result).toContainEqual([3, 1, 2]);
        expect(result).toContainEqual([3, 2, 1]);
    });

    it("returns a single permutation for a 1-element sequence", () => {
        expect(Tyneq.from([42]).permutations().toArray()).toEqual([[42]]);
    });

    it("returns a single empty permutation for an empty sequence", () => {
        expect(Tyneq.from([]).permutations().toArray()).toEqual([[]]);
    });

    it("returns 2 permutations for a 2-element sequence", () => {
        const result = Tyneq.from(["a", "b"]).permutations().toArray();
        expect(result).toHaveLength(2);
        expect(result).toContainEqual(["a", "b"]);
        expect(result).toContainEqual(["b", "a"]);
    });

    it("returns 24 permutations for a 4-element sequence", () => {
        const result = Tyneq.from([1, 2, 3, 4]).permutations().toArray();
        expect(result).toHaveLength(24);
    });

    it("each permutation contains all original elements", () => {
        const source = [10, 20, 30];
        const result = Tyneq.from(source).permutations().toArray();
        for (const perm of result) {
            expect(perm.sort()).toEqual([...source].sort());
        }
    });

    it("each permutation is a distinct array instance", () => {
        const result = Tyneq.from([1, 2]).permutations().toArray();
        expect(result[0]).not.toBe(result[1]);
    });

    it("works on a sequence with duplicate values", () => {
        const result = Tyneq.from([1, 1, 2]).permutations().toArray();
        expect(result).toHaveLength(6);
    });

});
