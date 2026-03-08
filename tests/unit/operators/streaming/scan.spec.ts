import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("scan", () => {
  describe("normal usage", () => {
    it("emits running sum values starting from seed 0", () => {
      const result = Tyneq.from([1, 2, 3, 4, 5])
        .scan(0, (acc, n) => acc + n)
        .toArray();
      expect(result).toEqual([1, 3, 6, 10, 15]);
    });

    it("accumulates string concatenation", () => {
      const result = Tyneq.from(["a", "b", "c"])
        .scan("", (acc, s) => acc + s)
        .toArray();
      expect(result).toEqual(["a", "ab", "abc"]);
    });

    it("uses a non-zero seed in accumulation", () => {
      const result = Tyneq.from([1, 2, 3])
        .scan(10, (acc, n) => acc + n)
        .toArray();
      expect(result).toEqual([11, 13, 16]);
    });
  });

  describe("edge cases", () => {
    it("yields an empty sequence when the source is empty", () => {
      const result = Tyneq.from<number>([])
        .scan(0, (acc, n) => acc + n)
        .toArray();
      expect(result).toEqual([]);
    });

    it("yields exactly one value for a single-element source", () => {
      const result = Tyneq.from([5])
        .scan(0, (acc, n) => acc + n)
        .toArray();
      expect(result).toEqual([5]);
    });

    it("does not yield the seed itself as part of the output", () => {
      const result = Tyneq.from([1])
        .scan(100, (acc, n) => acc + n)
        .toArray();
      expect(result).not.toContain(100);
      expect(result).toEqual([101]);
    });

    it("produces the same results on repeated iteration", () => {
      const seq = Tyneq.from([1, 2, 3]).scan(0, (acc, n) => acc + n);
      expect(seq.toArray()).toEqual([1, 3, 6]);
      expect(seq.toArray()).toEqual([1, 3, 6]);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when accumulator is null", () => {
      expect(() =>
        Tyneq.from([1]).scan(0, null as any)
      ).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when accumulator is undefined", () => {
      expect(() =>
        Tyneq.from([1]).scan(0, undefined as any)
      ).toThrow(ArgumentError);
    });
  });
});
