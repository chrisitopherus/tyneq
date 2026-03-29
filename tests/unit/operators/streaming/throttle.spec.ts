import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentOutOfRangeError } from "../../../../src";

describe("throttle", () => {
  describe("normal usage", () => {
    it("keeps every Nth element starting from the first", () => {
      expect(Tyneq.from([1, 2, 3, 4, 5, 6]).throttle(2).toArray()).toEqual([1, 3, 5]);
    });

    it("throttle(1) keeps all elements", () => {
      expect(Tyneq.from([1, 2, 3]).throttle(1).toArray()).toEqual([1, 2, 3]);
    });

    it("throttle larger than sequence length returns only the first element", () => {
      expect(Tyneq.from([1, 2, 3]).throttle(10).toArray()).toEqual([1]);
    });
  });

  describe("edge cases", () => {
    it("returns empty for an empty source", () => {
      expect(Tyneq.from<number>([]).throttle(2).toArray()).toEqual([]);
    });

    it("produces the same results on repeated iteration", () => {
      const seq = Tyneq.from([1, 2, 3, 4]).throttle(2);
      expect(seq.toArray()).toEqual([1, 3]);
      expect(seq.toArray()).toEqual([1, 3]);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentOutOfRangeError when count is 0", () => {
      expect(() => Tyneq.from([1]).throttle(0)).toThrow(ArgumentOutOfRangeError);
    });

    it("throws ArgumentOutOfRangeError when count is negative", () => {
      expect(() => Tyneq.from([1]).throttle(-1)).toThrow(ArgumentOutOfRangeError);
    });
  });
});
