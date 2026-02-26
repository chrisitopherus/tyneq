import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("lastOrDefault", () => {
  it("returns default when no element matches", () => {
    expect(Tyneq.from([1, 3, 5]).lastOrDefault(x => x % 2 === 0, 0)).toBe(0);
  });
});
