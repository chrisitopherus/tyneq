import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("zip", () => {
  describe("normal usage", () => {
    it("zips two sequences using a selector", () => {
      const result = Tyneq.from([1, 2, 3]).zip([10, 20], (a, b) => a + b).toArray();
      expect(result).toEqual([11, 22]);
    });

    it("stops at the shorter sequence when source is longer", () => {
      expect(Tyneq.from([1, 2, 3, 4]).zip([10, 20], (a, b) => a + b).toArray()).toEqual([11, 22]);
    });

    it("stops at the shorter sequence when other is longer", () => {
      expect(Tyneq.from([1, 2]).zip([10, 20, 30], (a, b) => a + b).toArray()).toEqual([11, 22]);
    });

    it("zips sequences of equal length completely", () => {
      expect(Tyneq.from([1, 2]).zip([10, 20], (a, b) => a + b).toArray()).toEqual([11, 22]);
    });
  });

  describe("edge cases", () => {
    it("returns empty when source is empty", () => {
      expect(Tyneq.from<number>([]).zip([1, 2], (a, b) => a + b).toArray()).toEqual([]);
    });

    it("returns empty when other is empty", () => {
      expect(Tyneq.from([1, 2]).zip([], (a, b) => a + b).toArray()).toEqual([]);
    });

    it("produces the same results on repeated iteration", () => {
      const seq = Tyneq.from([1, 2]).zip([10, 20], (a, b) => a + b);
      expect(seq.toArray()).toEqual([11, 22]);
      expect(seq.toArray()).toEqual([11, 22]);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when other is null", () => {
      expect(() => Tyneq.from([1]).zip(null as any, (a: number, b: number) => a + b)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when other is undefined", () => {
      expect(() => Tyneq.from([1]).zip(undefined as any, (a: number, b: number) => a + b)).toThrow(ArgumentError);
    });

    it("throws ArgumentNullError when selector is null", () => {
      expect(() => Tyneq.from([1]).zip([1], null as any)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when selector is undefined", () => {
      expect(() => Tyneq.from([1]).zip([1], undefined as any)).toThrow(ArgumentError);
    });
  });
});
