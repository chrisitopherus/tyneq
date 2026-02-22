import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("single", () => {
  it("returns the only matching element", () => {
    expect(Tyneq.from([1, 2, 3]).single(x => x === 2)).toBe(2);
  });
});
