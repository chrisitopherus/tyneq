import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("take", () => {
  it("takes first N elements", () => {
    expect(Tyneq.from([1, 2, 3, 4]).take(2).toArray()).toEqual([1, 2]);
  });

  it("take 0 returns empty sequence", () => {
    expect(Tyneq.from([1, 2, 3]).take(0).toArray()).toEqual([]);
  });

  it("returns all elements when take count exceeds sequence length", () => {
    expect(Tyneq.from([1, 2, 3]).take(100).toArray()).toEqual([1, 2, 3]);
  });

  it("take negative count returns empty sequence", () => {
    expect(Tyneq.from([1, 2, 3]).take(-5).toArray()).toEqual([]);
  });

  it("returns single element when take count is 1", () => {
    expect(Tyneq.from([10, 20, 30]).take(1).toArray()).toEqual([10]);
  });
});
