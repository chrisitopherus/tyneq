import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("zip", () => {
  it("zips two sequences using selector", () => {
    const result = Tyneq.from([1, 2, 3]).zip([10, 20], (a, b) => a + b).toArray();
    expect(result).toEqual([11, 22]);
  });
});
