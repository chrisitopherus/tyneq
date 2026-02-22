import { describe, expect, it } from "vitest";
import { Tyneq } from "../../../../src";

describe("contains", () => {
  it("checks whether a value exists", () => {
    expect(Tyneq.from([1, 2, 3]).contains(2)).toBe(true);
  });
});
