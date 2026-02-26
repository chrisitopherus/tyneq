import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("elementAtOrDefault", () => {
  it("returns default when index is outside bounds", () => {
    expect(Tyneq.from([10, 20]).elementAtOrDefault(9, 99)).toBe(99);
  });
});
