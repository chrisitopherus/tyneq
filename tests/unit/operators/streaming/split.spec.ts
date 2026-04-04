import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("split", () => {
  describe("normal usage", () => {
    it("splits on delimiter predicate and excludes delimiters", () => {
      expect(Tyneq.from([1, 0, 2, 3, 0, 4]).split((x) => x === 0).toArray()).toEqual([[1], [2, 3], [4]]);
    });

    it("produces a single chunk when no elements match the predicate", () => {
      expect(Tyneq.from([1, 2, 3]).split((x) => x === 0).toArray()).toEqual([[1, 2, 3]]);
    });
  });

  describe("edge cases", () => {
    it("returns empty for an empty source", () => {
      expect(Tyneq.from<number>([]).split((x) => x === 0).toArray()).toEqual([]);
    });

    it("skips empty chunks caused by consecutive delimiters", () => {
      expect(Tyneq.from([1, 0, 0, 2]).split((x) => x === 0).toArray()).toEqual([[1], [2]]);
    });

    it("skips leading delimiters", () => {
      expect(Tyneq.from([0, 1, 2]).split((x) => x === 0).toArray()).toEqual([[1, 2]]);
    });

    it("skips trailing delimiters", () => {
      expect(Tyneq.from([1, 2, 0]).split((x) => x === 0).toArray()).toEqual([[1, 2]]);
    });

    it("produces the same results on repeated iteration", () => {
      const seq = Tyneq.from([1, 0, 2]).split((x) => x === 0);
      expect(seq.toArray()).toEqual([[1], [2]]);
      expect(seq.toArray()).toEqual([[1], [2]]);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when splitOn is null", () => {
      expect(() => Tyneq.from([1]).split(null as any)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when splitOn is undefined", () => {
      expect(() => Tyneq.from([1]).split(undefined as any)).toThrow(ArgumentError);
    });
  });
});
