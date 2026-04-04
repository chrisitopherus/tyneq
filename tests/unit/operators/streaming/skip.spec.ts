import { describe, expect, it } from "vitest";
import { Tyneq, ArgumentOutOfRangeError } from "../../../../src";

describe("skip", () => {
  it("skips first N elements", () => {
    expect(Tyneq.from([1, 2, 3, 4]).skip(2).toArray()).toEqual([3, 4]);
  });

  it("skip 0 returns all elements", () => {
    expect(Tyneq.from([1, 2, 3]).skip(0).toArray()).toEqual([1, 2, 3]);
  });

  it("returns empty when skip count exceeds sequence length", () => {
    expect(Tyneq.from([1, 2]).skip(10).toArray()).toEqual([]);
  });

  it("returns empty when skip count equals sequence length", () => {
    expect(Tyneq.from([1, 2, 3]).skip(3).toArray()).toEqual([]);
  });

  it("throws ArgumentOutOfRangeError when count is negative", () => {
    expect(() => Tyneq.from([1, 2, 3]).skip(-1).toArray()).toThrow(ArgumentOutOfRangeError);
  });
});
