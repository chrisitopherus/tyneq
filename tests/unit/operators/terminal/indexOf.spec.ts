import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("indexOf", () => {
  describe("normal usage", () => {
    it("returns the index of the first match", () => {
      expect(Tyneq.from([1, 3, 5, 8]).indexOf((x) => x % 2 === 0)).toBe(3);
    });

    it("returns 0 when the first element matches", () => {
      expect(Tyneq.from([2, 4, 6]).indexOf((x) => x % 2 === 0)).toBe(0);
    });

    it("returns -1 when no element matches", () => {
      expect(Tyneq.from([1, 3, 5]).indexOf((x) => x % 2 === 0)).toBe(-1);
    });

    it("respects a non-zero startIndex", () => {
      expect(Tyneq.from([2, 4, 6]).indexOf((x) => x % 2 === 0, 1)).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("returns -1 for an empty source", () => {
      expect(Tyneq.from<number>([]).indexOf((x) => x > 0)).toBe(-1);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when predicate is null", () => {
      expect(() => Tyneq.from([1]).indexOf(null as any)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when predicate is undefined", () => {
      expect(() => Tyneq.from([1]).indexOf(undefined as any)).toThrow(ArgumentError);
    });
  });
});
