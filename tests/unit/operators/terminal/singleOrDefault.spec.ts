import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("singleOrDefault", () => {
  it("returns default when no element matches", () => {
    expect(Tyneq.from([1, 2, 3]).singleOrDefault(x => x === 9, -1)).toBe(-1);
  });
});
