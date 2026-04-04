import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentOutOfRangeError } from "../../../../src";

describe("elementAtOrDefault", () => {
  describe("normal usage", () => {
    it("returns default when index is outside bounds", () => {
      expect(Tyneq.from([10, 20]).elementAtOrDefault(9, 99)).toBe(99);
    });

    it("returns the element at a valid index", () => {
      expect(Tyneq.from([10, 20, 30]).elementAtOrDefault(1, 99)).toBe(20);
    });

    it("returns the first element at index 0", () => {
      expect(Tyneq.from([10, 20]).elementAtOrDefault(0, 99)).toBe(10);
    });

    it("returns default for an empty source", () => {
      expect(Tyneq.from<number>([]).elementAtOrDefault(0, 99)).toBe(99);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentOutOfRangeError for a negative index", () => {
      expect(() => Tyneq.from([1]).elementAtOrDefault(-1, 0)).toThrow(ArgumentOutOfRangeError);
    });
  });
});
