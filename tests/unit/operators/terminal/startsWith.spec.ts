import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("startsWith", () => {
  describe("normal usage", () => {
    it("returns true when source starts with the prefix", () => {
      expect(Tyneq.from([1, 2, 3]).startsWith([1, 2])).toBe(true);
    });

    it("returns false when source does not start with the prefix", () => {
      expect(Tyneq.from([1, 2, 3]).startsWith([2, 3])).toBe(false);
    });

    it("returns true when prefix equals the full source", () => {
      expect(Tyneq.from([1, 2, 3]).startsWith([1, 2, 3])).toBe(true);
    });

    it("returns false when prefix is longer than the source", () => {
      expect(Tyneq.from([1, 2]).startsWith([1, 2, 3])).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns true for an empty prefix", () => {
      expect(Tyneq.from([1, 2, 3]).startsWith([])).toBe(true);
    });

    it("returns true when both source and prefix are empty", () => {
      expect(Tyneq.from<number>([]).startsWith([])).toBe(true);
    });

    it("returns false when source is empty and prefix is not", () => {
      expect(Tyneq.from<number>([]).startsWith([1])).toBe(false);
    });
  });

  describe("custom equality comparer", () => {
    it("uses the comparer for element comparison", () => {
      expect(
        Tyneq.from(["A", "B", "C"]).startsWith(
          ["a", "b"],
          (a, b) => a.toLowerCase() === b.toLowerCase()
        )
      ).toBe(true);
    });

    it("returns false when comparer reports mismatch at the prefix", () => {
      expect(
        Tyneq.from(["A", "B", "C"]).startsWith(
          ["a", "c"],
          (a, b) => a.toLowerCase() === b.toLowerCase()
        )
      ).toBe(false);
    });

    it("uses custom comparer when prefix equals full source length", () => {
      // source [2,3,4], prefix [1,2,3]: comparer matches each pair (a === b + 1)
      expect(
        Tyneq.from([2, 3, 4]).startsWith([1, 2, 3], (a, b) => a === b + 1)
      ).toBe(true);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when sequence is null", () => {
      expect(() => Tyneq.from([1]).startsWith(null as any)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when sequence is undefined", () => {
      expect(() => Tyneq.from([1]).startsWith(undefined as any)).toThrow(ArgumentError);
    });

    it("throws ArgumentNullError when equalityComparer is null", () => {
      expect(() => Tyneq.from([1]).startsWith([1], null as any)).toThrow(ArgumentNullError);
    });
  });
});
