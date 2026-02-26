import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("firstOrDefault", () => {
  it("returns default when no matching element exists", () => {
    expect(Tyneq.from([1, 3, 5]).firstOrDefault(x => x % 2 === 0, 42)).toBe(42);
  });
});
