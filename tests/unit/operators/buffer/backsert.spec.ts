import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("backsert", () => {
  it("inserts from the back where 0 is last position", () => {
    const result = Tyneq.from([1, 2, 3, 4]).backsert(0, [9]).toArray();
    expect(result).toEqual([1, 2, 3, 9, 4]);
  });

  it("prepends when back index is larger than sequence length", () => {
    const result = Tyneq.from([2, 3]).backsert(10, [1]).toArray();
    expect(result).toEqual([1, 2, 3]);
  });
});
