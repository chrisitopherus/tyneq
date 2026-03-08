import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("intersperse", () => {
  describe("normal usage", () => {
    it("places the delimiter between every pair of consecutive elements", () => {
      const result = Tyneq.from([1, 2, 3]).intersperse(0).toArray();
      expect(result).toEqual([1, 0, 2, 0, 3]);
    });

    it("works with string elements and a string delimiter", () => {
      const result = Tyneq.from(["a", "b", "c"]).intersperse("-").toArray();
      expect(result).toEqual(["a", "-", "b", "-", "c"]);
    });

    it("produces a result of length 2n-1 for a source of n elements", () => {
      const n = 5;
      const result = Tyneq.from([1, 2, 3, 4, 5]).intersperse(0).toArray();
      expect(result).toHaveLength(2 * n - 1);
    });
  });

  describe("edge cases", () => {
    it("yields an empty sequence when the source is empty", () => {
      const result = Tyneq.from<number>([]).intersperse(0).toArray();
      expect(result).toEqual([]);
    });

    it("yields only the single element when the source has one element (no delimiter added)", () => {
      const result = Tyneq.from([42]).intersperse(0).toArray();
      expect(result).toEqual([42]);
    });

    it("places the delimiter exactly once between two elements", () => {
      const result = Tyneq.from([1, 2]).intersperse(99).toArray();
      expect(result).toEqual([1, 99, 2]);
    });

    it("produces the same results on repeated iteration", () => {
      const seq = Tyneq.from([1, 2, 3]).intersperse(0);
      expect(seq.toArray()).toEqual([1, 0, 2, 0, 3]);
      expect(seq.toArray()).toEqual([1, 0, 2, 0, 3]);
    });
  });
});
