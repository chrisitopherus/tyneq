import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("tapIf", () => {
  describe("normal usage", () => {
    it("runs side effects only when predicate is true", () => {
      const seen: number[] = [];
      const result = Tyneq.from([1, 2, 3]).tapIf((x) => seen.push(x), () => false).toArray();

      expect(result).toEqual([1, 2, 3]);
      expect(seen).toEqual([]);
    });

    it("runs side effects for all elements when predicate always returns true", () => {
      const seen: number[] = [];
      Tyneq.from([1, 2, 3]).tapIf((x) => seen.push(x), () => true).toArray();
      expect(seen).toEqual([1, 2, 3]);
    });
  });

  describe("edge cases", () => {
    it("yields no elements and runs no side effects for an empty source", () => {
      const seen: number[] = [];
      const result = Tyneq.from<number>([]).tapIf((x) => seen.push(x), () => true).toArray();
      expect(result).toEqual([]);
      expect(seen).toEqual([]);
    });

    it("produces the same results on repeated iteration", () => {
      const seq = Tyneq.from([1, 2]).tapIf(() => void 0, () => true);
      expect(seq.toArray()).toEqual([1, 2]);
      expect(seq.toArray()).toEqual([1, 2]);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when action is null", () => {
      expect(() => Tyneq.from([1]).tapIf(null as any, () => true)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when action is undefined", () => {
      expect(() => Tyneq.from([1]).tapIf(undefined as any, () => true)).toThrow(ArgumentError);
    });

    it("throws ArgumentNullError when predicate is null", () => {
      expect(() => Tyneq.from([1]).tapIf(() => void 0, null as any)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when predicate is undefined", () => {
      expect(() => Tyneq.from([1]).tapIf(() => void 0, undefined as any)).toThrow(ArgumentError);
    });
  });
});
