import { describe, expect, it } from "vitest";
import { Tyneq, SequenceContainsNoElementsError } from "../../../../src";

describe("minMax", () => {
  describe("normal usage", () => {
    it("returns the correct min and max from a number sequence", () => {
      const { min, max } = Tyneq.from([3, 1, 4, 1, 5, 9, 2, 6]).minMax();
      expect(min).toBe(1);
      expect(max).toBe(9);
    });

    it("returns equal min and max for a single-element sequence", () => {
      const { min, max } = Tyneq.from([42]).minMax();
      expect(min).toBe(42);
      expect(max).toBe(42);
    });

    it("returns equal min and max when all elements are equal", () => {
      const { min, max } = Tyneq.from([5, 5, 5, 5]).minMax();
      expect(min).toBe(5);
      expect(max).toBe(5);
    });

    it("uses a custom comparer to find min and max by object property", () => {
      const data = [{ score: 3 }, { score: 1 }, { score: 4 }];
      const { min, max } = Tyneq.from(data).minMax((a, b) => a.score - b.score);
      expect(min).toEqual({ score: 1 });
      expect(max).toEqual({ score: 4 });
    });

    it("works correctly with negative numbers", () => {
      const { min, max } = Tyneq.from([-5, -1, -10, -3]).minMax();
      expect(min).toBe(-10);
      expect(max).toBe(-1);
    });
  });

  describe("error conditions", () => {
    it("throws SequenceContainsNoElementsError for an empty sequence", () => {
      expect(() =>
        Tyneq.from<number>([]).minMax()
      ).toThrow(SequenceContainsNoElementsError);
    });

    it("throws an error with the expected message for an empty sequence", () => {
      expect(() =>
        Tyneq.from<number>([]).minMax()
      ).toThrow("Sequence contains no elements.");
    });
  });
});
