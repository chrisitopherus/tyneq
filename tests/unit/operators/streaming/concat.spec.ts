import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentNullError, ArgumentError } from "../../../../src";

describe("concat", () => {
  describe("normal usage", () => {
    it("concatenates two sequences", () => {
      expect(Tyneq.from([1, 2]).concat([3, 4]).toArray()).toEqual([1, 2, 3, 4]);
    });
  });

  describe("edge cases", () => {
    it("concatenates an empty source with a non-empty sequence", () => {
      expect(Tyneq.from<number>([]).concat([1, 2]).toArray()).toEqual([1, 2]);
    });

    it("concatenates a non-empty source with an empty sequence", () => {
      expect(Tyneq.from([1, 2]).concat([]).toArray()).toEqual([1, 2]);
    });

    it("concatenates two empty sequences", () => {
      expect(Tyneq.from<number>([]).concat([]).toArray()).toEqual([]);
    });

    it("produces the same results on repeated iteration", () => {
      const seq = Tyneq.from([1]).concat([2]);
      expect(seq.toArray()).toEqual([1, 2]);
      expect(seq.toArray()).toEqual([1, 2]);
    });
  });

  describe("invalid arguments", () => {
    it("throws ArgumentNullError when other is null", () => {
      expect(() => Tyneq.from([1]).concat(null as any)).toThrow(ArgumentNullError);
    });

    it("throws ArgumentError when other is undefined", () => {
      expect(() => Tyneq.from([1]).concat(undefined as any)).toThrow(ArgumentError);
    });
  });
});
