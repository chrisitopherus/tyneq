import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentOutOfRangeError, ArgumentError } from "../../../../src";

describe("repeat", () => {
  describe("normal usage", () => {
    it("repeats the source sequence the given number of times", () => {
      expect(Tyneq.from([1, 2]).repeat(3).toArray()).toEqual([1, 2, 1, 2, 1, 2]);
    });

    it("repeats a single-element sequence", () => {
      expect(Tyneq.from([42]).repeat(4).toArray()).toEqual([42, 42, 42, 42]);
    });

    it("repeats once with count 1 -- returns source unchanged", () => {
      expect(Tyneq.from([1, 2, 3]).repeat(1).toArray()).toEqual([1, 2, 3]);
    });
  });

  describe("edge cases", () => {
    it("returns empty sequence when count is 0", () => {
      expect(Tyneq.from([1, 2]).repeat(0).toArray()).toEqual([]);
    });

    it("returns empty sequence when source is empty regardless of count", () => {
      expect(Tyneq.from<number>([]).repeat(5).toArray()).toEqual([]);
    });

    it("produces the same result on repeated iteration", () => {
      const seq = Tyneq.from([1, 2]).repeat(2);
      expect(seq.toArray()).toEqual([1, 2, 1, 2]);
      expect(seq.toArray()).toEqual([1, 2, 1, 2]);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentOutOfRangeError when count is negative", () => {
      expect(() => Tyneq.from([1]).repeat(-1)).toThrow(ArgumentOutOfRangeError);
    });

    it("throws ArgumentError when count is not an integer", () => {
      expect(() => Tyneq.from([1]).repeat(1.5)).toThrow(ArgumentError);
    });
  });
});
