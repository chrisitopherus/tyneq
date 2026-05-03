import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("endsWith", () => {
  describe("normal usage", () => {
    it("returns true when source ends with the suffix", () => {
      expect(Tyneq.from([1, 2, 3, 4, 5]).endsWith([4, 5])).toBe(true);
    });

    it("returns false when source does not end with the suffix", () => {
      expect(Tyneq.from([1, 2, 3, 4, 5]).endsWith([3, 5])).toBe(false);
    });

    it("returns true when suffix equals the full source", () => {
      expect(Tyneq.from([1, 2, 3]).endsWith([1, 2, 3])).toBe(true);
    });

    it("returns false when suffix is longer than the source", () => {
      expect(Tyneq.from([1, 2]).endsWith([1, 2, 3])).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns true for an empty suffix", () => {
      expect(Tyneq.from([1, 2, 3]).endsWith([])).toBe(true);
    });

    it("returns true when both source and suffix are empty", () => {
      expect(Tyneq.from<number>([]).endsWith([])).toBe(true);
    });

    it("returns false when source is empty and suffix is not", () => {
      expect(Tyneq.from<number>([]).endsWith([1])).toBe(false);
    });

    it("returns false when suffix shares elements with source but not at the tail", () => {
      expect(Tyneq.from([1, 2, 3]).endsWith([1, 2])).toBe(false);
    });
  });

  describe("custom equality comparer", () => {
    it("uses the comparer for element comparison", () => {
      expect(
        Tyneq.from(["A", "B", "C"]).endsWith(
          ["b", "c"],
          (a, b) => a.toLowerCase() === b.toLowerCase()
        )
      ).toBe(true);
    });

    it("returns false when comparer reports mismatch at the tail", () => {
      expect(
        Tyneq.from(["A", "B", "C"]).endsWith(
          ["b", "d"],
          (a, b) => a.toLowerCase() === b.toLowerCase()
        )
      ).toBe(false);
    });

    it("uses custom comparer when suffix equals full source length", () => {
      expect(
        Tyneq.from([1, 2, 3]).endsWith([2, 3, 4], (a, b) => a === b - 1)
      ).toBe(true);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when sequence is null", () => {
      expect(() => Tyneq.from([1]).endsWith(null as any)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when sequence is undefined", () => {
      expect(() => Tyneq.from([1]).endsWith(undefined as any)).toThrow(ArgumentError);
    });

    it("throws ArgumentNullError when equalityComparer is null", () => {
      expect(() => Tyneq.from([1]).endsWith([1], null as any)).toThrow(ArgumentNullError);
    });
  });
});
