import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("union", () => {
  it("returns distinct union preserving first-seen order", () => {
    expect(Tyneq.from([1, 2, 2]).union([2, 3]).toArray()).toEqual([1, 2, 3]);
  });

  it("returns right-side elements when left sequence is empty", () => {
    expect(Tyneq.from<number>([]).union([1, 2, 3]).toArray()).toEqual([1, 2, 3]);
  });

  it("returns left-side elements when right sequence is empty", () => {
    expect(Tyneq.from([1, 2, 3]).union([]).toArray()).toEqual([1, 2, 3]);
  });

  it("deduplicates elements present in both sequences", () => {
    expect(Tyneq.from([1, 2, 3]).union([2, 3, 4]).toArray()).toEqual([1, 2, 3, 4]);
  });

  it("returns empty sequence when both sequences are empty", () => {
    expect(Tyneq.from<number>([]).union([]).toArray()).toEqual([]);
  });
});
