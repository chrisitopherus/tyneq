import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("any", () => {
  it("returns true when any element matches", () => {
    expect(Tyneq.from([1, 2, 3]).any(x => x > 2)).toBe(true);
  });
});
