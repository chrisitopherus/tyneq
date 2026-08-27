import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("distinct", () => {
  it("returns unique values", () => {
    expect(Tyneq.from([1, 1, 2, 3, 2]).distinct().toArray()).toEqual([1, 2, 3]);
  });

  it("returns same sequence when there are no duplicates", () => {
    expect(Tyneq.from([1, 2, 3]).distinct().toArray()).toEqual([1, 2, 3]);
  });

  it("returns empty sequence for empty input", () => {
    expect(Tyneq.from([]).distinct().toArray()).toEqual([]);
  });

  it("returns single element when all elements are identical", () => {
    expect(Tyneq.from([7, 7, 7, 7]).distinct().toArray()).toEqual([7]);
  });

  it("preserves first-seen order of unique elements", () => {
    expect(Tyneq.from([3, 1, 2, 1, 3]).distinct().toArray()).toEqual([3, 1, 2]);
  });

  it("streams the source incrementally and does not hang on an infinite source (F4)", () => {
    function* naturals() {
      let n = 0;
      while (true) yield n++;
    }

    const result = Tyneq.from(naturals()).distinct().take(3).toArray();
    expect(result).toEqual([0, 1, 2]);
  });
});
