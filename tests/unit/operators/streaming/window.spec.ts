import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentOutOfRangeError } from "../../../../src";

describe("window", () => {
  describe("sliding windows (default step = 1)", () => {
    it("yields overlapping windows of the given size", () => {
      expect(Tyneq.range(1, 5).window(3).toArray()).toEqual([[1, 2, 3], [2, 3, 4], [3, 4, 5]]);
    });

    it("yields one window when source length equals size", () => {
      expect(Tyneq.from([1, 2, 3]).window(3).toArray()).toEqual([[1, 2, 3]]);
    });

    it("yields one pair per adjacent pair for size 2", () => {
      expect(Tyneq.from([1, 2, 3, 4]).window(2).toArray()).toEqual([[1, 2], [2, 3], [3, 4]]);
    });
  });

  describe("tumbling windows (step = size)", () => {
    it("yields non-overlapping windows", () => {
      expect(Tyneq.range(1, 6).window(2, 2).toArray()).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it("yields no partial window when source length is not divisible by size", () => {
      expect(Tyneq.range(1, 5).window(2, 2).toArray()).toEqual([[1, 2], [3, 4]]);
    });

    it("produces a single window when step equals source length", () => {
      expect(Tyneq.from([1, 2, 3]).window(3, 3).toArray()).toEqual([[1, 2, 3]]);
    });
  });

  describe("step larger than size (gaps)", () => {
    it("skips elements between windows when step exceeds size", () => {
      // source [1..7], size=2, step=3: windows at indices 0,3,6 -> [1,2],[4,5],[7] -- [7] dropped (incomplete)
      expect(Tyneq.from([1, 2, 3, 4, 5, 6, 7]).window(2, 3).toArray()).toEqual([[1, 2], [4, 5]]);
    });

    it("yields a third window when the source is long enough to complete it", () => {
      // source [1..8], size=2, step=3: windows at indices 0,3,6 -> [1,2],[4,5],[7,8]
      expect(Tyneq.from([1, 2, 3, 4, 5, 6, 7, 8]).window(2, 3).toArray()).toEqual([[1, 2], [4, 5], [7, 8]]);
    });
  });

  describe("edge cases", () => {
    it("returns empty when source has fewer elements than size", () => {
      expect(Tyneq.from([1, 2]).window(5).toArray()).toEqual([]);
    });

    it("returns empty for an empty source", () => {
      expect(Tyneq.from<number>([]).window(3).toArray()).toEqual([]);
    });

    it("yields single-element windows when size is 1", () => {
      expect(Tyneq.from([1, 2, 3]).window(1).toArray()).toEqual([[1], [2], [3]]);
    });

    it("each yielded array is independent -- mutating one does not affect others", () => {
      const windows = Tyneq.from([1, 2, 3, 4]).window(2).toArray();
      windows[0][0] = 99;
      expect(windows[1][0]).toBe(2);
    });
  });

  describe("laziness", () => {
    it("produces the same result on repeated iteration", () => {
      const seq = Tyneq.range(1, 4).window(2);
      expect(seq.toArray()).toEqual([[1, 2], [2, 3], [3, 4]]);
      expect(seq.toArray()).toEqual([[1, 2], [2, 3], [3, 4]]);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentOutOfRangeError when size is 0", () => {
      expect(() => Tyneq.from([1]).window(0)).toThrow(ArgumentOutOfRangeError);
    });

    it("throws ArgumentOutOfRangeError when size is negative", () => {
      expect(() => Tyneq.from([1]).window(-1)).toThrow(ArgumentOutOfRangeError);
    });

    it("throws ArgumentOutOfRangeError when step is 0", () => {
      expect(() => Tyneq.from([1]).window(2, 0)).toThrow(ArgumentOutOfRangeError);
    });

    it("throws ArgumentOutOfRangeError when step is negative", () => {
      expect(() => Tyneq.from([1]).window(2, -1)).toThrow(ArgumentOutOfRangeError);
    });
  });
});
