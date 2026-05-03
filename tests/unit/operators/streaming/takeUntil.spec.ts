import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("takeUntil", () => {
  describe("normal usage", () => {
    it("yields elements until predicate returns true, exclusive", () => {
      expect(Tyneq.from([1, 2, 3, 4, 5]).takeUntil((x) => x === 4).toArray()).toEqual([1, 2, 3]);
    });

    it("does not include the element that triggered the predicate", () => {
      expect(Tyneq.from([1, 10, 2, 3]).takeUntil((x) => x >= 10).toArray()).toEqual([1]);
    });

    it("stops calling predicate after it returns true", () => {
      let calls = 0;
      Tyneq.from([1, 2, 3, 4]).takeUntil((x) => { calls++; return x === 2; }).toArray();
      expect(calls).toBe(2);
    });
  });

  describe("edge cases", () => {
    it("returns all elements when predicate never returns true", () => {
      expect(Tyneq.from([1, 2, 3]).takeUntil((x) => x > 10).toArray()).toEqual([1, 2, 3]);
    });

    it("returns empty when predicate is true for the first element", () => {
      expect(Tyneq.from([5, 1, 2]).takeUntil((x) => x === 5).toArray()).toEqual([]);
    });

    it("returns empty for an empty source", () => {
      expect(Tyneq.from<number>([]).takeUntil((x) => x > 0).toArray()).toEqual([]);
    });

    it("passes the zero-based index to the predicate", () => {
      const indices: number[] = [];
      Tyneq.from(["a", "b", "c"]).takeUntil((_, i) => { indices.push(i); return i === 2; }).toArray();
      expect(indices).toEqual([0, 1, 2]);
    });

    it("can stop by index", () => {
      expect(Tyneq.from([10, 20, 30, 40]).takeUntil((_, i) => i === 2).toArray()).toEqual([10, 20]);
    });

    it("produces the same result on repeated iteration", () => {
      const seq = Tyneq.from([1, 2, 3, 4]).takeUntil((x) => x === 3);
      expect(seq.toArray()).toEqual([1, 2]);
      expect(seq.toArray()).toEqual([1, 2]);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when predicate is null", () => {
      expect(() => Tyneq.from([1]).takeUntil(null as any)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when predicate is undefined", () => {
      expect(() => Tyneq.from([1]).takeUntil(undefined as any)).toThrow(ArgumentError);
    });
  });
});
