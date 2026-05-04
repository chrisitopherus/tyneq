import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentError, ArgumentOutOfRangeError } from "../../../../src";

describe("elementAt", () => {
  describe("normal usage", () => {
    it("returns the element at the specified index", () => {
      expect(Tyneq.from([10, 20, 30]).elementAt(1)).toBe(20);
    });

    it("returns the first element at index 0", () => {
      expect(Tyneq.from([10, 20, 30]).elementAt(0)).toBe(10);
    });

    it("returns the last element at the last index", () => {
      expect(Tyneq.from([10, 20, 30]).elementAt(2)).toBe(30);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentOutOfRangeError for a negative index", () => {
      expect(() => Tyneq.from([1, 2, 3]).elementAt(-1)).toThrow(ArgumentOutOfRangeError);
    });

    it("throws ArgumentOutOfRangeError when index exceeds sequence length", () => {
      expect(() => Tyneq.from([1, 2, 3]).elementAt(10)).toThrow(ArgumentOutOfRangeError);
    });

    it("throws ArgumentError for a non-integer index (float)", () => {
      expect(() => Tyneq.from([1, 2, 3]).elementAt(1.5)).toThrow(ArgumentError);
    });

    it("throws ArgumentError for NaN index", () => {
      expect(() => Tyneq.from([1, 2, 3]).elementAt(NaN)).toThrow(ArgumentError);
    });

    it("throws ArgumentError for Infinity index", () => {
      expect(() => Tyneq.from([1, 2, 3]).elementAt(Infinity)).toThrow(ArgumentError);
    });
  });
});
