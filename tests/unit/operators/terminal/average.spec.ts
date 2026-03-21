import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("average", () => {
  describe("normal usage", () => {
    it("computes the arithmetic mean of a number sequence", () => {
      const result = Tyneq.from([1, 2, 3, 4, 5]).average((x) => x);
      expect(result).toBe(3);
    });

    it("uses a selector to extract numeric values from objects", () => {
      const data = [{ value: 10 }, { value: 20 }, { value: 30 }];
      const result = Tyneq.from(data).average((x) => x.value);
      expect(result).toBe(20);
    });

    it("handles floating-point values", () => {
      const result = Tyneq.from([1.0, 2.0, 3.0]).average((x) => x);
      expect(result).toBeCloseTo(2.0, 5);
    });

    it("handles a floating-point result that is not a whole number", () => {
      const result = Tyneq.from([1, 2]).average((x) => x);
      expect(result).toBe(1.5);
    });
  });

  describe("edge cases", () => {
    it("returns 0 for an empty sequence", () => {
      const result = Tyneq.from<number>([]).average((x) => x);
      expect(result).toBe(0);
    });

    it("returns the element value itself for a single-element sequence", () => {
      const result = Tyneq.from([7]).average((x) => x);
      expect(result).toBe(7);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when selector is null", () => {
      expect(() =>
        Tyneq.from([1]).average(null as any)
      ).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when selector is undefined", () => {
      expect(() =>
        Tyneq.from([1]).average(undefined as any)
      ).toThrow(ArgumentError);
    });
  });
});
