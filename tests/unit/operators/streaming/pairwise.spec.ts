import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("pairwise", () => {
  it("yields adjacent pairs as [previous, current]", () => {
    const result = Tyneq.from([1, 2, 3, 4]).pairwise().toArray();
    expect(result).toEqual([[1, 2], [2, 3], [3, 4]]);
  });

  it("returns empty when sequence has fewer than two elements", () => {
    expect(Tyneq.from([1]).pairwise().toArray()).toEqual([]);
  });
});
