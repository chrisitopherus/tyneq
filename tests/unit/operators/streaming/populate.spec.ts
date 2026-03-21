import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("populate", () => {
  describe("normal usage", () => {
    it("replaces all elements with the given constant value", () => {
      const result = Tyneq.from([1, 2, 3]).populate(0).toArray();
      expect(result).toEqual([0, 0, 0]);
    });

    it("preserves the cardinality of the source sequence", () => {
      const result = Tyneq.from([10, 20, 30, 40]).populate("x").toArray();
      expect(result).toHaveLength(4);
    });

    it("can populate with a different type than the source (numbers replaced with strings)", () => {
      const result = Tyneq.from([1, 2, 3]).populate("replaced").toArray();
      expect(result).toEqual(["replaced", "replaced", "replaced"]);
    });
  });

  describe("edge cases", () => {
    it("yields an empty sequence when the source is empty", () => {
      const result = Tyneq.from<number>([]).populate(99).toArray();
      expect(result).toEqual([]);
    });

    it("yields a single-element sequence when the source has one element", () => {
      const result = Tyneq.from([42]).populate("only").toArray();
      expect(result).toEqual(["only"]);
    });

    it("produces the same results on repeated iteration", () => {
      const seq = Tyneq.from([1, 2, 3]).populate(7);
      expect(seq.toArray()).toEqual([7, 7, 7]);
      expect(seq.toArray()).toEqual([7, 7, 7]);
    });
  });
});
