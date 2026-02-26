import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("sequenceEqual", () => {
  it("compares element order and values", () => {
    expect(Tyneq.from([1, 2, 3]).sequenceEqual([1, 2, 3])).toBe(true);
  });
});
