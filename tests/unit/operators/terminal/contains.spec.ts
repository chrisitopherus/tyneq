import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("contains", () => {
  it("checks whether a value exists", () => {
    expect(Tyneq.from([1, 2, 3]).contains(2)).toBe(true);
  });

  it("returns false when the element does not exist", () => {
    expect(Tyneq.from([1, 2, 3]).contains(99)).toBe(false);
  });

  it("returns false for empty sequence", () => {
    expect(Tyneq.from<number>([]).contains(1)).toBe(false);
  });
});
