import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("skipUntil", () => {
  describe("normal usage", () => {
    it("skips elements until predicate returns true, then yields the rest", () => {
      expect(Tyneq.from([1, 2, 3, 4, 5]).skipUntil((x) => x === 3).toArray()).toEqual([3, 4, 5]);
    });

    it("includes the triggering element in the output", () => {
      expect(Tyneq.from([1, 2, 10, 4]).skipUntil((x) => x >= 10).toArray()).toEqual([10, 4]);
    });

    it("stops calling predicate after it returns true", () => {
      let calls = 0;
      Tyneq.from([1, 2, 3, 4]).skipUntil((x) => { calls++; return x === 2; }).toArray();
      expect(calls).toBe(2);
    });
  });

  describe("edge cases", () => {
    it("returns empty when predicate never returns true", () => {
      expect(Tyneq.from([1, 2, 3]).skipUntil((x) => x > 10).toArray()).toEqual([]);
    });

    it("yields all elements when predicate is true for the first element", () => {
      expect(Tyneq.from([5, 1, 2]).skipUntil((x) => x === 5).toArray()).toEqual([5, 1, 2]);
    });

    it("returns empty for an empty source", () => {
      expect(Tyneq.from<number>([]).skipUntil((x) => x > 0).toArray()).toEqual([]);
    });

    it("passes the zero-based index to the predicate", () => {
      const indices: number[] = [];
      Tyneq.from(["a", "b", "c"]).skipUntil((_, i) => { indices.push(i); return i === 1; }).toArray();
      expect(indices).toEqual([0, 1]);
    });

    it("can trigger by index", () => {
      expect(Tyneq.from([10, 20, 30, 40]).skipUntil((_, i) => i === 2).toArray()).toEqual([30, 40]);
    });

    it("produces the same result on repeated iteration", () => {
      const seq = Tyneq.from([1, 2, 3, 4]).skipUntil((x) => x === 3);
      expect(seq.toArray()).toEqual([3, 4]);
      expect(seq.toArray()).toEqual([3, 4]);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when predicate is null", () => {
      expect(() => Tyneq.from([1]).skipUntil(null as any)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when predicate is undefined", () => {
      expect(() => Tyneq.from([1]).skipUntil(undefined as any)).toThrow(ArgumentError);
    });
  });
});
