import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("pairwise", () => {
  describe("normal usage", () => {
    it("yields adjacent pairs as [previous, current]", () => {
      const result = Tyneq.from([1, 2, 3, 4]).pairwise().toArray();
      expect(result).toEqual([[1, 2], [2, 3], [3, 4]]);
    });
  });

  describe("edge cases", () => {
    it("returns empty when source has fewer than two elements", () => {
      expect(Tyneq.from([1]).pairwise().toArray()).toEqual([]);
    });

    it("returns empty for an empty source", () => {
      expect(Tyneq.from<number>([]).pairwise().toArray()).toEqual([]);
    });

    it("yields one pair for a two-element source", () => {
      expect(Tyneq.from([1, 2]).pairwise().toArray()).toEqual([[1, 2]]);
    });

    it("produces the same results on repeated iteration", () => {
      const seq = Tyneq.from([1, 2, 3]).pairwise();
      expect(seq.toArray()).toEqual([[1, 2], [2, 3]]);
      expect(seq.toArray()).toEqual([[1, 2], [2, 3]]);
    });
  });
});
