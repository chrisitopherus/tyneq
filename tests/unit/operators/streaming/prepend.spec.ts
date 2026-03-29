import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("prepend", () => {
  describe("normal usage", () => {
    it("prepends an element to the start", () => {
      expect(Tyneq.from([2, 3]).prepend(1).toArray()).toEqual([1, 2, 3]);
    });
  });

  describe("edge cases", () => {
    it("prepends to an empty source", () => {
      expect(Tyneq.from<number>([]).prepend(1).toArray()).toEqual([1]);
    });

    it("prepends to a single-element source", () => {
      expect(Tyneq.from([2]).prepend(1).toArray()).toEqual([1, 2]);
    });

    it("produces the same results on repeated iteration", () => {
      const seq = Tyneq.from([2, 3]).prepend(1);
      expect(seq.toArray()).toEqual([1, 2, 3]);
      expect(seq.toArray()).toEqual([1, 2, 3]);
    });
  });
});
