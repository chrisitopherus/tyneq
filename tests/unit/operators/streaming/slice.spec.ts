import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentOutOfRangeError } from "../../../../src";

describe("slice", () => {
  describe("normal usage", () => {
    it("yields elements between start (inclusive) and end (exclusive)", () => {
      expect(Tyneq.from([0, 1, 2, 3, 4]).slice(1, 4).toArray()).toEqual([1, 2, 3]);
    });

    it("yields from start to end of sequence when end is omitted", () => {
      expect(Tyneq.from([0, 1, 2, 3, 4]).slice(2).toArray()).toEqual([2, 3, 4]);
    });

    it("yields the full sequence when start is 0 and end is omitted", () => {
      expect(Tyneq.from([1, 2, 3]).slice(0).toArray()).toEqual([1, 2, 3]);
    });

    it("yields the full sequence when start is 0 and end equals length", () => {
      expect(Tyneq.from([1, 2, 3]).slice(0, 3).toArray()).toEqual([1, 2, 3]);
    });

    it("yields a single element when start and end are adjacent", () => {
      expect(Tyneq.from([10, 20, 30]).slice(1, 2).toArray()).toEqual([20]);
    });
  });

  describe("edge cases", () => {
    it("returns empty when start equals end", () => {
      expect(Tyneq.from([1, 2, 3]).slice(2, 2).toArray()).toEqual([]);
    });

    it("returns empty when start is beyond the sequence length", () => {
      expect(Tyneq.from([1, 2]).slice(10).toArray()).toEqual([]);
    });

    it("returns empty for an empty source", () => {
      expect(Tyneq.from<number>([]).slice(0, 3).toArray()).toEqual([]);
    });

    it("clamps to sequence length when end exceeds it", () => {
      expect(Tyneq.from([1, 2, 3]).slice(1, 100).toArray()).toEqual([2, 3]);
    });

    it("produces the same result on repeated iteration", () => {
      const seq = Tyneq.from([1, 2, 3, 4, 5]).slice(1, 4);
      expect(seq.toArray()).toEqual([2, 3, 4]);
      expect(seq.toArray()).toEqual([2, 3, 4]);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentOutOfRangeError when start is negative", () => {
      expect(() => Tyneq.from([1]).slice(-1)).toThrow(ArgumentOutOfRangeError);
    });

    it("throws ArgumentOutOfRangeError when end is negative", () => {
      expect(() => Tyneq.from([1]).slice(0, -1)).toThrow(ArgumentOutOfRangeError);
    });

    it("throws ArgumentOutOfRangeError when end is less than start", () => {
      expect(() => Tyneq.from([1, 2, 3]).slice(3, 1)).toThrow(ArgumentOutOfRangeError);
    });
  });
});
