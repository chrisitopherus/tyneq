import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("append", () => {
  describe("normal usage", () => {
    it("appends an element to the end", () => {
      expect(Tyneq.from([1, 2]).append(3).toArray()).toEqual([1, 2, 3]);
    });
  });

  describe("edge cases", () => {
    it("appends to an empty source", () => {
      expect(Tyneq.from<number>([]).append(1).toArray()).toEqual([1]);
    });

    it("appends to a single-element source", () => {
      expect(Tyneq.from([1]).append(2).toArray()).toEqual([1, 2]);
    });

    it("produces the same results on repeated iteration", () => {
      const seq = Tyneq.from([1, 2]).append(3);
      expect(seq.toArray()).toEqual([1, 2, 3]);
      expect(seq.toArray()).toEqual([1, 2, 3]);
    });
  });
});
