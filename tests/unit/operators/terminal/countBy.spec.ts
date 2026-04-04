import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("countBy", () => {
  describe("normal usage", () => {
    it("counts elements matching a predicate", () => {
      expect(Tyneq.from([1, 2, 3, 4, 5]).countBy((x) => x % 2 === 0)).toBe(2);
    });

    it("returns 0 when no elements match", () => {
      expect(Tyneq.from([1, 3, 5]).countBy((x) => x % 2 === 0)).toBe(0);
    });

    it("returns length when all elements match", () => {
      expect(Tyneq.from([2, 4, 6]).countBy((x) => x % 2 === 0)).toBe(3);
    });
  });

  describe("edge cases", () => {
    it("returns 0 for an empty source", () => {
      expect(Tyneq.from<number>([]).countBy((x) => x > 0)).toBe(0);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when predicate is null", () => {
      expect(() => Tyneq.from([1]).countBy(null as any)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when predicate is undefined", () => {
      expect(() => Tyneq.from([1]).countBy(undefined as any)).toThrow(ArgumentError);
    });
  });
});
