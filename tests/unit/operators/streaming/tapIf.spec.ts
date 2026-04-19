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

    it("passes the zero-based index to the action", () => {
      const indices: number[] = [];
      Tyneq.from(["a", "b", "c"]).tapIf((_, i) => indices.push(i), () => true).toArray();
      expect(indices).toEqual([0, 1, 2]);
    });

    it("index increments for every element even when action is not called", () => {
      let callCount = 0;
      let lastIndex = -1;
      Tyneq.from([1, 2, 3]).tapIf((_, i) => { callCount++; lastIndex = i; }, () => callCount === 0).toArray();
      expect(callCount).toBe(1);
      expect(lastIndex).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("index resets to 0 on each fresh enumeration", () => {
      const first: number[] = [];
      const second: number[] = [];
      const seq = Tyneq.from(["x", "y"]).tapIf((_, i) => first.push(i), () => true);
      seq.toArray();
      Tyneq.from(["x", "y"]).tapIf((_, i) => second.push(i), () => true).toArray();
      expect(first).toEqual([0, 1]);
      expect(second).toEqual([0, 1]);
    });

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
