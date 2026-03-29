import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("sequenceEqual", () => {
  describe("normal usage", () => {
    it("returns true when sequences have the same elements in order", () => {
      expect(Tyneq.from([1, 2, 3]).sequenceEqual([1, 2, 3])).toBe(true);
    });

    it("returns false when sequences have the same elements in different order", () => {
      expect(Tyneq.from([1, 2, 3]).sequenceEqual([3, 2, 1])).toBe(false);
    });

    it("returns false when sequences have different values", () => {
      expect(Tyneq.from([1, 2, 3]).sequenceEqual([1, 2, 4])).toBe(false);
    });

    it("returns false when sequences have different lengths", () => {
      expect(Tyneq.from([1, 2]).sequenceEqual([1, 2, 3])).toBe(false);
    });

    it("uses a custom equality comparer", () => {
      expect(
        Tyneq.from([1, 2, 3]).sequenceEqual([2, 3, 4], (a, b) => a === b - 1)
      ).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("returns true for two empty sequences", () => {
      expect(Tyneq.from<number>([]).sequenceEqual([])).toBe(true);
    });

    it("returns false when source is empty and other is not", () => {
      expect(Tyneq.from<number>([]).sequenceEqual([1])).toBe(false);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when other is null", () => {
      expect(() => Tyneq.from([1]).sequenceEqual(null as any)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when other is undefined", () => {
      expect(() => Tyneq.from([1]).sequenceEqual(undefined as any)).toThrow(ArgumentError);
    });
  });
});
