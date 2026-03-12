import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("window", () => {
  describe("basic sliding windows", () => {
    it("produces overlapping windows of size 2", () => {
      const result = Tyneq.from([1, 2, 3, 4]).window(2).toArray();
      expect(result).toEqual([[1, 2], [2, 3], [3, 4]]);
    });

    it("produces overlapping windows of size 3", () => {
      const result = Tyneq.from([1, 2, 3, 4, 5]).window(3).toArray();
      expect(result).toEqual([[1, 2, 3], [2, 3, 4], [3, 4, 5]]);
    });

    it("yields each element as a single-element array when window size is 1", () => {
      const result = Tyneq.from([10, 20, 30]).window(1).toArray();
      expect(result).toEqual([[10], [20], [30]]);
    });
  });

  describe("boundary cases", () => {
    it("yields a single window when window size equals the sequence length", () => {
      const result = Tyneq.from([1, 2, 3]).window(3).toArray();
      expect(result).toEqual([[1, 2, 3]]);
    });

    it("handles a single element with window size 1", () => {
      const result = Tyneq.from([42]).window(1).toArray();
      expect(result).toEqual([[42]]);
    });

    it("yields an empty sequence when the source is empty", () => {
      const result = Tyneq.from<number>([]).window(3).toArray();
      expect(result).toEqual([]);
    });

    it("yields an empty sequence when the source is shorter than the window size", () => {
      const result = Tyneq.from([1, 2]).window(5).toArray();
      expect(result).toEqual([]);
    });

    it("throws ArgumentOutOfRangeError when window size is 0", () => {
      expect(() => Tyneq.from([1, 2, 3]).window(0)).toThrow();
    });
  });

  describe("snapshot integrity and re-iterability", () => {
    it("each emitted window is an independent snapshot array", () => {
      const windows = Tyneq.from([1, 2, 3]).window(2).toArray();
      expect(windows[0]).not.toBe(windows[1]);
    });

    it("produces the same results on repeated iteration", () => {
      const seq = Tyneq.from([1, 2, 3]).window(2);
      expect(seq.toArray()).toEqual([[1, 2], [2, 3]]);
      expect(seq.toArray()).toEqual([[1, 2], [2, 3]]);
    });
  });
});
