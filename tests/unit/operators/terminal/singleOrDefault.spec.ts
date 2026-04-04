import { describe, expect, it } from "vitest";
import { Tyneq, InvalidOperationError, ArgumentNullError, ArgumentError } from "../../../../src";

describe("singleOrDefault", () => {
  describe("normal usage", () => {
    it("returns default when no element matches", () => {
      expect(Tyneq.from([1, 2, 3]).singleOrDefault((x) => x === 9, -1)).toBe(-1);
    });

    it("returns the matching element when exactly one element matches", () => {
      expect(Tyneq.from([1, 2, 3]).singleOrDefault((x) => x === 2, -1)).toBe(2);
    });

    it("returns default for an empty source", () => {
      expect(Tyneq.from<number>([]).singleOrDefault((x) => x > 0, -1)).toBe(-1);
    });
  });

  describe("error conditions", () => {
    it("throws InvalidOperationError when more than one element matches", () => {
      expect(() =>
        Tyneq.from([1, 2, 3]).singleOrDefault((x) => x > 1, -1)
      ).toThrow(InvalidOperationError);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when predicate is null", () => {
      expect(() => Tyneq.from([1]).singleOrDefault(null as any, -1)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when predicate is undefined", () => {
      expect(() => Tyneq.from([1]).singleOrDefault(undefined as any, -1)).toThrow(ArgumentError);
    });
  });
});
