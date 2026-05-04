import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentError, ArgumentOutOfRangeError } from "../../../../src";

describe("skipLast", () => {
  describe("normal usage", () => {
    it("skips last N elements", () => {
      expect(Tyneq.from([1, 2, 3, 4]).skipLast(2).toArray()).toEqual([1, 2]);
    });

    it("skipLast(0) returns the full sequence", () => {
      expect(Tyneq.from([1, 2, 3]).skipLast(0).toArray()).toEqual([1, 2, 3]);
    });

    it("skipLast exceeding length returns empty sequence", () => {
      expect(Tyneq.from([1, 2]).skipLast(10).toArray()).toEqual([]);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentOutOfRangeError for a negative count", () => {
      expect(() => Tyneq.from([1, 2, 3]).skipLast(-1)).toThrow(ArgumentOutOfRangeError);
    });

    it("throws ArgumentError for a non-integer count (float)", () => {
      expect(() => Tyneq.from([1, 2, 3]).skipLast(1.5)).toThrow(ArgumentError);
    });

    it("throws ArgumentError for NaN count", () => {
      expect(() => Tyneq.from([1, 2, 3]).skipLast(NaN)).toThrow(ArgumentError);
    });
  });
});
