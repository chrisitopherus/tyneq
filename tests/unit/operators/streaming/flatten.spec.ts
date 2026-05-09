import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("flatten", () => {
  describe("normal usage", () => {
    it("flattens one level of nested arrays", () => {
      expect(Tyneq.from([[1, 2], [3, 4], [5]]).flatten().toArray()).toEqual([1, 2, 3, 4, 5]);
    });

    it("flattens strings into characters", () => {
      expect(Tyneq.from(["hello", "world"]).flatten().toArray()).toEqual(
        ["h", "e", "l", "l", "o", "w", "o", "r", "l", "d"]
      );
    });

    it("flattens a single inner iterable", () => {
      expect(Tyneq.from([[1, 2, 3]]).flatten().toArray()).toEqual([1, 2, 3]);
    });

    it("preserves order across inner iterables", () => {
      expect(Tyneq.from([[3, 1], [4, 1], [5]]).flatten().toArray()).toEqual([3, 1, 4, 1, 5]);
    });
  });

  describe("edge cases", () => {
    it("returns empty sequence when source is empty", () => {
      expect(Tyneq.from<number[]>([]).flatten().toArray()).toEqual([]);
    });

    it("returns empty sequence when all inner iterables are empty", () => {
      expect(Tyneq.from([[], [], []]).flatten().toArray()).toEqual([]);
    });

    it("skips empty inner iterables and yields elements from non-empty ones", () => {
      expect(Tyneq.from([[], [1], [], [2, 3], []]).flatten().toArray()).toEqual([1, 2, 3]);
    });

    it("does not flatten more than one level of nesting", () => {
      expect(Tyneq.from([[[1, 2]], [[3]]]).flatten().toArray()).toEqual([[1, 2], [3]]);
    });
  });

  describe("laziness", () => {
    it("produces the same result on repeated iteration", () => {
      const seq = Tyneq.from([[1, 2], [3]]).flatten();
      expect(seq.toArray()).toEqual([1, 2, 3]);
      expect(seq.toArray()).toEqual([1, 2, 3]);
    });
  });
});
