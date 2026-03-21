import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("cast", () => {
  it("passes all elements through unchanged at runtime", () => {
    const result = Tyneq.from([1, 2, 3]).cast<number>().toArray();
    expect(result).toEqual([1, 2, 3]);
  });

  it("returns empty sequence when source is empty", () => {
    expect(Tyneq.from<number>([]).cast<number>().toArray()).toEqual([]);
  });

  it("preserves element count", () => {
    const result = Tyneq.from(["a", "b", "c"]).cast<string>().toArray();
    expect(result).toHaveLength(3);
  });

  it("can be used in a chain", () => {
    const result = Tyneq.from([1, 2, 3, 4])
      .cast<number>()
      .where((x) => x % 2 === 0)
      .toArray();
    expect(result).toEqual([2, 4]);
  });

  it("returned sequence can be iterated more than once", () => {
    const seq = Tyneq.from([10, 20, 30]).cast<number>();
    expect(seq.toArray()).toEqual([10, 20, 30]);
    expect(seq.toArray()).toEqual([10, 20, 30]);
  });
});
