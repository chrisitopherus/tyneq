import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("aggregate", () => {
  describe("normal usage", () => {
    it("folds a sequence to a single value using a sum accumulator", () => {
      const result = Tyneq.from([1, 2, 3, 4, 5]).aggregate(
        0,
        (acc, item) => acc + item,
        (acc) => acc
      );
      expect(result).toBe(15);
    });

    it("applies a resultSelector to transform the final accumulated value", () => {
      const result = Tyneq.from([1, 2, 3]).aggregate(
        0,
        (acc, item) => acc + item,
        (acc) => `total:${acc}`
      );
      expect(result).toBe("total:6");
    });

    it("accumulates object properties correctly", () => {
      const data = [{ n: 1 }, { n: 2 }, { n: 3 }];
      const result = Tyneq.from(data).aggregate(
        0,
        (acc, item) => acc + item.n,
        (acc) => acc
      );
      expect(result).toBe(6);
    });
  });

  describe("edge cases", () => {
    it("returns the seed value unchanged when the sequence is empty", () => {
      const result = Tyneq.from<number>([]).aggregate(
        42,
        (acc, item) => acc + item,
        (acc) => acc
      );
      expect(result).toBe(42);
    });

    it("passes the seed through the resultSelector even for an empty sequence", () => {
      const result = Tyneq.from<number>([]).aggregate(
        5,
        (acc, item) => acc + item,
        (acc) => acc * 2
      );
      expect(result).toBe(10);
    });

    it("handles a single-element sequence", () => {
      const result = Tyneq.from([10]).aggregate(
        0,
        (acc, item) => acc + item,
        (acc) => acc
      );
      expect(result).toBe(10);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when func is null", () => {
      expect(() =>
        Tyneq.from([1]).aggregate(0, null as any, (acc) => acc)
      ).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when func is undefined", () => {
      expect(() =>
        Tyneq.from([1]).aggregate(0, undefined as any, (acc) => acc)
      ).toThrow(ArgumentError);
    });

    it("throws ArgumentNullError when resultSelector is null", () => {
      expect(() =>
        Tyneq.from([1]).aggregate(0, (acc, item) => acc + item, null as any)
      ).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when resultSelector is undefined", () => {
      expect(() =>
        Tyneq.from([1]).aggregate(0, (acc, item) => acc + item, undefined as any)
      ).toThrow(ArgumentError);
    });
  });
});
